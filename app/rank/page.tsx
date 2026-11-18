import Link from "next/link";
import { CATEGORIES, catOf, countOf, isExtra, sampleOf, type Category } from "@/lib/categories";
import type { Product } from "@/lib/products";
import {
  AXIS_CHIPS,
  FIT_CHIPS,
  axisOf,
  fitsOf,
  byAxis,
  byPopularity,
  byRank,
  brandGroups,
  pool,
} from "@/lib/filters";
import { CategoryDropdown, Chips, RankGrid, RankRow, SubTabs } from "@/components/Bits";

/* ══════════════════════════════════════════════════════════════════════
   랭킹 — 화해 랭킹 탭의 구조를 그대로 옮긴 자리다.

     화해   급상승 · 카테고리별 · 피부별 · 연령대별 · 브랜드
     app3   많이 찾는 · 카테고리별 · 조건별 · 영양별 · 브랜드별

   하위 탭 아래에 **카테고리 드롭다운**이 공통으로 붙고, 그 아래에 목록이 온다.
   드롭다운은 접혀 있다가 펼치면 대분류가 나오고 대분류를 누르면 또 펼쳐진다.

   🔴 영양별 탭만 「전체」를 감춘다. 1병·1회분 30g·1개는 단위가 달라
      섞으면 순위가 성립하지 않는다 — 드롭다운이 장식이 아니라
      **비교가 성립하는 조건**이 되는 자리다.
   ══════════════════════════════════════════════════════════════════════ */

/* 🔴 **기본은 「카테고리별」이다** (2026-08-07 밤 · 팀 지시).
   랭킹 탭에 들어와서 처음 보는 것이 카테고리 순위여야 한다 — 이 개편의 본체가
   카테고리 일곱이고, 「많이 찾는」은 그 옆의 다른 잣대다.
   ⚠️ 배열 순서는 화면 순서라 「많이 찾는」을 앞에 두되 기본값만 카테고리별로 뒀다. */
const VIEWS = [
  { key: "popular", label: "많이 찾는" },
  { key: "category", label: "카테고리별" },
  { key: "fit", label: "조건별" },
  { key: "axis", label: "영양별" },
  { key: "brand", label: "브랜드별" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

type SP = Promise<{ view?: string; cat?: string; fit?: string; axis?: string }>;

export default async function Rank({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const view = (VIEWS.find((v) => v.key === sp.view)?.key ?? "category") as ViewKey;

  /* 🔴 **조건은 여러 개 겹쳐 건다** (2026-08-08 · 팀 지시 「토글 중복선택 가능하게」).
     ⚠️ `fit` 이 **아예 없을 때**(처음 들어옴)와 **빈 문자열일 때**(마지막 칩을 끔)를
        갈라야 한다. 안 그러면 마지막 하나를 끌 수가 없다 — 끄는 순간 기본값이
        되살아나 도로 켜진다. `fit=` (빈 값)은 「조건 없음」이다. */
  const fits =
    sp.fit === undefined
      ? view === "fit"
        ? [FIT_CHIPS[0]]
        : []
      : fitsOf(sp.fit);
  const fitKeys = fits.map((f) => f.key);
  const axis = axisOf(sp.axis) ?? (view === "axis" ? AXIS_CHIPS[0] : null);

  /* 영양별은 카테고리를 반드시 하나 고른다 — 전체는 단위가 섞여 순위가 안 선다 */
  const asked = catOf(sp.cat);
  const cat = view === "axis" ? (asked ?? CATEGORIES[0]) : asked;

  const link = (over: Partial<Record<string, string>>) => {
    const q = new URLSearchParams();
    q.set("view", over.view ?? view);
    const c = over.cat !== undefined ? over.cat : (cat?.key ?? "");
    if (c) q.set("cat", c);
    /* ⚠️ 빈 문자열도 실어야 한다 — 「조건 없음」과 「처음 들어옴」이 갈린다 (위 주석) */
    const f = over.fit !== undefined ? over.fit : fitKeys.join(",");
    if ((over.view ?? view) === "fit" && (f || over.fit !== undefined)) q.set("fit", f);
    const a = over.axis !== undefined ? over.axis : (axis?.key ?? "");
    if (a && (over.view ?? view) === "axis") q.set("axis", a);
    return `/rank?${q.toString()}`;
  };

  const base = pool(cat?.key ?? null);
  /* 🔴 **절 안이 AND** — 고를수록 좁아진다. OR 이면 고를수록 넓어져 이 절이 하려는
     일과 반대가 된다 (칩 줄 밑에 그렇게 적어 둔다). */
  const filtered =
    view === "fit" && fits.length ? base.filter((p) => fits.every((f) => f.test(p))) : base;
  /* 🔴 탭마다 잣대가 다르다 — 겹치면 탭이 둘일 이유가 없다 (팀 지시).
       많이 찾는  네이버 노출 수 (전 카테고리 섞임)
       카테고리별  그 카테고리의 랭킹 = 쿠팡 순위 (드링크·파우더는 노출 수)
       조건별     같은 랭킹 순서에서 조건만 거른 것
       영양별     신고값 축 순 */
  const list =
    view === "axis" && axis
      ? byAxis(filtered, axis.key)
      : view === "popular"
        ? byPopularity(filtered)
        : byRank(filtered);

  /* 🔴 **제목은 「랭킹」으로 고정한다** (2026-08-08 · 팀 지시).
     전에는 하위 탭을 따라 제목이 「많이 찾는 제품」→「카테고리별」→「조건별」로
     같이 바뀌었다. 바로 아래 하위 탭이 그 말을 이미 하고 있어 **같은 낱말이
     위아래로 두 번** 뜨는데다, 헤더에서 「랭킹」을 눌러 들어왔는데 제목이 다른
     이름이라 어디에 있는지가 흔들렸다.
     ⚠️ 무엇을 보고 있는지는 하위 탭의 켜진 칸이 말한다 — 제목이 할 일이 아니다. */
  const heading = "랭킹";

  /* ❌ 드롭다운 밑 설명줄을 지웠다 (2026-08-07 밤 · 팀 지시). 하위탭 → 알약 →
     회색 두 줄 → 목록 순서라 목록이 화면 아래로 밀려 있었다.
     ⚠️ 「판매량이 아니다」는 없앨 수 없는 문장이라 **제품 상세의 「이 순위는 어디서
        왔나」 상자**로 옮겨 두었다 — 순위를 주장하는 자리에 근거가 붙는다. */

  return (
    <>
      <div className="px-5 pt-6 pb-3">
        {/* 🔴 22px 먹색 → 28px 시그니처색 (2026-08-08 · 팀 지시). 이 쪽에서 유일한
            제목이라 헤더 탭(17px)보다 확실히 커야 「어디에 있는가」가 선다.
            ⚠️ --flame(3.73:1)은 큰 글자 전용이다 — 28px 600 이라 AA-large(3:1)를 넘는다.
               이보다 작게 줄이려면 --flame-deep(4.51:1)으로 갈아야 한다. */}
        <h1 className="kr text-[28px] leading-[1.25] font-semibold text-flame">{heading}</h1>
        {/* ❌ 「수록 210건」을 지웠다 (2026-08-08 · 팀 지시). 표본 수는 제목 밑에서
            제일 먼저 읽힐 값이 아니다 — 카테고리를 고른 뒤의 「단위 기준 · N건」만 남긴다 */}
        {cat && (
          <p className="mt-1 text-[12.5px] text-ink-dim">
            {`${cat.label} · ${cat.serving} 기준${view !== "brand" ? ` · ${list.length}건` : ""}`}
          </p>
        )}
      </div>

      <SubTabs
        items={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          href: link({ view: v.key }),
        }))}
        active={view}
      />

      <CategoryDropdown
        current={cat}
        href={(c) => link({ cat: c })}
        allowAll={view !== "axis"}
      />

      {view === "fit" && (
        <>
          <Chips
            /* 🔴 누르면 켜지고 **다시 누르면 꺼진다** — 토글이다 (팀 지시).
               전에는 `fit: c.key` 로 통째로 갈아 끼워 하나만 걸렸다. */
            items={FIT_CHIPS.map((c) => ({
              key: c.key,
              label: c.label,
              icon: c.icon,
              href: link({
                fit: (fitKeys.includes(c.key)
                  ? fitKeys.filter((k) => k !== c.key)
                  : [...fitKeys, c.key]
                ).join(","),
              }),
            }))}
            active={fitKeys}
          />
          {/* 🔴 **AND 라고 화면에 적는다.** 추측하게 두면 「고를수록 넓어지겠지」로 읽는다.
              ⚠️ 조건이 하나일 때는 안 적는다 — 겹칠 것이 없는데 규칙만 뜬다. */}
          <p className="kr px-5 pt-2 text-[12px] leading-[1.6] text-ink-dim">
            {fitKeys.length >= 2 ? (
              <>
                조건 {fitKeys.length}개를 <b className="font-semibold text-ink-sub">모두</b>{" "}
                만족하는 제품입니다 — 고를수록 좁아집니다.{" "}
                <Link href={link({ fit: "" })} className="text-flame-deep underline underline-offset-2">
                  조건 지우기
                </Link>
              </>
            ) : (
              "여러 개를 겹쳐 걸 수 있습니다 — 고를수록 좁아집니다."
            )}
          </p>
        </>
      )}
      {view === "axis" && (
        <Chips
          items={AXIS_CHIPS.map((c) => ({ key: c.key, label: c.label, href: link({ axis: c.key }), icon: c.icon }))}
          active={axis?.key ?? ""}
        />
      )}

      {view === "brand" ? (
        <BrandView cat={cat} />
      ) : view === "category" && !cat ? (
        <CategoryOverview link={link} />
      ) : list.length ? (
        <RankList list={list} />
      ) : (
        <Empty />
      )}
    </>
  );
}

/**
 * 목록 한 벌.
 *
 * 🔴 **추가 수록에는 순위 숫자를 주지 않는다** (2026-08-08). 쿠팡이 목록을 준
 *    카테고리에서 순위는 쿠팡이 매긴 것이고, 우리가 뒤에 붙인 제품에 번호를 달면
 *    **우리가 그 순위를 매긴 셈**이 된다. 숫자 자리를 비우고 브랜드 줄에
 *    어디서 온 제품인지 적는다 (`RankRow` 의 `tag`).
 * ⚠️ 그래서 번호는 목록 위치(`i`)가 아니라 **순위가 붙는 제품만 센 값**이다.
 *    영양별처럼 순서가 신고값으로 정해지는 탭에서도 자리는 그대로 두고 번호만 뺀다.
 */
function RankList({ list }: { list: Product[] }) {
  /* 번호는 순위가 붙는 제품만 세어 미리 매긴다 — 그리면서 세면 렌더 중 변수를
     고치게 되고, 그건 React 컴파일러가 막는다 (react-hooks/immutability) */
  const rankOf = new Map(list.filter((p) => !isExtra(p)).map((p, i) => [p.id, i + 1] as const));
  return (
    <div className="px-5 pb-8">
      {list.map((p) => {
        const rank = rankOf.get(p.id);
        if (rank != null) return <RankRow key={p.id} p={p} rank={rank} />;
        /* ❌ 「아래는 쿠팡 랭킹에 없지만…」 안내문을 지웠다 (2026-08-08 · 팀 지시).
           ⚠️ **번호를 안 붙이는 규칙과 행의 배지는 그대로다** — 안내문만 없앤 것이라
              「순위가 아닌 제품」이라는 사실은 배지(`tag`)가 계속 말한다. */
        return <RankRow key={p.id} p={p} rank={0} plain tag="쿠팡 목록 밖 · 식약처 신고" />;
      })}
    </div>
  );
}

/** 카테고리를 안 고른 「카테고리별」 — 일곱 칸을 한 화면에 편다 */
function CategoryOverview({ link }: { link: (o: Record<string, string>) => string }) {
  return (
    <div className="px-5 pb-8">
      {CATEGORIES.map((c) => {
        // 각 칸은 그 카테고리의 랭킹 순서 그대로 (쿠팡 순위 · 드링크·파우더는 노출 수)
        const items = byRank(sampleOf(c.key)).slice(0, 6);
        return (
          <section key={c.key} className="border-t border-line py-5 first:border-t-0 first:pt-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-ink">
                {c.label}
                <span className="ml-2 text-[12px] font-normal text-ink-dim">
                  {c.data ? `${countOf(c.key)}건 · ${c.serving} 기준` : "표본 수집 중"}
                </span>
              </h2>
              {c.data && (
                <Link
                  href={link({ cat: c.key })}
                  className="focus-ring shrink-0 rounded text-[12.5px] text-ink-dim"
                >
                  전체보기 ›
                </Link>
              )}
            </div>
            {items.length ? (
              <div className="-mx-5 mt-1">
                <RankGrid items={items} />
              </div>
            ) : (
              <p className="kr mt-2 text-[12.5px] leading-[1.6] text-ink-dim">
                아직 표본을 모으지 않은 카테고리입니다. 식약처 신고 자료에 후보는 있으나
                원재료(품목제조보고)가 아직 붙지 않아 화면에 올리지 않았습니다.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function BrandView({ cat }: { cat: Category | null }) {
  const groups = brandGroups(cat?.key ?? null, 12, 3);
  if (!groups.length) return <Empty />;
  return (
    <div className="grid gap-x-8 gap-y-6 px-5 pb-8 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <div key={g.brand}>
          <p className="flex items-baseline gap-2 border-b border-line pb-1.5">
            <span className="truncate text-[14px] font-semibold text-ink">{g.brand}</span>
            <span className="shrink-0 text-[11.5px] text-ink-dim">{g.total}건</span>
          </p>
          {/* 🔴 메달을 끈다 — 「그 브랜드 안에서 1위」가 전체 순위처럼 읽히면 안 된다 */}
          {g.items.map((p, i) => (
            <RankRow key={p.id} p={p} rank={i + 1} plain />
          ))}
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <p className="kr px-5 py-10 text-center text-[13px] leading-[1.7] text-ink-dim">
      이 조건에 맞는 제품이 수록 표본에 없습니다.
      <br />
      카테고리를 바꾸거나 조건을 풀어 보세요.
    </p>
  );
}
