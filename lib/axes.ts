import { products, type Product } from "./products";

/* ══════════════════════════════════════════════════════════════════════
   영양 다섯 축 — 1회 섭취 기준 값과 그 값이 카테고리 안에서 어디쯤인가.

   🔴 **app3 에는 등급(S~D)이 없다.** app2 는 이 축들을 20% 5분위로 잘라
      S·A·B·C·D 글자를 카드마다 붙였는데, 그 글자가 화면의 주인공이 되어
      제품 자체를 가렸다. 여기서는 **글자를 빼고 값과 막대만** 남긴다.

        app2   [S] 단백질 25g
        app3   단백질 25g · 150kcal · 당류 0g      ← 신고값 한 줄

      막대는 상세 화면에만 남는다. 「이 축에서 어디쯤인가」는 길이로 보이고,
      길이는 등급선을 긋지 않아도 읽힌다.

   ⚠️ 카테고리를 섞어 재지 않는다. 1병과 1회분 30g 과 1개는 다른 자다.
      그래서 `score` 는 언제나 **같은 cat 안에서만** 센다.
   ══════════════════════════════════════════════════════════════════════ */

export type AxisKey = "prot" | "kcal" | "sugar" | "carb" | "fat";

export const AXES: {
  key: AxisKey;
  label: string;
  /** 흔히 반기는 쪽이 큰 값인가 */
  goodHigh: boolean;
  unit: string;
}[] = [
  { key: "prot", label: "단백질", goodHigh: true, unit: "g" },
  { key: "kcal", label: "칼로리", goodHigh: false, unit: "kcal" },
  { key: "sugar", label: "당류", goodHigh: false, unit: "g" },
  { key: "carb", label: "탄수화물", goodHigh: false, unit: "g" },
  { key: "fat", label: "지방", goodHigh: false, unit: "g" },
];

export const AXIS_BY_KEY = new Map(AXES.map((a) => [a.key, a]));

/**
 * 1회 섭취 환산 배수 = packLabel 의 단위 붙은 숫자 ÷ basis 의 단위 붙은 숫자.
 * ⚠️ 첫 숫자를 집으면 안 된다 — 「1병(330ml)」에서 330 이 아니라 「1병」의 1 이 잡혀
 *    배수가 1/100 이 된다. 나트륨이 106mg → 1.1mg 으로 나온 적이 있다.
 */
function servFactor(p: Product): number | null {
  const b = (p.basis || "").match(/([\d.]+)\s*(?:ml|g)\b/i);
  const t = (p.packLabel || "").match(/([\d.]+)\s*(?:ml|g)\b/i);
  if (!b || !t) return null;
  const base = Number(b[1]);
  return base > 0 ? Number(t[1]) / base : null;
}

/** 1회 섭취 기준 값. 환산 불가(용량 미확인 등)면 null */
export function servValue(p: Product, key: AxisKey): number | null {
  const v = p[key];
  const f = servFactor(p);
  if (v == null || f == null) return null;
  return v * f;
}

/* (cat × 축) → 정렬된 1회 기준 값. 빌드 때 한 번 만든다 */
const scales = new Map<string, number[]>();
for (const p of products) {
  for (const a of AXES) {
    const v = servValue(p, a.key);
    if (v == null) continue;
    const k = `${p.cat}|${a.key}`;
    const arr = scales.get(k);
    if (arr) arr.push(v);
    else scales.set(k, [v]);
  }
}
for (const arr of scales.values()) arr.sort((x, y) => x - y);

export type AxisStanding = {
  key: AxisKey;
  label: string;
  unit: string;
  value: number | null;
  /** 0~1 · 1이 흔히 반기는 쪽 끝. 상세 화면 막대의 길이다 */
  score: number;
  /** 같은 카테고리에서 이 축이 신고된 제품 수 */
  n: number;
};

export function standings(p: Product): AxisStanding[] {
  return AXES.map((a) => {
    const arr = scales.get(`${p.cat}|${a.key}`);
    const v = servValue(p, a.key);
    if (v == null || !arr?.length)
      return { key: a.key, label: a.label, unit: a.unit, value: null, score: 0, n: 0 };

    // 동점은 앞선 것으로 세지 않는다
    let ahead = 0;
    for (const x of arr) if (a.goodHigh ? x > v : x < v) ahead++;
    return {
      key: a.key,
      label: a.label,
      unit: a.unit,
      value: v,
      score: 1 - ahead / arr.length,
      n: arr.length,
    };
  });
}

export function standingOf(p: Product, key: AxisKey): AxisStanding {
  return standings(p).find((s) => s.key === key)!;
}
