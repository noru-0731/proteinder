import { products, type Product } from "./data";

/**
 * 1회 섭취 기준 성분 밸런스 — 5축 A~D 등급 (2026-08-07 · 2안 채택 → 같은 날 보수 개편).
 *
 * 축은 영양정보 여섯 칸에서 **나트륨을 뺀 다섯**: 단백질·칼로리·당류·탄수화물·지방.
 * 🔴 값은 **1회 섭취 기준** — RTD 1병 · 파우더 1스쿱 30g (2026-08-07 · 100당 → 1회).
 *    태그 줄 「상위 20%」·2차 카드 영양 줄·단백질 계산기가 전부 이 기준이라,
 *    100당이던 오각형만 어긋나 같은 화면에서 태그 S ↔ 오각형 A 가 공존했다
 *    (RTD 단백질 축 53%가 그 자리). 미국 FDA 라벨의 per serving 문법이다.
 *    Nutri-Score 가 per-100 을 고집하는 이유(1회분 표기 조작 방지)는 우리에게 없다 —
 *    조작 가능한 servSize 는 이미 버렸고 병 크기는 신고 총용량이다.
 *
 * 🔴 **등급은 분포에서 나온다. 우리가 정한 것은 「20/50/80 컷」 하나다.**
 *      A 0~20% · B 20~50% · C 50~80% · D 80~100%
 *    프로틴랩 `/grade-criteria` 와 같은 컷이다 (실측: 그쪽도 20/30/30/20 버킷).
 *
 * 🔴 **축을 합치지 않는다.** 종합 등급은 폐기했다 — 아래 폐기 주석 참조.
 *
 * 🔴 방향 — A 는 「흔히 반기는 쪽」: 단백질은 많은 쪽, 나머지 넷은 적은 쪽.
 *    grades.ts 의 goodHigh 와 같은 문법이다. 색·글자는 방향이지 판정이 아니다 (원칙 7).
 *
 * ⚠️ 카테고리를 섞지 않는다 — 1병과 1스쿱 30g 은 다른 자다 (RTD 197 · 파우더 299).
 * ⚠️ 파우더는 1스쿱이 30g 고정이라 등급이 100g당과 완전히 같다 (상수배 — 값만 다름).
 *    칼로리 축이 좁은 것(20~80% 폭 ~10kcal)도 그대로다: 단백질이 4kcal/g 이라
 *    순도 높은 제품일수록 칼로리도 오른다 — 등급 낮다고 이상한 제품이 아니다.
 * ⚠️ 동점은 같은 등급을 받는다 — 당류 0 인 제품 전부가 A 다.
 */

export type NutAxisKey = "prot" | "kcal" | "sugar" | "carb" | "fat";

export const NUT_AXES: { key: NutAxisKey; label: string; goodHigh: boolean }[] = [
  { key: "prot", label: "단백질", goodHigh: true },
  { key: "kcal", label: "칼로리", goodHigh: false },
  { key: "sugar", label: "당류", goodHigh: false },
  { key: "carb", label: "탄수화물", goodHigh: false },
  { key: "fat", label: "지방", goodHigh: false },
];

/**
 * 🔴 **등급을 매길 수 있는 최소 모수** (2026-08-07 밤 · 쿠팡 수록이 들어오면서 신설).
 *
 * 네 등급으로 자르려면 한 칸에 최소 다섯은 있어야 「분포에서의 위치」라는 말이
 * 성립한다. 지금 실측은 이렇다 —
 *      프로틴 드링크 195 · 프로틴 파우더 281      ← 한 칸 39·56
 *      두유 24 · 그릭요거트 24 · 과자류 17 ·
 *      단백질바 16 · 닭가슴살 12                  ← 한 칸 2~5
 *
 * 얕은 쪽에 A~D 를 붙이면 **한두 제품 차이로 등급이 뒤집힌다.** 근거가 부족하면
 * 판정하지 않는다 (원칙 5) — 값은 그대로 보여주고 등급만 내린다.
 * ⚠️ 표본이 늘면 저절로 켜진다. 화면에 조건을 박아 두지 않았다.
 */
export const MIN_DIST = 25;

/**
 * 🔴 **A~D 네 단계다. S 를 없앴다** (2026-08-07 · 팀 지시 「보수적으로」).
 *
 * 「S」는 게임의 최상위 문법이라 **위치 진술이 아니라 판정으로 읽힌다.**
 * 벤치마크인 프로틴랩도 A~D 네 글자를 쓴다 (`/grade-criteria` 실측).
 */
export const GRADES = ["A", "B", "C", "D"] as const;
export type Grade = (typeof GRADES)[number];

/**
 * 1회 섭취 환산 배수 — packLabel(1병(190ml)·1회분 30g)의 단위 붙은 숫자 ÷ 기준량.
 * ⚠️ 첫 숫자를 집으면 「1병(330ml)」에서 1 이 잡힌다 — NutritionSummary 와 같은 규칙.
 */
function servFactor(p: Product): number | null {
  const b = (p.basis || "").match(/([\d.]+)\s*(?:ml|g)\b/i);
  const t = (p.packLabel || "").match(/([\d.]+)\s*(?:ml|g)\b/i);
  if (!b || !t) return null;
  const base = Number(b[1]);
  return base > 0 ? Number(t[1]) / base : null;
}

/**
 * 🔴 **환산이 성립하지 않는다고 파이프라인이 이미 적어 둔 제품** (2026-08-07 수정).
 *
 * `packLabel` 이 「용량 미확인 (516g)」·「1병당 미산출」이면 그건 **낱개 한 개가
 * 얼마인지 모른다**는 뜻이다. 그런데 아래 servFactor 는 정규식으로 숫자만 뽑으므로
 * 괄호 안의 `516g`(= 묶음 총량)을 낱개로 착각해 그대로 곱하고 있었다.
 *
 * 실제 수록에서 걸리는 것은 **18건** — 쿠팡판 닭가슴살 5 · 단백질바 7 · 두유 3 ·
 * 그릭요거트 2 · 과자류 1. RTD·파우더는 0 이다.
 * 고치기 전 최악은 「프로틴 츄이 바 피넛버터 다크」가 **1회 5,820kcal**, 1,000kcal 을
 * 넘는 것이 13건이었다. 고친 뒤 최댓값 760kcal · 1,000kcal 초과 0건.
 *
 * ⚠️ **이 18건은 원래도 등급이 안 붙던 제품이다** (쿠팡 5종은 모수 미달). 그래서 이
 *    수정으로 바뀌는 등급은 없고, 바뀌는 것은 오각형에 찍히던 **값**이다.
 *    그래도 고친다 — 화면에 5,820kcal 이 떠 있는 것 자체가 틀린 진술이다.
 *
 * ⚠️ 고치지 않고 **뺀다.** 낱개 무게를 우리가 모르는 것이지 신고값이 틀린 게 아니다
 *    (원칙 5 — 근거가 부족하면 판정하지 않는다).
 */
const NO_SERVING = /미확인|미산출/;

/**
 * 1회 섭취 기준으로 옮기는 **배수**. 환산이 성립하지 않으면 null.
 *
 * 🔴 다섯 축 밖의 값(나트륨)을 같은 자로 옮길 때 쓴다 (2026-08-08 · 비교 표 수정).
 *    비교 표가 열 머리에 「1병(260ml) 기준」이라 적어 놓고 탄수화물·지방·나트륨만
 *    100ml 원값을 그대로 찍고 있었다 — 「당류 28g > 탄수화물 11.9g」이라는
 *    **불가능한 표시**가 화면에 떠 있었고, 같은 제품의 상세와 숫자가 달랐다
 *    (상세 NutritionSummary 는 처음부터 배수를 곱하고 있었다).
 */
export function servScale(p: Product): number | null {
  if (NO_SERVING.test(p.packLabel || "")) return null;
  return servFactor(p);
}

/** 이 축의 1회 섭취 기준 값. 환산 불가(용량 미확인 등)면 null — 등급을 내지 않는다 */
export function servValue(p: Product, key: NutAxisKey): number | null {
  const raw = p[key];
  if (raw == null) return null;
  if (NO_SERVING.test(p.packLabel || "")) return null;
  const f = servFactor(p);
  if (f == null) return null;
  return raw * f;
}

/* (카테고리 × 축) → 정렬된 1회 기준 값. 빌드 때 한 번 만든다 */
const scales = new Map<string, number[]>();
for (const p of products) {
  for (const a of NUT_AXES) {
    const v = servValue(p, a.key);
    if (v == null) continue;
    const k = `${p.cat}|${a.key}`;
    const arr = scales.get(k);
    if (arr) arr.push(v);
    else scales.set(k, [v]);
  }
}
for (const arr of scales.values()) arr.sort((x, y) => x - y);

/**
 * 좋은 쪽 상위 몇 %인가(1이 가장 끝) → **20/50/80 컷의 A~D**.
 *
 * 🔴 균등 5분위(20/20/20/20/20)에서 프로틴랩과 같은 **20/30/30/20** 으로 바꿨다
 *    (2026-08-07 · 팀 지시 「보수적으로」). 가운데 두 등급이 60% 를 차지한다 —
 *    「대부분은 중간」이 우리가 할 수 있는 가장 보수적인 진술이다.
 * ⚠️ 동점은 같은 등급이다. RTD 당류는 20% 경계가 0.0g 이라 **당류 0 제품이 전부 A** 다.
 *    「A 는 상위 20%」라는 설명과 어긋나 보이므로 /grades 에 그 축만 따로 적어 둔다.
 */
function gradeOfPct(topPct: number): Grade {
  if (topPct <= 20) return "A";
  if (topPct <= 50) return "B";
  if (topPct <= 80) return "C";
  return "D";
}

export type AxisStanding = {
  key: NutAxisKey;
  label: string;
  /** 1회 섭취 기준 환산값 (RTD 1병 · 파우더 1스쿱 30g) */
  value: number | null;
  grade: Grade | null;
  /** 0~1 · 1이 좋은 쪽 끝 — 오각형 꼭짓점 반지름에 쓴다 */
  score: number;
  n: number;
};

export function nutritionStandings(p: Product): AxisStanding[] {
  return NUT_AXES.map((a) => {
    const arr = scales.get(`${p.cat}|${a.key}`);
    /* 모수가 얕으면 값은 주되 등급은 주지 않는다 — 아래에서 grade 를 비운다 */
    const v = servValue(p, a.key);
    if (v == null || !arr?.length)
      return { key: a.key, label: a.label, value: v ?? null, grade: null, score: 0, n: 0 };

    // 나보다 좋은 쪽에 있는 제품 수. 동점은 앞선 것으로 세지 않는다 — 같은 등급
    let ahead = 0;
    for (const x of arr) if (a.goodHigh ? x > v : x < v) ahead++;
    const topPct = ((ahead + 1) / arr.length) * 100;

    return {
      key: a.key,
      label: a.label,
      value: v,
      // 🔴 모수가 MIN_DIST 미만이면 등급을 내지 않는다 — 값과 막대 길이는 그대로다
      grade: arr.length >= MIN_DIST ? gradeOfPct(topPct) : null,
      score: 1 - ahead / arr.length,
      n: arr.length,
    };
  });
}

/* ─────────────────────────────────────────────────────────────
   ❌ **종합 등급 폐기** (2026-08-07 · 팀 지시 「폐기합시다」).

   다섯 축 score 의 가중 평균(AXIS_WEIGHT 1·1·0.5·0.5·1)을 카테고리 분포에서
   다시 자르던 것 — overallGrade · overallStanding · OverallDist 곡선이 여기 있었다.

   🔴 지운 이유는 계산이 틀려서가 아니라 **축을 합치는 순간 우리가 「무엇이 좋은
      제품인가」를 정하게 되기 때문**이다. 그건 원칙 7 이 금지한 자리다.
      벤치마크인 프로틴랩도 세 축을 각각 보여줄 뿐 합치지 않는다 (`/grade-criteria` 실측).

   폐기 시점 실측 — **등급이 실제로 붙던 476건**(파우더 281 · RTD 195) 기준.
   ⚠️ 모집단을 조심할 것. data/products.json 은 631건이지만 lib/data.ts 가 거기서
      RTD·파우더만 취하고 나머지 다섯 카테고리는 쿠팡판으로 바꿔 싣는다. 쿠팡 5종은
      축별 모수가 12~24 라 MIN_DIST 25 에 걸려 **애초에 등급이 안 붙는다.**
      (이 주석을 처음 쓸 때 products.json 전체로 세어 숫자를 한 번 틀렸다.)

     종합 S 97건 중   당류축 S 65(67%) · 단백질축 S 42(43%) · 칼로리축 S 39(40%)
     종합 S 인데 단백질축이 C·D   11건(11%)
     종합↔용량 스피어만 +0.39     ~200ml 62건 중 종합S **0건** / 400ml+ 14건 중 5건

   즉 종합은 단백질보다 **당류 축에 더 붙어 있었고**(67% vs 43%),
   미니 용량은 구조적으로 최고 등급이 불가능했다.

   ⚠️ 「단백질 축이 C·D 면 종합 상한 B」 같은 캡도 검토했으나 채택하지 않았다 —
      캡은 결국 우리가 규칙을 하나 더 정하는 것이라 위험의 성격이 같다.
   ⚠️ 되살리지 말 것. 축은 각각 보여준다.
   ───────────────────────────────────────────────────────────── */

/**
 * 등급 배지 색 — 2차 카드·3차·대조가 같은 것을 쓴다. **색은 방향이지 판정이 아니다.**
 *
 * 🔴 금(S)을 걷어냈다 (2026-08-07 · 종합 등급 폐기와 같은 결정).
 *    금 > 보라 > 파랑 사다리는 게임 희귀도 문법이라 **「최고 등급」을 만든다.**
 *    보수적으로 가기로 한 이상 최고 등급이 튀면 안 된다 — 파랑에서 시작해
 *    주황·빨강으로 내려가는 **방향 표시**만 남긴다.
 *
 * 네 개 전부 AA(4.5:1)를 넘는다. 흰 글자는 양 끝(A·D)만 쓴다.
 * ⚠️ **C 는 빨강이 아니라 주황이다.** C·D 가 둘 다 빨강이면 두 단계로 안 갈린다 —
 *    D 만 빨강을 독점해야 경고가 산다.
 * ⚠️ 회색을 쓰지 않는다. 회색 칠은 「중간」이 아니라 「비활성」으로 읽힌다.
 */
/* 🔴 A·B 가 `--brand-*` 를 쓰고 있었다 (2026-08-08 수정). ver1 에서는 그게 파랑이라
   주석과 화면이 맞았는데, app3 로 옮겨 오며 `--brand-strong` 이 분홍으로 흘러
   **등급 배지가 브랜드색을 입었다** — 「단백질 D」 빨강 옆에 브랜드 분홍이 서서
   카드 한 장에 분홍 계열이 셋이었다. 사다리 전용 토큰으로 끊는다 (globals.css). */
export const GRADE_BADGE_CLS: Record<Grade, string> = {
  A: "bg-grade-strong text-on-brand", // 4.84:1 — 파랑 채움
  B: "bg-grade-wash text-grade-ink",  // 6.14:1 — 파랑 연함
  C: "bg-caution text-caution-ink",   // 4.53:1 — 주황 연함
  D: "bg-danger-strong text-on-brand",// 5.46:1 — 빨강 채움
};

/**
 * 기준 페이지·문서용 — 실제 분포의 등급 경계값 (**20/50/80 백분위**).
 * 🔴 /grades 가 이 값을 **그대로 읽어** 표를 그린다. 숫자를 손으로 옮겨 적지 않으므로
 *    수록이 바뀌면 표도 같이 바뀐다. 프로틴랩이 「8g/100mL 이상 (상위 20%)」처럼
 *    백분위와 절대값을 병기하는 것과 같은 방식이다.
 */
export function gradeCuts(cat: string, key: NutAxisKey): number[] | null {
  const arr = scales.get(`${cat}|${key}`);
  if (!arr?.length) return null;
  return [20, 50, 80].map((pct) => {
    const k = ((arr.length - 1) * pct) / 100;
    const f = Math.floor(k);
    const c = Math.min(f + 1, arr.length - 1);
    return arr[f] + (arr[c] - arr[f]) * (k - f);
  });
}
