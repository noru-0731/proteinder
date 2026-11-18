import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

/**
 * `/products` — ver1 의 제품검색 주소를 app3 의 랭킹 탭으로 잇는다.
 *
 * 🔴 ver1 의 제품검색 화면을 옮기지 않았다. app3 에서 그 자리는 **랭킹 탭**이고,
 *    둘 다 두면 같은 일을 하는 목록 화면이 둘이 된다.
 *    다만 ver1 상세를 통째로 옮기면서 그 안의 링크(브레드크럼·브랜드·맛·계통)가
 *    전부 `/products?...` 를 가리키게 됐다 — **죽은 링크를 남기지 않으려고**
 *    여기서 받아 넘긴다.
 *
 * ⚠️ 옮길 수 있는 것만 옮긴다.
 *      cat=RTD 음료   → /rank?view=category&cat=rtd     (카테고리는 1:1 로 이어진다)
 *      brand=·flavor= → /search?q=…                     (랭킹에 브랜드 검색이 없다)
 *      base=·나머지    → /rank                            (대응이 없으면 목록 첫 화면으로)
 *    없는 필터를 있는 척 흉내 내지 않는다 — 조용히 가까운 화면으로 보낸다.
 */
type SP = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProductsCompat({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  const cat = one(sp.cat);
  if (cat) {
    const hit = CATEGORIES.find((c) => c.data === cat || c.key === cat);
    if (hit) redirect(`/rank?view=category&cat=${hit.key}`);
  }

  const q = one(sp.q) ?? one(sp.brand) ?? one(sp.flavor);
  if (q) redirect(`/search?q=${encodeURIComponent(q)}`);

  redirect("/rank");
}
