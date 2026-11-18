import { products, catLabel, type Product } from "./products";
import { categoryOfProduct } from "./categories";

/* ══════════════════════════════════════════════════════════════════════
   검색.

   🔴 **검색만 표본 밖까지 본다.** 랭킹·어워드는 카테고리별 표본 30건
      안에서만 견주는데(같은 수라야 기울지 않는다), 검색은 견주는 일이
      아니라 **찾는 일**이다. 이름을 알고 들어온 사람에게 「표본에 없어서
      결과 0건」이라 답하면 그건 검색이 아니라 함정이다.
      제품 상세는 476건 전부 만들어져 있으므로 이어지는 곳도 있다.
   ⚠️ 그래서 결과 줄에 표본 밖인 것을 **적어 준다.** 감추지도 않고
      랭킹에 있는 것처럼 굴지도 않는다.

   ⚠️ 공백을 지우고 맞춘다 — 붙여 쓴 이름이 120건이다.
      「마이밀 뉴프로틴」으로 쳐도 `마이밀뉴프로틴`이 걸려야 한다.
   ══════════════════════════════════════════════════════════════════════ */

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 한 제품에서 검색어를 받아 주는 글자 전부 */
function haystack(p: Product): string {
  return norm([p.name, p.brand, catLabel(p.cat), ...p.flavors].join(" "));
}

const index = new Map(products.map((p) => [p.id, haystack(p)]));

export type Hit = { product: Product; inSample: boolean };

export function search(q: string): Hit[] {
  const needle = norm(q);
  if (!needle) return [];
  return products
    .filter((p) => index.get(p.id)!.includes(needle))
    .sort((a, b) => {
      /* 이름이 검색어로 시작하는 것을 앞에 — 「셀렉스」로 찾으면
         셀렉스 제품이 먼저고, 이름 가운데 걸린 것이 뒤다 */
      const sa = norm(a.name).startsWith(needle) ? 0 : 1;
      const sb = norm(b.name).startsWith(needle) ? 0 : 1;
      return sa - sb || b.pop - a.pop || a.name.localeCompare(b.name, "ko");
    })
    .map((p) => ({ product: p, inSample: categoryOfProduct(p) != null }));
}

/** 결과가 0건일 때 대신 권할 말 — 지어내지 않고 실제로 결과가 있는 것만 */
export const SUGGESTIONS = ["셀렉스", "랩노쉬", "테이크핏", "마이프로틴", "하이뮨"];

/* ── 조건 낱말 → 그 조건이 켜진 화면 ──────────────────────────────
   🔴 **제품 이름이 아닌 낱말로 검색하는 사람이 있다.** 「유당불내증」은
      제품명·브랜드·맛 어디에도 없어 지금까지 결과 0건이었는데, 그 말을 친
      사람이 찾던 것은 제품 하나가 아니라 **그 조건으로 거른 목록**이다.
      랭킹의 조건별 탭이 이미 그 목록이므로 그리로 넘긴다.

   🔴 **수록에 그 낱말이 하나도 없는 말만 넣는다** (실측 · 476건 대조).
      「식물성」은 제품명에 14건, 「락토프리」는 4건이 있어 넣지 않았다 —
      넘겨 버리면 있는 제품을 검색에서 감추는 게 된다. 여기 넣기 전에
      반드시 세어 볼 것.
   ⚠️ 정확히 같을 때만 넘긴다. 「유당불내증 음료」처럼 뒤에 말이 붙으면
      검색으로 두는 게 맞다 — 그건 제품을 찾는 말이다. */
const SHORTCUTS: { terms: string[]; href: string }[] = [
  {
    terms: ["유당불내증", "유당불내", "유당", "우유안들어간", "유당없는", "유당프리"],
    href: "/rank?view=fit&fit=lactose",
  },
  {
    /* 🔴 「제로」만 예외다 — 이름에 든 제품이 3건 있는데도 넘긴다 (팀 지시).
       치는 사람이 찾는 것이 제품 셋이 아니라 **당류 0g 목록**이라는 판단이고,
       그 셋(린코어 제로슈거 초코 프로틴 · 단백한하루 렌틸콩 당제로 ·
       제로 슈가 프로틴 크래커 치즈)은 「제로슈거」·「당제로」·제품명 전체로
       여전히 검색된다.
       ⚠️ 「zero」(5건)·「제로슈거」(1건)·「당류0」(1건)은 안 넘긴다 — 그건 이름을
          치는 말에 가깝다. */
    terms: ["제로", "당류제로", "제로당", "당0", "무설탕", "설탕없는", "노슈거", "슈거프리"],
    href: "/rank?view=fit&fit=sugar0",
  },
];

/** 검색어가 조건 낱말이면 갈 곳, 아니면 null */
export function shortcutOf(q: string): string | null {
  const n = norm(q);
  if (!n) return null;
  return SHORTCUTS.find((s) => s.terms.some((t) => norm(t) === n))?.href ?? null;
}
