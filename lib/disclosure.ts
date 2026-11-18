import { OPAQUE_NAMES, type Product } from "./data";

/* ══════════════════════════════════════════════════════════════════════
   원료 공개도 — 🔴 **제품이 아니라 신고서에 매기는 등급이다**
   ══════════════════════════════════════════════════════════════════════

   재는 것: 신고된 원재료 중 **이름만으로 내용을 알 수 없는 표기**가 몇 %인가.
   재지 않는 것: 그 제품이 좋은지 나쁜지. 건강한지 안전한지. (원칙 7)

   🔴 **「공개도 D」는 「나쁜 제품」이 아니다.** 불투명 표기는 회사가 숨겨서만
      생기지 않는다 — 완제품 회사가 다른 업체에서 사 온 반제품을 「두류가공품」
      한 줄로 신고하면, 그 안의 내용은 신고 의무 밖이라 목록에 안 드러난다.
      **위탁생산 구조에서 자동으로 생기는 표기다.** 기준 페이지에 그대로 적는다.

   🔴 **컷은 백분위가 아니라 절대 비율이다.** 프로틴랩은 20/30/30/20 백분위로
      자르는데, 우리는 그러지 않는다 — **0%(표기가 전부 명확)가 자연스러운 경계**이고
      백분위로 자르면 그 85건이 다른 등급으로 쪼개진다. 대신 각 구간의 건수를
      기준 페이지에 그대로 공개한다. 컷을 고른 것은 우리다.

   ⚠️ **비율은 작은 표본에서 튄다.** `뉴질랜드 산양유 농축 프로틴`은 원재료가
      **1종뿐인데 그게 불투명 표기**라 100% → D 가 된다. 표기가 적은 것이지
      가린 것이 아니다. **원재료 5종 미만은 등급을 주지 않는다** (14건).

   ⚠️ **원재료 미신고 141건은 「0%」가 아니라 「등급 없음」이다.**
      모르는 것을 좋은 쪽으로도 나쁜 쪽으로도 적지 않는다.

   실측 (2026-08-06 · 등급 대상 506건)
     A  0%       85 (17%)      C  10% 초과~25%  175 (35%)
     B  ~10%     95 (19%)      D  25% 초과      151 (30%)
*/

export type DisclosureGrade = "A" | "B" | "C" | "D";

/** 등급을 못 주는 두 가지 이유. 둘을 갈라야 화면에서 다른 말을 할 수 있다 */
export type DisclosureSkip = "미신고" | "표기부족";

export type Disclosure = {
  grade: DisclosureGrade | null;
  /** grade 가 null 일 때만 채워진다 */
  skip: DisclosureSkip | null;
  /** 알 수 없는 표기 개수 */
  opaque: number;
  /** 신고된 원재료 총 종수 */
  total: number;
  /** 0~1 */
  ratio: number;
};

/** 등급을 내려면 원재료가 이만큼은 신고돼 있어야 한다 */
export const MIN_INGREDIENTS = 5;

/**
 * 구간. 🔴 **위 경계는 「초과」다** — 정확히 10.0%인 제품은 B 다.
 * ⚠️ 화면 문구와 이 배열이 어긋나면 안 된다. 기준 페이지가 이 배열을 그대로 읽는다.
 */
export const DISCLOSURE_CUTS: {
  grade: DisclosureGrade;
  /** ratio <= max 이면 이 등급 */
  max: number;
  label: string;
}[] = [
  { grade: "A", max: 0, label: "알 수 없는 표기가 하나도 없음" },
  { grade: "B", max: 0.1, label: "10% 이하" },
  { grade: "C", max: 0.25, label: "10% 초과 ~ 25% 이하" },
  { grade: "D", max: 1, label: "25% 초과" },
];

export function disclosureOf(p: Product): Disclosure {
  const total = p.ings.length;
  const opaque = p.ings.filter((n) => OPAQUE_NAMES.has(n)).length;
  const ratio = total > 0 ? opaque / total : 0;

  if (total === 0) return { grade: null, skip: "미신고", opaque: 0, total: 0, ratio: 0 };
  if (total < MIN_INGREDIENTS)
    return { grade: null, skip: "표기부족", opaque, total, ratio };

  const hit = DISCLOSURE_CUTS.find((c) => ratio <= c.max) ?? DISCLOSURE_CUTS[3];
  return { grade: hit.grade, skip: null, opaque, total, ratio };
}

/** 기준 페이지가 쓰는 실제 분포. 우리가 센 값이므로 화면에 그대로 적는다 */
export function disclosureCounts(products: Product[]) {
  const of = products.map(disclosureOf);
  const byGrade = new Map<DisclosureGrade, number>();
  for (const c of DISCLOSURE_CUTS) byGrade.set(c.grade, 0);
  let 미신고 = 0;
  let 표기부족 = 0;
  for (const d of of) {
    if (d.grade) byGrade.set(d.grade, (byGrade.get(d.grade) ?? 0) + 1);
    else if (d.skip === "미신고") 미신고++;
    else 표기부족++;
  }
  const graded = [...byGrade.values()].reduce((a, b) => a + b, 0);
  return { byGrade, graded, 미신고, 표기부족, total: products.length };
}
