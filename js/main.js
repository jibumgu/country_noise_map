const ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
const INFO_URL = "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json";

const SKY_RES = 160;        // skyline samples per unit of width (one landmark = 1 unit)
const UNITS_ON_SCREEN = 3.4; // how many units fit across the screen
const SCROLL_UNITS = 0.05;  // units per second, so the spectrum drifts along slowly
const BAR_STEP = 7;         // pixels from one frequency bar to the next
const SMOOTH_RATE = 3.5;    // how quickly bars follow their target (higher = snappier)
const FADE_MS = 1200;       // fade-in duration
const OUT_MS = 450;         // fade-out duration, short so the old spectrum does not ghost over the new one
const CLICK_SLOP = 6;       // px a pointer may travel and still count as a click (not a drag)
// Touch screens have no wheel or hover, so the hints speak differently there
const TOUCH = window.matchMedia("(pointer: coarse)").matches;
const HINT_MAP = TOUCH ? "나라를 눌러 보세요 · 핀치로 확대" : "나라를 선택하세요 · 휠로 확대";
const HINT_WAVE = TOUCH ? "화면을 누르면 지도로 돌아갑니다" : "화면을 누르면 지도로 돌아갑니다";
const HINT_TOUR = TOUCH ? "감상 모드 · 화면을 누르면 멈춥니다" : "감상 모드 · 마우스를 움직이면 멈춥니다";
const IDLE_MS = 25000;      // how long with no input before the tour starts
const TOUR_STEP_MS = 6200;  // how long the tour spends on each country

// Hue per continent: each continent has its own colour family
const HUE = { Asia: 12, Europe: 212, Africa: 38, "North America": 132, "South America": 286, Oceania: 172, Antarctic: 0 };
const CONTINENT_KO = { Asia: "아시아", Europe: "유럽", Africa: "아프리카", "North America": "북아메리카", "South America": "남아메리카", Oceania: "오세아니아", Antarctic: "남극" };

// Seeded RNG: the same country always produces the same skyline
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const clamp01 = v => Math.min(1, Math.max(0, v));
const norm = (v, lo, hi) => (hi === lo ? 0.5 : clamp01((v - lo) / (hi - lo)));
const easeOut = t => 1 - Math.pow(1 - t, 3);

function continentOf(c) {
  if (!c) return "Unknown";
  if (c.region === "Americas") return c.subregion === "South America" ? "South America" : "North America";
  if (c.region === "Antarctic") return "Antarctic";
  return c.region; // Asia, Europe, Africa, Oceania
}

// Hue (0..360) of a palette colour, or null for near-greys like white and black
function hueOf(color) {
  if (color[0] !== "#") {
    const m = color.match(/hsl\(\s*([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  }
  const n = parseInt(color.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.12) return null;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

// The hue farthest from every colour in the palette, so the centre line never blends into the bars
function contrastHue(palette, fallback) {
  const hues = palette.map(hueOf).filter(h => h !== null);
  if (!hues.length) return (fallback + 180) % 360;
  let best = 0, bestScore = -1;
  for (let h = 0; h < 360; h += 10) {
    const score = Math.min(...hues.map(x => {
      const dist = Math.abs(h - x) % 360;
      return Math.min(dist, 360 - dist);
    }));
    if (score > bestScore) { bestScore = score; best = h; }
  }
  return best;
}

function displayName(c, fallback) {
  return (c && c.translations && c.translations.kor && c.translations.kor.common) || (c && c.name.common) || fallback;
}

// Plain city blocks of random heights, used between landmarks (and for countries with none)
function fillerPart(w, rng) {
  const ends = [], heights = [];
  let acc = 0;
  while (acc < w) {
    acc += 0.02 + 0.04 * rng();
    ends.push(Math.min(acc, w));
    heights.push(rng() < 0.25 ? 0.6 + 0.4 * rng() : 0.1 + 0.5 * rng());
  }
  return {
    w,
    height: x => {
      const pos = x * w;
      for (let k = 0; k < ends.length; k++) if (pos <= ends[k]) return heights[k];
      return 0;
    }
  };
}

// Lays landmarks and filler blocks side by side and samples the result into one height array
function buildSkyline(landmarks, rng) {
  const parts = [];
  if (landmarks.length === 0) {
    for (let k = 0; k < 8; k++) parts.push(fillerPart(0.6 + 0.6 * rng(), rng));
  } else {
    for (const lm of landmarks) {
      parts.push(fillerPart(0.4 + 0.4 * rng(), rng));
      parts.push({ w: 1, height: lm.height });
    }
    parts.push(fillerPart(0.5 + 0.5 * rng(), rng));
  }

  const total = parts.reduce((s, p) => s + p.w, 0);
  const N = Math.round(total * SKY_RES);
  const heights = new Float32Array(N);
  let start = 0, k = 0;
  for (const p of parts) {
    const end = start + p.w;
    for (; k < N && k / SKY_RES < end; k++) {
      heights[k] = p.height(((k / SKY_RES) - start) / p.w);
    }
    start = end;
  }
  // Per-sample grain, so the mirrored silhouette shivers like a noise trace
  // Slow undulation: random anchors every STEP samples, blended smoothly between them (no flicker)
  const STEP = 40;
  const anchors = Math.ceil(N / STEP) + 1;
  const pts = Array.from({ length: anchors }, () => rng() * 2 - 1);
  pts[anchors - 1] = pts[0]; // loop seamlessly
  const grain = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.floor(i / STEP), f = (i % STEP) / STEP;
    const s = f * f * (3 - 2 * f);
    grain[i] = pts[a] * (1 - s) + pts[a + 1] * s;
  }
  return { heights, grain, N, total };
}

function init(topo, list) {
  const info = new Map(list.map(c => [String(c.ccn3).padStart(3, "0"), c]));

  // The most languages any country has, used to scale a country's language count into 0..1
  const lHi = Math.max(...list.map(c => Object.keys(c.languages || {}).length));

  // Each country's colour and skyline
  const sigCache = new Map();
  function signature(feature) {
    if (sigCache.has(feature.id)) return sigCache.get(feature.id);
    const c = info.get(feature.id);
    const continent = continentOf(c);
    const languages = c ? Object.keys(c.languages || {}).length : 0;

    const l = norm(languages, 0, lHi);                              // languages -> colour saturation
    const lat = c && c.latlng ? c.latlng[0] : 0;                    // latitude  -> colour shift
    const rng = mulberry32(parseInt(feature.id, 10) * 9973 + 17);
    const landmarks = landmarksFor(c && c.name.common);

    const hue = ((HUE[continent] ?? 0) + lat * 0.2 + 360) % 360;
    const sat = 40 + 25 * l;
    const skyline = buildSkyline(landmarks, rng);

    const sig = {
      feature, continent, hue, sat,
      sky: skyline,
      name: displayName(c, feature.properties.name),
      palette: PALETTES[c && c.name.common] ||
        [-40, 0, 50].map(d => `hsl(${((hue + d + 360) % 360).toFixed(1)} ${sat.toFixed(1)}% 66%)`),
      landmarks: landmarks.map(L => L.label),
      product: landmarks.length > 0 && landmarks.every(L => L.product),
      sub: [
        landmarks.length && (landmarks.every(L => L.product) ? "특산물" : "랜드마크") + " · " + landmarks.map(L => L.label).join(" · "),
        c && c.subregion,
        c && c.capital && c.capital[0] && `수도 ${c.capital[0]}`
      ].filter(Boolean).join(" · "),
      phase: rng() * skyline.total, // each country starts at its own point along its skyline
      // The centre line drifts up and down slowly, each country at its own pace
      drift: { freq: 0.18 + 0.22 * rng(), phase: rng() * Math.PI * 2, amp: 0.014 + 0.016 * rng() }
    };
    sig.lineHue = contrastHue(sig.palette, hue);
    sigCache.set(feature.id, sig);
    return sig;
  }

  // ----- Map -----
  const countries = topojson.feature(topo, topo.objects.countries).features;
  const drawable = countries.filter(f => f.id !== "010"); // hide Antarctica
  const mapEl = document.getElementById("map");
  const tip = document.getElementById("tip");
  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);
  const sphere = { type: "Sphere" };
  const graticule = d3.geoGraticule10();

  const svg = d3.select(mapEl).html("")
    .append("svg")
    .attr("role", "img")
    .attr("aria-label", "세계지도");
  const g = svg.append("g");
  const sphereEl = g.append("path").attr("class", "sphere");
  const gratEl = g.append("path").attr("class", "grat");
  // One plate per continent: its countries merged into a single shape, so the land reads as one piece
  const plates = g.append("g").attr("class", "plates");
  const continentIds = new Map();
  for (const f of drawable) {
    const cont = signature(f).continent;
    if (!continentIds.has(cont)) continentIds.set(cont, new Set());
    continentIds.get(cont).add(f.id);
  }
  for (const [cont, ids] of continentIds) {
    if (cont === "Unknown" || cont === "Antarctic") continue;
    const geoms = topo.objects.countries.geometries.filter(geo => ids.has(geo.id));
    plates.append("path")
      .datum(topojson.merge(topo, geoms))
      .attr("class", "plate")
      .style("--h", HUE[cont]);
  }
  // Borders between countries, drawn as thin lines on top of the plates
  const borderMesh = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
  const borders = g.append("path").attr("class", "borders");

  const paths = g.selectAll("path.country")
    .data(drawable)
    .join("path")
    .attr("class", "country")
    .attr("tabindex", 0)
    .each(function (f, i) {
      this.style.setProperty("--i", i); // staggers the entrance animation
    });
  paths.append("title").text(f => signature(f).name);

  // ----- Country names, fading in as the map is zoomed -----
  const boxes = new Map(); // per country: centre and size (map pixels) of its largest landmass
  function mainPolygon(f) {
    if (f.geometry.type === "Polygon") return f;
    let best = null, bestArea = -1;
    for (const coordinates of f.geometry.coordinates) {
      const poly = { type: "Polygon", coordinates };
      const area = d3.geoArea(poly);
      if (area > bestArea) { bestArea = area; best = poly; }
    }
    return best;
  }
  const labelLayer = g.append("g").attr("class", "labels");
  const labels = labelLayer.selectAll("text")
    .data(drawable)
    .join("text")
    .attr("class", "label")
    .text(f => signature(f).name);

  // Zoom and pan: wheel, pinch or drag. Escape resets the view.
  let mapW = 0, mapH = 0;
  const zoom = d3.zoom()
    .scaleExtent([1, 12])
    .on("zoom", e => {
      g.attr("transform", e.transform);
      // Zoomed in, the tilt melts away so the map fills the whole screen with no slanted edges
      const flat = clamp01((e.transform.k - 1) / 0.5);
      mapEl.style.setProperty("--flat", flat.toFixed(3));
      // Labels read the zoom level from one variable and decide their own opacity and size in CSS
      labelLayer.node().style.setProperty("--k", e.transform.k.toFixed(3));
    });
  svg.call(zoom);

  function fitMap() {
    mapW = mapEl.clientWidth;
    mapH = mapEl.clientHeight;
    svg.attr("viewBox", `0 0 ${mapW} ${mapH}`);
    projection.fitExtent([[mapW * 0.04, mapH * 0.1], [mapW * 0.96, mapH * 0.9]], sphere);
    sphereEl.attr("d", path(sphere));
    gratEl.attr("d", path(graticule));
    paths.attr("d", path);
    plates.selectAll("path.plate").attr("d", d => path(d));
    borders.attr("d", path(borderMesh));
    labels.each(function (f) {
      const poly = mainPolygon(f);
      const [cx, cy] = path.centroid(poly);
      const [[x0, y0], [x1, y1]] = path.bounds(poly);
      if (!isFinite(cx) || !isFinite(cy)) return;
      boxes.set(f.id, { cx, cy, w: x1 - x0, h: y1 - y0 });
      this.setAttribute("x", cx.toFixed(1));
      this.setAttribute("y", cy.toFixed(1));
      this.style.setProperty("--w", (x1 - x0).toFixed(1));
    });
    zoom.extent([[0, 0], [mapW, mapH]]).translateExtent([[0, 0], [mapW, mapH]]);
    svg.call(zoom.transform, homeTransform());
  }

  // The resting view. On a tall, narrow screen the whole world would be a thin strip,
  // so it starts zoomed in (the world is wider than the screen and can be panned).
  function homeTransform() {
    if (mapH <= mapW * 1.15) return d3.zoomIdentity;
    const k = Math.min(2.8, (mapH * 0.5) / (mapW * 0.46));
    return d3.zoomIdentity.translate((mapW - k * mapW) / 2, (mapH - k * mapH) / 2).scale(k);
  }

  // Hover name follows the pointer
  paths
    .on("pointerenter", (e, f) => {
      if (e.pointerType === "touch") return; // no hover on touch, so a name tip would just get stuck
      tip.textContent = signature(f).name;
      tip.classList.add("on");
    })
    .on("pointermove", e => { tip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 14}px)`; })
    .on("pointerleave", () => {
      tip.classList.remove("on");
    });

  // Click vs drag: a pointer that travelled is a pan, not a selection
  let downAt = null;
  svg.on("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
  paths.on("click", (e, f) => {
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > CLICK_SLOP) return;
    e.stopPropagation();
    enter(f, { x: e.clientX, y: e.clientY });
  });
  paths.on("keydown", (e, f) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      enter(f, { x: r.x + r.width / 2, y: r.y + r.height / 2 });
    }
  });

  // ----- Skyline rendering -----
  const canvas = document.getElementById("wave");
  const ctx = canvas.getContext("2d");
  const body = document.body;
  const hintEl = document.getElementById("hint");
  let cw = 0, ch = 0;
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");

  // Ambient stars behind the map
  const ambient = document.getElementById("ambient");
  const actx = ambient.getContext("2d");
  const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
  let stars = [];
  function makeStars() {
    const n = Math.round((cw * ch) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * cw, y: Math.random() * ch,
      r: 0.5 + Math.random() * 1.2,
      tw: 0.4 + Math.random() * 1.2, ph: Math.random() * Math.PI * 2,
      depth: 0.2 + Math.random()
    }));
  }

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    off.width = cw;
    off.height = ch;
    ambient.width = cw * dpr;
    ambient.height = ch * dpr;
    actx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Layers fade in when entered and fade out when left or replaced
  let layers = [];
  const rgba = (sig, a) => `hsla(${sig.hue.toFixed(1)} ${sig.sat.toFixed(1)}% 62% / ${a})`;
  // A horizontal gradient that spreads the given colours evenly across the screen
  function paletteGradient(colors) {
    const g = ctx.createLinearGradient(0, 0, cw, 0);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    return g;
  }

  // Building height with grain mixed in: the skyline becomes a noise-like waveform
  // Linear interpolation between samples, so bars glide instead of stepping (and flickering)
  function sampleSky(sig, u) {
    const { N, heights, grain } = sig.sky;
    const pos = u * SKY_RES;
    const i0 = Math.floor(pos), f = pos - i0;
    const k0 = ((i0 % N) + N) % N, k1 = (k0 + 1) % N;
    const h = heights[k0] * (1 - f) + heights[k1] * f;
    const g = grain[k0] * (1 - f) + grain[k1] * f;
    return Math.max(0, h * (0.92 + 0.08 * g) + 0.03 * g);
  }

  // Frequency view: mirrored bars about a centre line, each bar a sample of the country's spectrum.
  // The spectrum drifts sideways slowly.
  // Each bar eases toward its target instead of jumping to it, and neighbours blend,
  // so the spectrum swells and settles like a real analyser.
  function drawSpectrum(layer, opacity, time) {
    if (opacity <= 0) { layer.bars = null; return; }
    const sig = layer.sig;
    const d = sig.drift;
    const midY = ch / 2;
    const maxH = ch * 0.4;
    const unitsPerPx = UNITS_ON_SCREEN / cw;
    const u0 = sig.phase + time * SCROLL_UNITS;
    const barW = BAR_STEP * 0.55;
    const count = Math.ceil(cw / BAR_STEP);

    // Raw target per bar, then blended with its neighbours
    const raw = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      raw[i] = sampleSky(sig, u0 + (BAR_STEP / 2 + i * BAR_STEP) * unitsPerPx) * maxH;
    }
    const target = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const left = raw[Math.max(0, i - 1)], right = raw[Math.min(count - 1, i + 1)];
      target[i] = left * 0.25 + raw[i] * 0.5 + right * 0.25;
    }

    // Ease each bar toward its target, frame-rate independent
    if (!layer.bars || layer.bars.length !== count) layer.bars = Float32Array.from(target);
    const dt = layer.lastT === undefined ? 0 : Math.max(0, time - layer.lastT);
    layer.lastT = time;
    const k = 1 - Math.exp(-dt * SMOOTH_RATE);
    for (let i = 0; i < count; i++) layer.bars[i] += (target[i] - layer.bars[i]) * k;


    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = rgba(sig, 0.85);
    ctx.shadowColor = rgba(sig, 0.35);
    ctx.shadowBlur = 10;
    const barsPath = new Path2D();
    for (let i = 0; i < count; i++) {
      const x = BAR_STEP / 2 + i * BAR_STEP;
      const half = Math.max(1, layer.bars[i]);
      barsPath.roundRect(x - barW / 2, midY - half, barW, half * 2, barW / 2);
    }

    // The country's symbolic colours spread across the screen; a reversed copy overlaps them
    const sweep = paletteGradient(sig.palette);
    const overlap = paletteGradient([...sig.palette].reverse());

    // Upper half: crisp
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cw, midY);
    ctx.clip();
    ctx.fillStyle = sweep;
    ctx.fill(barsPath);
    ctx.restore();

    // Overlap: the reversed palette glows through the upper half where the two meet
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = opacity * 0.3;
    ctx.beginPath();
    ctx.rect(0, 0, cw, midY);
    ctx.clip();
    ctx.fillStyle = overlap;
    ctx.fill(barsPath);
    ctx.restore();

    // Lower half: drawn offscreen, faded top to bottom with a mask, then blurred onto the screen
    offCtx.clearRect(0, 0, cw, ch);
    offCtx.save();
    offCtx.beginPath();
    offCtx.rect(0, midY, cw, midY);
    offCtx.clip();
    offCtx.fillStyle = sweep;
    offCtx.fill(barsPath);
    offCtx.restore();
    offCtx.globalCompositeOperation = "destination-in";
    const mask = offCtx.createLinearGradient(0, midY, 0, midY + maxH);
    mask.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    mask.addColorStop(0.2, "rgba(0, 0, 0, 0.42)");
    mask.addColorStop(0.45, "rgba(0, 0, 0, 0.22)");
    mask.addColorStop(0.7, "rgba(0, 0, 0, 0.08)");
    mask.addColorStop(1, "rgba(0, 0, 0, 0)");
    offCtx.fillStyle = mask;
    offCtx.fillRect(0, midY, cw, midY);
    offCtx.globalCompositeOperation = "source-over";

    ctx.save();
    if ("filter" in ctx) ctx.filter = "blur(5px)";
    ctx.drawImage(off, 0, 0, cw, ch);
    ctx.restore();
    ctx.shadowBlur = 0;


    // Centre line, fading toward the screen edges
    const edge = ctx.createLinearGradient(0, 0, cw, 0);
    // Each country's centre trace uses the hue farthest from its palette, so it always stands apart
    const lineAt = a => `hsla(${sig.lineHue} 92% 74% / ${a})`;
    edge.addColorStop(0, lineAt(0));
    edge.addColorStop(0.14, lineAt(0.97));
    edge.addColorStop(0.86, lineAt(0.97));
    edge.addColorStop(1, lineAt(0));
    // The centre line is itself a small frequency trace: it ripples up and down,
    // more strongly where the bars above and below it are tall
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = lineAt(0.6);
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let x = 0; x <= cw; x += 3) {
      const i = Math.min(count - 1, Math.floor(x / BAR_STEP));
      const env = 0.3 + 0.7 * Math.min(1, layer.bars[i] / maxH);
      const ripple =
        Math.sin(x * 0.045 + time * d.freq * 6 + d.phase) +
        0.5 * Math.sin(x * 0.11 - time * d.freq * 9 + d.phase * 1.7);
      const y = midY + ripple * env * ch * d.amp * 1.7;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Canvas work only while a spectrum is on screen (or fading out)
  let wasDrawing = false;

  // Pointer follow: the map and the stars lean a touch toward the cursor, with easing
  let targetX = 0, targetY = 0, parX = 0, parY = 0;
  window.addEventListener("pointermove", e => {
    targetX = (e.clientX / cw) * 2 - 1;
    targetY = (e.clientY / ch) * 2 - 1;
  });

  function drawAmbient(time) {
    actx.clearRect(0, 0, cw, ch);
    actx.fillStyle = darkMQ.matches ? "rgb(232, 226, 244)" : "rgb(70, 60, 84)";
    for (const s of stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(time * s.tw + s.ph);
      actx.globalAlpha = 0.12 + 0.45 * twinkle;
      const x = (((s.x - parX * 16 * s.depth) % cw) + cw) % cw;
      const y = (((s.y - parY * 10 * s.depth + time * 3 * s.depth) % ch) + ch) % ch;
      actx.beginPath();
      actx.arc(x, y, s.r, 0, Math.PI * 2);
      actx.fill();
    }
    actx.globalAlpha = 1;
  }

  function frame(now) {
    const time = now / 1000;
    if (!touring && !body.classList.contains("wave") && now - lastActivity > IDLE_MS) startTour();
    if (!body.classList.contains("wave")) {
      const nx = parX + (targetX - parX) * 0.06;
      const ny = parY + (targetY - parY) * 0.06;
      if (Math.abs(nx - parX) > 0.0004 || Math.abs(ny - parY) > 0.0004) {
        parX = nx; parY = ny;
        mapEl.style.setProperty("--px", parX.toFixed(4));
        mapEl.style.setProperty("--py", parY.toFixed(4));
      }
      drawAmbient(time);
    }
    if (layers.length || wasDrawing) {
      ctx.clearRect(0, 0, cw, ch);
      layers = layers.filter(layer => !(layer.dying && now - layer.dying > OUT_MS));
      for (const layer of layers) {
        const fadeIn = easeOut(clamp01((now - layer.born) / FADE_MS));
        const fadeOut = layer.dying ? 1 - easeOut(clamp01((now - layer.dying) / OUT_MS)) : 1;
        drawSpectrum(layer, fadeIn * fadeOut, time);
      }
      wasDrawing = layers.length > 0;
    }
    requestAnimationFrame(frame);
  }

  // ----- Switching views -----
  const captionContinent = document.getElementById("continent");
  const captionName = document.getElementById("name");
  const captionSub = document.getElementById("sub");

  function enter(feature, origin) {
    const sig = signature(feature);
    const now = performance.now();
    if (origin) spawnRipple(origin, sig);
    // If another spectrum is still on screen, the new one waits for it to clear first
    const busy = layers.some(layer => !layer.dying);
    for (const layer of layers) if (!layer.dying) layer.dying = now;
    layers.push({ sig, born: now + (busy ? OUT_MS : 0), dying: null });

    tip.classList.remove("on");
    body.style.setProperty("--th", sig.hue.toFixed(1));
    body.style.setProperty("--ts", (sig.sat * 0.8).toFixed(1) + "%");
    captionContinent.textContent = CONTINENT_KO[sig.continent] || sig.continent;
    captionName.textContent = sig.name;
    captionSub.textContent = sig.sub;
    hintEl.textContent = HINT_WAVE;
    body.classList.add("wave");
  }

  function leave() {
    if (!body.classList.contains("wave")) return;
    const now = performance.now();
    for (const layer of layers) if (!layer.dying) layer.dying = now;
    body.classList.remove("wave");
    hintEl.textContent = HINT_MAP;
  }

  // ----- Click ripple: rings spread from the clicked point as the view changes -----
  function spawnRipple(origin, sig) {
    const reach = Math.hypot(window.innerWidth, window.innerHeight) / 12;
    const color = sig.palette[0];
    [0, 170, 340].forEach(delay => {
      const ring = document.createElement("div");
      ring.className = "ripple";
      ring.style.left = origin.x + "px";
      ring.style.top = origin.y + "px";
      ring.style.borderColor = color;
      ring.style.boxShadow = `0 0 22px ${color}, inset 0 0 22px ${color}`;
      document.body.appendChild(ring);
      const anim = ring.animate([
        { transform: "translate(-50%, -50%) scale(0.02)", opacity: 0.95 },
        { transform: `translate(-50%, -50%) scale(${reach})`, opacity: 0 }
      ], { duration: 1400, delay, easing: "cubic-bezier(.2, .7, .2, 1)", fill: "both" });
      anim.onfinish = () => ring.remove();
    });
  }

  // ----- Idle tour: after a while with no input, the map frames one country at a time -----
  let lastActivity = performance.now();
  let touring = false;
  let tourTimers = [];
  let tourOrder = [];
  let tourIndex = 0;

  function screenPoint(x, y) {
    const pt = svg.node().createSVGPoint();
    pt.x = x; pt.y = y;
    const m = g.node().getScreenCTM();
    return m ? pt.matrixTransform(m) : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  function startTour() {
    const candidates = drawable.filter(f => boxes.has(f.id) && boxes.get(f.id).w > 9);
    if (!candidates.length) return;
    tourOrder = candidates
      .map(f => ({ f, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(o => o.f);
    touring = true;
    hintEl.textContent = HINT_TOUR;
    tourStep();
  }

  function tourStep() {
    if (!touring) return;
    paths.classed("tour", false);
    tip.classList.remove("on");
    const f = tourOrder[tourIndex++ % tourOrder.length];
    const box = boxes.get(f.id);

    // Frame the country: zoom so it takes roughly a third of the screen
    const k = Math.max(1.6, Math.min(7, 0.38 * Math.min(mapW / box.w, mapH / box.h)));
    const t = d3.zoomIdentity.translate(mapW / 2 - k * box.cx, mapH / 2 - k * box.cy).scale(k);
    svg.transition().duration(2200).ease(d3.easeCubicInOut).call(zoom.transform, t);

    // Once the camera arrives, light the country and name it
    tourTimers.push(setTimeout(() => {
      if (!touring) return;
      paths.filter(d => d === f).classed("tour", true);
      const p = screenPoint(box.cx, box.cy);
      tip.textContent = signature(f).name;
      tip.style.transform = `translate(${p.x}px, ${p.y}px)`;
      tip.classList.add("on");
    }, 2350));
    tourTimers.push(setTimeout(tourStep, TOUR_STEP_MS));
  }

  function stopTour() {
    touring = false;
    tourTimers.forEach(clearTimeout);
    tourTimers = [];
    paths.classed("tour", false);
    tip.classList.remove("on");
    hintEl.textContent = HINT_MAP;
    svg.transition().duration(900).call(zoom.transform, homeTransform());
  }

  // Any real input ends the tour and restarts the idle clock
  ["pointermove", "pointerdown", "wheel", "keydown", "touchstart"].forEach(type =>
    window.addEventListener(type, () => {
      lastActivity = performance.now();
      if (touring) stopTour();
    }, { passive: true })
  );

  body.addEventListener("click", () => {
    if (body.classList.contains("wave")) leave();
  });
  window.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (body.classList.contains("wave")) leave();
    else svg.transition().duration(700).call(zoom.transform, homeTransform());
  });

  // On phones the browser bars slide in and out and fire resize events; only a real change of
  // layout (width, orientation, a big height change) refits the map and resets the view.
  let lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener("resize", () => {
    sizeCanvas();
    const dw = Math.abs(window.innerWidth - lastW), dh = Math.abs(window.innerHeight - lastH);
    if (dw > 0 || dh > 120) {
      lastW = window.innerWidth; lastH = window.innerHeight;
      fitMap();
    }
  });

  sizeCanvas();
  fitMap();
  hintEl.textContent = HINT_MAP;
  requestAnimationFrame(frame);
}

Promise.all([
  fetch(ATLAS_URL).then(r => r.json()),
  fetch(INFO_URL).then(r => r.json())
]).then(([topo, list]) => init(topo, list))
  .catch(err => {
    console.error(err);
    const status = document.getElementById("status");
    if (status) status.textContent = "데이터를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.";
  });
