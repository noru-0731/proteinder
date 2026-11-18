/**
 * 값을 화면 글자로 옮기는 **잎 모듈** — 무엇도 import 하지 않는다 (2026-08-08).
 *
 * 🔴 **`data.ts` 에서 갈라 냈다.** 이 셋은 순수 함수인데 `data.ts` 안에 있었고,
 *    그 파일 첫 줄이 `import raw from "@/data/products.json"` 이다. 그래서
 *    `lib/likes.ts` 가 `catLabel` 하나 쓰려고 `./data` 를 부르는 것만으로
 *    **제품 626건이 클라이언트 번들에 통째로 실렸다** — 실측 776KB.
 *    찜콩 하트는 레이아웃과 모든 카드에 있으므로 그 776KB 가 전 화면에 따라다녔다.
 *
 * ⚠️ **여기에 아무것도 import 하지 말 것.** 잎으로 두는 것이 이 파일의 전부다.
 * ⚠️ `data.ts` 가 이 셋을 그대로 다시 내보낸다 — 기존 `from "./data"` 는 안 깨진다.
 */

/**
 * 🔴 데이터 값은 안 바꾸고 **화면 이름만** 갈아 끼운다.
 *    `products.json` 의 `cat`, 선별 목록 CSV, `verify_*.py` 가 전부 이 문자열을
 *    키로 쓴다. 이름 하나 고치려고 파이프라인을 다시 돌리면 `food_cd` 가 바뀌고
 *    사진 연결이 끊긴다.
 */
export const CATEGORY_LABEL: Record<string, string> = {
  "RTD 음료": "프로틴 드링크",
  파우더: "프로틴 파우더",
  // 나머지 다섯은 데이터 값이 곧 화면 이름이라 갈아 끼울 것이 없다
};

export const catLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat;

/**
 * 🔴 `0` 과 「반올림해서 0」을 갈라 적는다.
 *    당류가 정확히 0g 인 제품이 태그의 조건인데, 0.1~0.4g 짜리를 그냥 0g 으로
 *    적으면 화면에서 둘이 같아진다 — 태그가 없는 제품이 「당류 0」처럼 보인다.
 *    그래서 `<1` 로 적는다. 소수점은 없어지고 0 과도 갈린다.
 */
export function formatWhole(v: number | null, unit = ""): string {
  if (v == null) return "—";
  if (v > 0 && v < 0.5) return `<1${unit}`;
  return Math.round(v) + unit;
}

export function formatNum(v: number | null, unit = ""): string {
  if (v == null) return "—";
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return s + unit;
}

/**
 * 비교 표에 한 번에 놓는 제품 수 상한.
 *
 * 🔴 **`lib/compare.ts` 가 아니라 여기 있다** (2026-08-08 · 번들 실측).
 *    클라이언트 부품 셋(찜콩 목록·비교 담기 칸·찜콩에서 가져오기)이 이 숫자 하나를
 *    쓰려고 `lib/compare` 를 부르는데, 그 파일은 `nutrition-grades` → `data.ts` →
 *    products.json 을 문다. 상수 하나 때문에 제품 626건이 딸려갈 이유가 없다.
 * ⚠️ 넷을 넘으면 1200px 에서 열이 200px 아래로 좁아진다 — 그게 이 값의 근거다.
 */
export const MAX_COMPARE = 4;
