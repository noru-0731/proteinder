import raw from "@/data/ingredients.json";
import { products, type Product } from "./products";

/* ══════════════════════════════════════════════════════════════════════
   원재료 사전이 쓰는 집계.

   해설 문구(ingredient-notes · source-notes)는 옛 앱에서 그대로 옮겼다.
   하나하나 오탐을 잡아 좁힌 결과라 다시 쓰지 않는다. 여기서 새로 만드는 것은
   **이 데이터에서 몇 번 나오는가**뿐이다.

   ⚠️ 표기 변형을 합치지 않는다 — 「알룰로스」와 「알룰로오스」는 다른 줄이다.
      신고서에 적힌 글자를 우리가 고칠 수 없다. 대신 해설(Entry.names)이
      양쪽을 함께 물고 있어 건수는 합산해서 보여준다.
   ══════════════════════════════════════════════════════════════════════ */

type Row = { name: string; count: number };

export const ingredientCounts = (raw as { items: Row[] }).items;
export const ingredientTotal = (raw as { total: number }).total;

const countByName = new Map(ingredientCounts.map((r) => [r.name, r.count]));
export const countOfName = (name: string) => countByName.get(name) ?? 0;

/** 이 표기가 들어간 제품 — 배합 순번이 앞선 쪽부터 */
export function productsWithIngredient(name: string): Product[] {
  return products
    .filter((p) => p.ings.includes(name))
    .sort((a, b) => a.ings.indexOf(name) - b.ings.indexOf(name) || b.pop - a.pop);
}

/**
 * 배합 순번 통계.
 * 🔴 **함량이 아니다.** 신고서에 함량 비율은 없다. 「목록 몇 번째에 적혔나」까지가
 *    우리가 말할 수 있는 전부다.
 */
export function rankStatsOf(name: string): { n: number; first: number; median: number } | null {
  const ranks = products
    .map((p) => p.ings.indexOf(name))
    .filter((i) => i >= 0)
    .map((i) => i + 1)
    .sort((a, b) => a - b);
  if (!ranks.length) return null;
  return {
    n: ranks.length,
    first: ranks.filter((r) => r === 1).length,
    median: ranks[Math.floor(ranks.length / 2)],
  };
}

/** 원료 분류 코드가 확인된 제품 수. ⚠️ 표기 건수가 아니다 — 제품명·판매처 근거도 센다 */
export function sourceCount(code: string): number {
  return products.filter((p) => p.codes.includes(code)).length;
}

export function productsWithCode(code: string): Product[] {
  return products.filter((p) => p.codes.includes(code)).sort((a, b) => b.pop - a.pop);
}
