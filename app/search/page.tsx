import Link from "next/link";
import { redirect } from "next/navigation";
import Icon from "@/components/Icon";
import { search, shortcutOf, SUGGESTIONS } from "@/lib/search";
import { catLabel, products } from "@/lib/products";
import { SAMPLE_SIZE } from "@/lib/categories";
import { Note, RankGrid } from "@/components/Bits";

/**
 * 검색 결과.
 *
 * 🔴 순위 숫자를 끈다(`plain`). 랭킹의 숫자는 「무슨 순서로 늘어놨나」를
 *    뜻하는데, 검색 결과의 1·2·3 은 아무것도 뜻하지 않는다.
 * 🔴 표본 밖 제품은 결과에 넣되 그렇다고 적는다 — 검색은 476건 전체를 보고
 *    랭킹은 표본 60건만 본다는 것이 화면에서 어긋나면 안 된다.
 */

const PER_PAGE = 30;

type SP = Promise<{ q?: string; cat?: string; page?: string }>;

export default async function Search({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  /* 🔴 조건 낱말은 검색 결과를 거치지 않고 그 조건이 켜진 랭킹으로 바로 보낸다.
     헤더 폼·홈 폼·/products 우회·직접 URL 이 전부 이 쪽을 지나므로 여기 한 곳이면 된다.
     ⚠️ 넘길 낱말은 수록 476건에 그 글자가 하나도 없는 것만이다 (lib/search.ts 참조) */
  const jump = shortcutOf(q);
  if (jump) redirect(jump);

  const hits = search(q);

  /* 카테고리 칩은 실제 결과에서 센다 — 표본 건수를 적으면 결과와 어긋난다 */
  const counts = new Map<string, number>();
  for (const h of hits) counts.set(h.product.cat, (counts.get(h.product.cat) ?? 0) + 1);
  const cats = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const cat = sp.cat && counts.has(sp.cat) ? sp.cat : null;
  const filtered = cat ? hits.filter((h) => h.product.cat === cat) : hits;

  const page = Math.max(1, Number(sp.page) || 1);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const link = (over: { cat?: string | null; page?: number }) => {
    const s = new URLSearchParams({ q });
    const c = over.cat !== undefined ? over.cat : cat;
    if (c) s.set("cat", c);
    const pg = over.page ?? 1;
    if (pg > 1) s.set("page", String(pg));
    return `/search?${s}`;
  };

  if (!q)
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">무엇을 찾으시나요</p>
        <p className="kr mx-auto mt-2 max-w-[420px] text-[13px] leading-[1.7] text-ink-dim">
          제품명·브랜드·맛으로 찾습니다. 수록 {products.length}건 전체에서 찾습니다.
        </p>
        <Suggest />
      </div>
    );

  if (!hits.length)
    return (
      <div className="px-5 py-16 text-center">
        <p className="kr text-[15px] font-semibold text-ink">
          {/* 🔴 빈 화면에 아이콘 하나 — 글자만 있으면 「로딩 중인가」로 읽힌다 */}
          <Icon name="search-off" size={28} className="mx-auto mb-3 text-ink-dim" />
          「{q}」에 해당하는 제품이 없습니다
        </p>
        <p className="kr mx-auto mt-2 max-w-[440px] text-[13px] leading-[1.7] text-ink-dim">
          수록 {products.length}건 안에서 찾은 결과입니다. 식약처에 신고된 제품 가운데
          우리가 담은 것만 있어, 없는 제품은 아직 담지 못한 것입니다.
        </p>
        <Suggest />
      </div>
    );

  const outside = filtered.filter((h) => !h.inSample).length;

  return (
    <>
      <div className="px-5 pt-6 pb-1">
        <h1 className="kr text-[19px] leading-[1.35] font-semibold text-ink">
          <span className="text-flame">「{q}」</span> 검색 결과
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-dim">
          {filtered.length}건
          {pages > 1 && ` · ${page}/${pages}쪽`}
        </p>
      </div>

      {cats.length > 1 && (
        /* `chip-rail` — hover 그림자가 잘리지 않게 (globals.css). 위 여백은
           그 안에 이미 8px 이 들어 있어 `pt-2` 를 뺐다 */
        <div className="rail chip-rail gap-1.5 px-5">
          {[{ key: null as string | null, label: "전체", n: hits.length }, ...cats.map(([c, n]) => ({ key: c, label: catLabel(c), n }))].map(
            (c) => {
              const on = c.key === cat;
              return (
                <Link
                  key={c.key ?? "all"}
                  href={link({ cat: c.key })}
                  aria-current={on ? "true" : undefined}
                  /* hover 는 `.chip` 이 그린다 (globals.css) — 칩이라 부르는 것은
                     이 앱 어디서나 같은 손맛이어야 한다. 이 줄엔 아이콘이 없다 */
                  className={`chip focus-ring rounded-full border px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
                    on ? "chip--on border-ink bg-ink text-white" : "border-line-strong bg-card text-ink-sub"
                  }`}
                >
                  {c.label} {c.n}
                </Link>
              );
            },
          )}
        </div>
      )}

      <Note>
        {/* ⚠️ 「{SAMPLE_SIZE}건씩만」이라고 딱 잘라 적던 자리다. 두유에 「추가 수록」이
            한 건 붙어 31건이 되면서 틀린 말이 됐다 (lib/extras.ts) */}
        검색은 수록 {products.length}건 전체를 봅니다. 랭킹과 어워드는 카테고리마다
        표본 {SAMPLE_SIZE}건 안팎만 담아 견주므로, 여기 있는 제품이 랭킹에는 없을 수 있습니다
        {outside > 0 && ` — 이 결과에서는 ${outside}건이 그렇습니다`}.
      </Note>

      <RankGrid items={shown.map((h) => h.product)} plain />

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2 px-5 py-7" aria-label="쪽 넘기기">
          {page > 1 && (
            <Link
              href={link({ page: page - 1 })}
              className="focus-ring rounded-[8px] border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-sub hover:bg-bg"
            >
              이전
            </Link>
          )}
          <span className="px-2 text-[13px] text-ink-dim">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link
              href={link({ page: page + 1 })}
              className="focus-ring rounded-[8px] border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-sub hover:bg-bg"
            >
              다음
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

/** 🔴 인기순 상위를 그대로 쓰지 않는다 — pop 은 판매량이 아니라 노출 수라
    그걸로 「추천」이라 적으면 우리가 재지 않은 것을 잰 척하는 게 된다. 손으로 골랐다 */
function Suggest() {
  return (
    <div className="mt-7">
      <p className="text-[12px] text-ink-dim">이런 브랜드가 있습니다</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {SUGGESTIONS.map((s) => (
          <Link
            key={s}
            href={`/search?q=${encodeURIComponent(s)}`}
            className="focus-ring rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-semibold text-ink-sub hover:bg-bg"
          >
            {s}
          </Link>
        ))}
      </div>

      {/* 🔴 제품 이름 말고 **조건**으로도 찾을 수 있다는 것을 여기서 알린다 —
          「유당불내증」은 제품명에 없는 낱말이라 알려주지 않으면 아무도 안 친다.
          누르면 검색을 거쳐 조건별 랭킹으로 넘어간다 (lib/search.ts 의 SHORTCUTS) */}
      <p className="mt-6 text-[12px] text-ink-dim">조건으로도 찾습니다</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {["유당불내증", "제로"].map((s) => (
          <Link
            key={s}
            href={`/search?q=${encodeURIComponent(s)}`}
            className="focus-ring rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-semibold text-ink-sub hover:bg-bg"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
