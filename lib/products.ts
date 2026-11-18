/**
 * 🔴 **Product 의 정의는 이제 `lib/data.ts` 하나다** (2026-08-07 밤).
 *
 * ver1 의 제품 상세를 통째로 옮기면서 ver1 의 데이터 레이어(`data.ts`)가 함께 들어왔다.
 * 같은 이름의 타입이 두 곳에 있으면 「imgScore 가 number 냐 number|null 이냐」 같은
 * 사소한 차이로 화면이 컴파일되지 않는다 — 실제로 그렇게 막혔다.
 * 그래서 이 파일은 **data.ts 를 다시 내보내고, app3 가 따로 쓰는 도우미만** 얹는다.
 *
 * ⚠️ 수록 목록(식약처 476 + 쿠팡 150)을 정하는 곳도 data.ts 다. 여기서 또 거르지 않는다.
 */
export {
  products,
  catLabel,
  isEnergyConsistent as energyConsistent,
  findProduct,
  type Product,
} from "./data";

import { products, catLabel, type Product } from "./data";

export const byId = new Map(products.map((p) => [p.id, p]));

/** 카드 윗줄 — 브랜드가 없으면 카테고리를 적되 브랜드처럼 보이면 안 된다 */
export function brandLine(p: Product): { text: string; isBrand: boolean } {
  return p.brand ? { text: p.brand, isBrand: true } : { text: catLabel(p.cat), isBrand: false };
}

/**
 * 🔴 `0` 과 「반올림해서 0」을 갈라 적는다.
 * 당류가 정확히 0g 인 제품이 있고 그게 「당류 0g」의 조건이다.
 * 0.1~0.4g 을 그냥 0g 으로 적으면 화면에서 둘이 같아진다.
 */
export function whole(v: number | null | undefined, unit = ""): string {
  if (v == null) return "—";
  if (v === 0) return `0${unit}`;
  if (v < 1) return `<1${unit}`;
  return `${Math.round(v)}${unit}`;
}
