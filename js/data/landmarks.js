// Landmark silhouettes. Each country's wave can take the outline of a landmark or a specialty product.
// Shapes live on a 0..1 horizontal axis with heights 0..1; overlapping shapes are merged by taking the highest point.
//   tri    : triangle from x0 to x1, peak h at `apex` (0..1, default 0.5)
//   rect   : block from x0 to x1, height h
//   dome   : half-ellipse from x0 to x1, height h
//   mtn    : mountain with a flat top (`flat` = share of width that is flat)
//   steps  : terraced pyramid with n levels
//   teeth  : n repeated columns (height h, lower gaps)
const LANDMARKS = {
  "Egypt": { label: "기자의 피라미드", shapes: [
    { t: "tri", x0: 0.04, x1: 0.42, h: 0.55 },
    { t: "tri", x0: 0.30, x1: 0.74, h: 0.95 },
    { t: "tri", x0: 0.62, x1: 0.96, h: 0.45 }
  ]},
  "France": { label: "에펠탑", shapes: [
    { t: "tri", x0: 0.26, x1: 0.74, h: 1.0 },
    { t: "rect", x0: 0.36, x1: 0.64, h: 0.45 }
  ]},
  "Japan": { label: "후지산", shapes: [
    { t: "mtn", x0: 0.02, x1: 0.98, h: 0.7, flat: 0.35 }
  ]},
  "Mexico": { label: "치첸이트사 피라미드", shapes: [
    { t: "steps", x0: 0.1, x1: 0.9, h: 0.8, n: 5 }
  ]},
  "Peru": { label: "마추픽추", shapes: [
    { t: "steps", x0: 0.08, x1: 0.92, h: 0.6, n: 4 },
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.95 }
  ]},
  "Cambodia": { label: "앙코르와트", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.35 },
    { t: "tri", x0: 0.45, x1: 0.55, h: 1.0 },
    { t: "tri", x0: 0.2, x1: 0.3, h: 0.6 },
    { t: "tri", x0: 0.7, x1: 0.8, h: 0.6 }
  ]},
  "India": { label: "타지마할", shapes: [
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.6 },
    { t: "rect", x0: 0.22, x1: 0.78, h: 0.2 },
    { t: "rect", x0: 0.12, x1: 0.16, h: 0.8 },
    { t: "rect", x0: 0.84, x1: 0.88, h: 0.8 }
  ]},
  "China": { label: "만리장성", shapes: [
    { t: "tri", x0: 0.0, x1: 0.26, h: 0.6 },
    { t: "tri", x0: 0.24, x1: 0.5, h: 0.95 },
    { t: "tri", x0: 0.48, x1: 0.74, h: 0.5 },
    { t: "tri", x0: 0.72, x1: 1.0, h: 0.8 }
  ]},
  "Australia": { label: "울루루", shapes: [
    { t: "dome", x0: 0.08, x1: 0.92, h: 0.45 }
  ]},
  "Brazil": { label: "예수 그리스도상", shapes: [
    { t: "rect", x0: 0.46, x1: 0.54, h: 0.95 },
    { t: "rect", x0: 0.2, x1: 0.8, h: 0.62 }
  ]},
  "United States": { label: "자유의 여신상", shapes: [
    { t: "tri", x0: 0.42, x1: 0.58, h: 0.8 },
    { t: "rect", x0: 0.36, x1: 0.64, h: 0.3 }
  ]},
  "Italy": { label: "콜로세움", shapes: [
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.25 },
    { t: "teeth", x0: 0.05, x1: 0.95, h: 0.6, n: 8, duty: 0.6 }
  ]},
  "Greece": { label: "파르테논 신전", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.3 },
    { t: "teeth", x0: 0.1, x1: 0.9, h: 0.5, n: 9, duty: 0.6 },
    { t: "tri", x0: 0.1, x1: 0.9, h: 0.7 }
  ]},
  "United Kingdom": { label: "빅벤", shapes: [
    { t: "rect", x0: 0.42, x1: 0.58, h: 0.7 },
    { t: "tri", x0: 0.42, x1: 0.58, h: 1.0 }
  ]},
  "Russia": { label: "성 바실리 대성당", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 },
    { t: "tri", x0: 0.1, x1: 0.3, h: 0.45 },
    { t: "tri", x0: 0.25, x1: 0.45, h: 0.8 },
    { t: "tri", x0: 0.4, x1: 0.6, h: 1.0 },
    { t: "tri", x0: 0.55, x1: 0.75, h: 0.8 },
    { t: "tri", x0: 0.7, x1: 0.9, h: 0.45 }
  ]},
  "Turkey": { label: "아야 소피아", shapes: [
    { t: "dome", x0: 0.25, x1: 0.75, h: 0.7 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.25 },
    { t: "tri", x0: 0.04, x1: 0.12, h: 0.8 },
    { t: "tri", x0: 0.88, x1: 0.96, h: 0.8 }
  ]},
  "Spain": { label: "사그라다 파밀리아", shapes: [
    { t: "rect", x0: 0.15, x1: 0.85, h: 0.2 },
    { t: "tri", x0: 0.2, x1: 0.3, h: 0.7 },
    { t: "tri", x0: 0.32, x1: 0.42, h: 1.0 },
    { t: "tri", x0: 0.44, x1: 0.56, h: 0.85 },
    { t: "tri", x0: 0.58, x1: 0.68, h: 1.0 },
    { t: "tri", x0: 0.7, x1: 0.8, h: 0.7 }
  ]},
  "Netherlands": { label: "풍차", shapes: [
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.85 },
    { t: "rect", x0: 0.4, x1: 0.6, h: 0.4 }
  ]},
  "Nepal": { label: "에베레스트", shapes: [
    { t: "tri", x0: 0.0, x1: 0.4, h: 0.6 },
    { t: "tri", x0: 0.25, x1: 0.7, h: 1.0 },
    { t: "tri", x0: 0.55, x1: 0.9, h: 0.7 },
    { t: "tri", x0: 0.8, x1: 1.0, h: 0.5 }
  ]},
  "Chile": { label: "모아이", shapes: [
    { t: "rect", x0: 0.1, x1: 0.25, h: 0.7 },
    { t: "rect", x0: 0.42, x1: 0.6, h: 0.9 },
    { t: "rect", x0: 0.75, x1: 0.9, h: 0.6 }
  ]},
  "South Africa": { label: "테이블 마운틴", shapes: [
    { t: "mtn", x0: 0.02, x1: 0.98, h: 0.55, flat: 0.85 }
  ]},
  "South Korea": { label: "남산타워", shapes: [
    { t: "rect", x0: 0.47, x1: 0.53, h: 0.9 },
    { t: "dome", x0: 0.4, x1: 0.6, h: 0.45 }
  ]},
  "United Arab Emirates": { label: "부르즈 할리파", shapes: [
    { t: "steps", x0: 0.3, x1: 0.7, h: 1.0, n: 6 }
  ]},
  "Indonesia": { label: "보로부두르 사원", shapes: [
    { t: "steps", x0: 0.05, x1: 0.95, h: 0.5, n: 4 },
    { t: "dome", x0: 0.4, x1: 0.6, h: 0.6 }
  ]},
  "Thailand": { label: "왓 아룬", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 },
    { t: "tri", x0: 0.2, x1: 0.4, h: 0.5 },
    { t: "tri", x0: 0.4, x1: 0.6, h: 1.0 },
    { t: "tri", x0: 0.6, x1: 0.8, h: 0.5 }
  ]},
  "Germany": { label: "쾰른 대성당", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.35 },
    { t: "rect", x0: 0.35, x1: 0.65, h: 0.55 },
    { t: "tri", x0: 0.12, x1: 0.36, h: 1.0 },
    { t: "tri", x0: 0.64, x1: 0.88, h: 1.0 }
  ]},
  "Switzerland": { label: "마테호른", shapes: [
    { t: "tri", x0: 0.1, x1: 0.8, h: 1.0, apex: 0.42 },
    { t: "tri", x0: 0.6, x1: 1.0, h: 0.5 }
  ]},
  "Colombia": { label: "커피 원두", product: true, shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.8 }
  ]},
  "Ghana": { label: "카카오 열매", product: true, shapes: [
    { t: "dome", x0: 0.15, x1: 0.85, h: 0.8 },
    { t: "teeth", x0: 0.1, x1: 0.9, h: 0.5, n: 6, duty: 0.4 }
  ]}
};

function shapeHeight(s, x) {
  if (x < s.x0 || x > s.x1) return 0;
  const span = s.x1 - s.x0;
  const t = (x - s.x0) / span;
  switch (s.t) {
    case "tri": {
      const a = s.apex ?? 0.5;
      return s.h * (t < a ? t / a : (1 - t) / (1 - a));
    }
    case "rect":
      return s.h;
    case "dome": {
      const u = (x - (s.x0 + s.x1) / 2) / (span / 2);
      return s.h * Math.sqrt(Math.max(0, 1 - u * u));
    }
    case "mtn": {
      const edge = Math.min(t, 1 - t) / ((1 - s.flat) / 2);
      return s.h * Math.min(1, edge);
    }
    case "steps": {
      const level = Math.floor(Math.min(t, 1 - t) * 2 * s.n) / s.n;
      return s.h * level;
    }
    case "teeth": {
      const frac = (t * s.n) % 1;
      return s.h * (frac < (s.duty ?? 0.6) ? 1 : 0.55);
    }
    default:
      return 0;
  }
}

// Second and third landmarks, so most featured countries show several in one skyline
const EXTRA_LANDMARKS = {
  "Egypt": [{ label: "스핑크스", shapes: [
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.15 },
    { t: "dome", x0: 0.15, x1: 0.7, h: 0.4 },
    { t: "rect", x0: 0.6, x1: 0.8, h: 0.6 }
  ]}],
  "France": [{ label: "개선문", shapes: [
    { t: "rect", x0: 0.05, x1: 0.2, h: 0.7 },
    { t: "rect", x0: 0.8, x1: 0.95, h: 0.7 },
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.85 }
  ]}],
  "Japan": [{ label: "오사카성", shapes: [
    { t: "steps", x0: 0.2, x1: 0.8, h: 0.5, n: 3 },
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.85 }
  ]}],
  "Mexico": [{ label: "템플로 마요르", shapes: [
    { t: "steps", x0: 0.3, x1: 0.7, h: 0.9, n: 4 }
  ]}],
  "Peru": [{ label: "쿠스코 대성당", shapes: [
    { t: "rect", x0: 0.15, x1: 0.85, h: 0.5 },
    { t: "tri", x0: 0.2, x1: 0.4, h: 0.9 },
    { t: "tri", x0: 0.6, x1: 0.8, h: 0.9 }
  ]}],
  "Cambodia": [{ label: "바욘 사원", shapes: [
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.8 },
    { t: "tri", x0: 0.1, x1: 0.5, h: 0.5 },
    { t: "tri", x0: 0.5, x1: 0.9, h: 0.5 }
  ]}],
  "India": [{ label: "인도 문", shapes: [
    { t: "rect", x0: 0.05, x1: 0.2, h: 0.8 },
    { t: "rect", x0: 0.8, x1: 0.95, h: 0.8 },
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.35 }
  ]}],
  "China": [{ label: "자금성", shapes: [
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.25 },
    { t: "steps", x0: 0.2, x1: 0.8, h: 0.6, n: 3 },
    { t: "tri", x0: 0.4, x1: 0.6, h: 0.9 }
  ]}],
  "Australia": [{ label: "오페라 하우스", shapes: [
    { t: "dome", x0: 0.1, x1: 0.5, h: 0.8 },
    { t: "dome", x0: 0.45, x1: 0.9, h: 0.95 }
  ]}],
  "Brazil": [{ label: "니테로이 현대미술관", shapes: [
    { t: "dome", x0: 0.05, x1: 0.95, h: 0.5 },
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.25 }
  ]}],
  "United States": [{ label: "엠파이어 스테이트 빌딩", shapes: [
    { t: "steps", x0: 0.25, x1: 0.75, h: 1.0, n: 6 }
  ]}],
  "Italy": [{ label: "두오모", shapes: [
    { t: "dome", x0: 0.25, x1: 0.75, h: 0.8 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Greece": [{ label: "산토리니 돔", shapes: [
    { t: "dome", x0: 0.1, x1: 0.5, h: 0.6 },
    { t: "dome", x0: 0.5, x1: 0.9, h: 0.8 }
  ]}],
  "United Kingdom": [{ label: "타워 브리지", shapes: [
    { t: "rect", x0: 0.1, x1: 0.25, h: 0.8 },
    { t: "rect", x0: 0.75, x1: 0.9, h: 0.8 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.3 }
  ]}],
  "Russia": [{ label: "모스크바 크렘린", shapes: [
    { t: "tri", x0: 0.45, x1: 0.55, h: 1.0 },
    { t: "rect", x0: 0.3, x1: 0.7, h: 0.4 },
    { t: "rect", x0: 0.1, x1: 0.25, h: 0.3 }
  ]}],
  "Turkey": [{ label: "갈라타 탑", shapes: [
    { t: "rect", x0: 0.4, x1: 0.6, h: 0.6 },
    { t: "dome", x0: 0.35, x1: 0.65, h: 0.4 }
  ]}],
  "Spain": [{ label: "알람브라", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.3 },
    { t: "tri", x0: 0.2, x1: 0.4, h: 0.6 },
    { t: "teeth", x0: 0.1, x1: 0.9, h: 0.45, n: 5, duty: 0.6 }
  ]}],
  "Netherlands": [{ label: "운하 주택", shapes: [
    { t: "teeth", x0: 0.05, x1: 0.95, h: 0.6, n: 10, duty: 0.5 }
  ]}],
  "Nepal": [{ label: "보우드나트 스투파", shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.5 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 },
    { t: "tri", x0: 0.45, x1: 0.55, h: 0.8 }
  ]}],
  "Chile": [{ label: "산타루시아 언덕", shapes: [
    { t: "mtn", x0: 0.05, x1: 0.95, h: 0.5, flat: 0.3 }
  ]}],
  "South Africa": [{ label: "희망봉", shapes: [
    { t: "mtn", x0: 0.05, x1: 0.95, h: 0.35, flat: 0.25 }
  ]}],
  "South Korea": [
    { label: "경복궁 근정전", shapes: [
      { t: "steps", x0: 0.1, x1: 0.9, h: 0.4, n: 3 },
      { t: "tri", x0: 0.3, x1: 0.7, h: 0.7 }
    ]},
    { label: "63빌딩", shapes: [
      { t: "rect", x0: 0.4, x1: 0.6, h: 0.7 },
      { t: "tri", x0: 0.44, x1: 0.56, h: 1.0 }
    ]}
  ],
  "United Arab Emirates": [{ label: "셰이크 자이드 모스크", shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.6 },
    { t: "tri", x0: 0.05, x1: 0.15, h: 0.8 },
    { t: "tri", x0: 0.85, x1: 0.95, h: 0.8 }
  ]}],
  "Indonesia": [{ label: "프람바난", shapes: [
    { t: "tri", x0: 0.2, x1: 0.5, h: 0.8 },
    { t: "tri", x0: 0.5, x1: 0.8, h: 1.0 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Thailand": [{ label: "방콕 왕궁", shapes: [
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.8 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.3 },
    { t: "tri", x0: 0.1, x1: 0.3, h: 0.5 }
  ]}],
  "Germany": [{ label: "브란덴부르크 문", shapes: [
    { t: "rect", x0: 0.05, x1: 0.2, h: 0.6 },
    { t: "rect", x0: 0.8, x1: 0.95, h: 0.6 },
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.25 }
  ]}],
  "Switzerland": [{ label: "제트 기둥", shapes: [
    { t: "rect", x0: 0.45, x1: 0.55, h: 1.0 },
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.4 }
  ]}],
  "Colombia": [{ label: "에메랄드", product: true, shapes: [
    { t: "tri", x0: 0.2, x1: 0.8, h: 0.8 }
  ]}],
  "Ghana": [{ label: "카카오 콩", product: true, shapes: [
    { t: "teeth", x0: 0.1, x1: 0.9, h: 0.6, n: 8, duty: 0.5 }
  ]}]
};

// More countries, one or two landmarks or symbols each
const MORE_LANDMARKS = {
  "Canada": [{ label: "CN 타워", shapes: [
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.9 },
    { t: "tri", x0: 0.44, x1: 0.56, h: 1.0 }
  ]}, { label: "국회의사당", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.3 },
    { t: "dome", x0: 0.4, x1: 0.6, h: 0.5 }
  ]}],
  "Argentina": [{ label: "오벨리스크", shapes: [
    { t: "tri", x0: 0.44, x1: 0.56, h: 1.0 },
    { t: "rect", x0: 0.4, x1: 0.6, h: 0.2 }
  ]}],
  "Bolivia": [{ label: "우유니 소금사막", shapes: [
    { t: "mtn", x0: 0.02, x1: 0.98, h: 0.25, flat: 0.8 }
  ]}],
  "Venezuela": [{ label: "앙헬 폭포", shapes: [
    { t: "steps", x0: 0.1, x1: 0.9, h: 0.8, n: 3 }
  ]}],
  "Ecuador": [{ label: "적도 기념탑", shapes: [
    { t: "tri", x0: 0.46, x1: 0.54, h: 0.9 },
    { t: "rect", x0: 0.3, x1: 0.7, h: 0.2 }
  ]}],
  "Portugal": [{ label: "벨렘 탑", shapes: [
    { t: "rect", x0: 0.35, x1: 0.65, h: 0.6 },
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.3 }
  ]}],
  "Belgium": [{ label: "아토미움", shapes: [
    { t: "steps", x0: 0.3, x1: 0.7, h: 1.0, n: 3 }
  ]}],
  "Austria": [{ label: "쇤브룬 궁전", shapes: [
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.3 },
    { t: "dome", x0: 0.4, x1: 0.6, h: 0.5 }
  ]}],
  "Czechia": [{ label: "프라하 성", shapes: [
    { t: "tri", x0: 0.2, x1: 0.5, h: 0.8 },
    { t: "tri", x0: 0.5, x1: 0.8, h: 0.6 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Hungary": [{ label: "국회의사당 (부다페스트)", shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.6 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Poland": [{ label: "문화과학궁", shapes: [
    { t: "tri", x0: 0.4, x1: 0.6, h: 1.0 },
    { t: "rect", x0: 0.3, x1: 0.7, h: 0.3 }
  ]}],
  "Sweden": [{ label: "스톡홀름 시청", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.3 },
    { t: "tri", x0: 0.4, x1: 0.6, h: 0.7 }
  ]}],
  "Norway": [{ label: "피오르", shapes: [
    { t: "mtn", x0: 0.05, x1: 0.95, h: 0.4, flat: 0.1 }
  ]}],
  "Finland": [{ label: "헬싱키 대성당", shapes: [
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.6 },
    { t: "tri", x0: 0.1, x1: 0.2, h: 0.6 },
    { t: "tri", x0: 0.8, x1: 0.9, h: 0.6 }
  ]}],
  "Ireland": [{ label: "모허 절벽", shapes: [
    { t: "mtn", x0: 0.05, x1: 0.95, h: 0.6, flat: 0.2 }
  ]}],
  "Croatia": [{ label: "두브로브니크 성벽", shapes: [
    { t: "teeth", x0: 0.05, x1: 0.95, h: 0.4, n: 10, duty: 0.5 },
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.2 }
  ]}],
  "Iceland": [{ label: "스코가포스 폭포", shapes: [
    { t: "mtn", x0: 0.1, x1: 0.9, h: 0.5, flat: 0.4 }
  ]}],
  "Romania": [{ label: "브란 성", shapes: [
    { t: "tri", x0: 0.4, x1: 0.6, h: 0.9 },
    { t: "rect", x0: 0.2, x1: 0.8, h: 0.4 },
    { t: "tri", x0: 0.2, x1: 0.3, h: 0.5 }
  ]}],
  "Ukraine": [{ label: "성 소피아 대성당", shapes: [
    { t: "dome", x0: 0.25, x1: 0.75, h: 0.7 },
    { t: "tri", x0: 0.05, x1: 0.15, h: 0.5 },
    { t: "tri", x0: 0.85, x1: 0.95, h: 0.5 }
  ]}],
  "Serbia": [{ label: "칼레메그단 요새", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 },
    { t: "tri", x0: 0.3, x1: 0.5, h: 0.6 }
  ]}],
  "Denmark": [{ label: "인어상", shapes: [
    { t: "dome", x0: 0.4, x1: 0.6, h: 0.3 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.1 }
  ]}],
  "Slovenia": [{ label: "블레드 성", shapes: [
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.7 },
    { t: "rect", x0: 0.2, x1: 0.8, h: 0.2 }
  ]}],
  "Vatican City": [{ label: "성 베드로 대성당", shapes: [
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.9 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Iran": [{ label: "아자디 타워", shapes: [
    { t: "rect", x0: 0.42, x1: 0.58, h: 0.7 },
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.3 }
  ]}],
  "Israel": [{ label: "예루살렘 돔", shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.6 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.15 }
  ]}],
  "Saudi Arabia": [{ label: "킹덤 타워", shapes: [
    { t: "rect", x0: 0.4, x1: 0.6, h: 0.8 },
    { t: "tri", x0: 0.45, x1: 0.55, h: 1.0 }
  ]}],
  "Kuwait": [{ label: "쿠웨이트 타워", shapes: [
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.5 },
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.8 }
  ]}],
  "Pakistan": [{ label: "파이살 모스크", shapes: [
    { t: "tri", x0: 0.4, x1: 0.6, h: 0.8 },
    { t: "tri", x0: 0.1, x1: 0.2, h: 0.6 },
    { t: "tri", x0: 0.8, x1: 0.9, h: 0.6 },
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.3 }
  ]}],
  "Bangladesh": [{ label: "국회의사당 (다카)", shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.5 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Sri Lanka": [{ label: "시기리야 바위", shapes: [
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.9 },
    { t: "mtn", x0: 0.1, x1: 0.9, h: 0.3, flat: 0.3 }
  ]}],
  "Mongolia": [{ label: "게르", shapes: [
    { t: "dome", x0: 0.2, x1: 0.8, h: 0.5 }
  ]}],
  "Kazakhstan": [{ label: "바이테렉 타워", shapes: [
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.6 },
    { t: "tri", x0: 0.4, x1: 0.6, h: 1.0 }
  ]}],
  "Uzbekistan": [{ label: "레기스탄", shapes: [
    { t: "dome", x0: 0.2, x1: 0.5, h: 0.8 },
    { t: "dome", x0: 0.5, x1: 0.8, h: 0.8 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Vietnam": [{ label: "하롱베이", shapes: [
    { t: "tri", x0: 0.1, x1: 0.4, h: 0.6 },
    { t: "tri", x0: 0.4, x1: 0.7, h: 0.9 },
    { t: "tri", x0: 0.7, x1: 0.95, h: 0.5 }
  ]}],
  "Philippines": [{ label: "마욘 화산", shapes: [
    { t: "tri", x0: 0.2, x1: 0.8, h: 0.9 }
  ]}],
  "Malaysia": [{ label: "페트로나스 타워", shapes: [
    { t: "rect", x0: 0.35, x1: 0.45, h: 0.9 },
    { t: "rect", x0: 0.55, x1: 0.65, h: 0.9 },
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.4 }
  ]}],
  "Singapore": [{ label: "마리나 베이 샌즈", shapes: [
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 },
    { t: "rect", x0: 0.1, x1: 0.3, h: 0.7 },
    { t: "rect", x0: 0.3, x1: 0.5, h: 0.7 },
    { t: "rect", x0: 0.5, x1: 0.7, h: 0.7 },
    { t: "rect", x0: 0.7, x1: 0.9, h: 0.7 }
  ]}],
  "Myanmar": [{ label: "쉐다곤 파고다", shapes: [
    { t: "tri", x0: 0.4, x1: 0.6, h: 1.0 },
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.5 }
  ]}],
  "Morocco": [{ label: "하산 2세 모스크", shapes: [
    { t: "tri", x0: 0.4, x1: 0.6, h: 1.0 },
    { t: "rect", x0: 0.1, x1: 0.25, h: 0.7 },
    { t: "rect", x0: 0.75, x1: 0.9, h: 0.7 }
  ]}],
  "Tunisia": [{ label: "카르타고 유적", shapes: [
    { t: "steps", x0: 0.2, x1: 0.8, h: 0.5, n: 3 }
  ]}],
  "Tanzania": [{ label: "킬리만자로", shapes: [
    { t: "tri", x0: 0.1, x1: 0.9, h: 0.9 }
  ]}],
  "Ethiopia": [{ label: "랄리벨 암굴 교회", shapes: [
    { t: "rect", x0: 0.2, x1: 0.8, h: 0.5 },
    { t: "tri", x0: 0.25, x1: 0.75, h: 0.6 }
  ]}],
  "Zimbabwe": [{ label: "빅토리아 폭포", shapes: [
    { t: "steps", x0: 0.1, x1: 0.9, h: 0.5, n: 3 }
  ]}],
  "Mali": [{ label: "젠네 대모스크", shapes: [
    { t: "rect", x0: 0.2, x1: 0.8, h: 0.6 },
    { t: "tri", x0: 0.4, x1: 0.6, h: 0.8 }
  ]}],
  "Madagascar": [{ label: "바오바브나무", shapes: [
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.8 },
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.3 }
  ]}],
  "Cuba": [{ label: "국회의사당 (아바나)", shapes: [
    { t: "dome", x0: 0.3, x1: 0.7, h: 0.7 },
    { t: "rect", x0: 0.1, x1: 0.9, h: 0.2 }
  ]}],
  "Guatemala": [{ label: "티칼 신전", shapes: [
    { t: "steps", x0: 0.1, x1: 0.9, h: 0.8, n: 3 }
  ]}],
  "Panama": [{ label: "파나마 운하", shapes: [
    { t: "rect", x0: 0.05, x1: 0.95, h: 0.2 },
    { t: "tri", x0: 0.1, x1: 0.3, h: 0.8 },
    { t: "tri", x0: 0.7, x1: 0.9, h: 0.8 }
  ]}],
  "Jamaica": [{ label: "블루 마운틴", shapes: [
    { t: "mtn", x0: 0.05, x1: 0.95, h: 0.5, flat: 0.1 }
  ]}],
  "Costa Rica": [{ label: "아레날 화산", shapes: [
    { t: "tri", x0: 0.3, x1: 0.7, h: 0.85 }
  ]}],
  "New Zealand": [{ label: "스카이타워", shapes: [
    { t: "rect", x0: 0.45, x1: 0.55, h: 0.9 },
    { t: "tri", x0: 0.46, x1: 0.54, h: 1.0 }
  ]}, { label: "밀포드 사운드", shapes: [
    { t: "mtn", x0: 0.05, x1: 0.95, h: 0.5, flat: 0.15 }
  ]}]
};

// Every landmark a country has: its main one first, then any extras
function landmarksFor(name) {
  const main = LANDMARKS[name];
  const all = [...(main ? [main] : []), ...(EXTRA_LANDMARKS[name] || []), ...(MORE_LANDMARKS[name] || [])];
  return all.map(L => ({
    label: L.label,
    product: !!L.product,
    height: x => L.shapes.reduce((best, s) => Math.max(best, shapeHeight(s, x)), 0)
  }));
}
