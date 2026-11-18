import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { type Product, brandLine, whole } from "@/lib/products";
import CardRating from "@/components/CardRating";
import PriceLine from "@/components/PriceLine";
import {
  CATEGORIES,
  GROUPS,
  countOf,
  groupCount,
  TOTAL,
  type Category,
} from "@/lib/categories";

/* 화면 부품 — 절 제목 · 칩 줄 · 순위 줄 · 카드 · 카테고리 드롭다운 */

/**
 * 절 제목.
 *
 * ❌ **눈썹줄(eyebrow)을 없앴다** (2026-08-07 밤 · 팀 지시). 제목 위 회색 한 줄과
 *    제목 아래 설명 한 줄이 절마다 붙어 홈이 「회색 → 검정 → 회색」의 반복이었다.
 *    남은 것은 제목과 「전체보기」뿐이다.
 */
export function SectionHead({
  title,
  accent,
  href,
}: {
  title: string;
  /** 제목 안에서 주색으로 강조할 부분. 화해는 절 제목의 한 덩이만 주색으로 칠한다 */
  accent?: string;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-7 pb-3">
      <div>
        <h2 className="kr text-[19px] leading-[1.35] font-semibold text-ink">
          {accent && <span className="text-flame">{accent}</span>}
          {accent ? " " : ""}
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="focus-ring mt-1 flex shrink-0 items-center gap-0.5 rounded text-[12.5px] text-ink-dim"
        >
          전체보기
          <Caret />
        </Link>
      )}
    </div>
  );
}

function Caret() {
  return (
    <Icon name="chevron-right" size={16} />
  );
}

/**
 * 🔴 카드의 값 줄 — app3 에서 등급 배지가 있던 자리다.
 *
 * app2 는 여기에 [S] 를 붙였다. 등급 글자는 다섯 갈래뿐이라 30개를 늘어놓으면
 * 같은 글자가 줄줄이 반복되고, 정작 제품이 무엇인지는 안 보였다.
 * 신고값 셋을 그대로 적으면 같은 자리에서 제품이 갈린다.
 *
 * ⚠️ 당류 미신고는 칸 자체를 안 적는다 — 「0」이 아니라 「모름」이다.
 */
export function NutLine({ p, className = "" }: { p: Product; className?: string }) {
  const bits: React.ReactNode[] = [];
  if (p.protPack != null)
    bits.push(
      <span key="p" className="font-semibold text-ink">
        단백질 {whole(p.protPack, "g")}
      </span>,
    );
  if (p.kcalPack != null) bits.push(<span key="k">{whole(p.kcalPack, "kcal")}</span>);
  if (p.sugarPack != null) bits.push(<span key="s">당류 {whole(p.sugarPack, "g")}</span>);
  if (!bits.length)
    return <span className={`text-[12px] text-ink-dim ${className}`}>1회 기준 환산 미산출</span>;

  return (
    <span className={`flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink-dim ${className}`}>
      {bits.map((b, i) => (
        <span key={i} className="flex items-center gap-x-1.5">
          {i > 0 && <span aria-hidden>·</span>}
          {b}
        </span>
      ))}
    </span>
  );
}

/** 칩 줄 — 링크라 JS 가 없다. 켜진 것은 채워서 표시한다 */
/* 🔴 칩에 아이콘을 받는다 (2026-08-08 · 팀 지시 「적합한 곳에 아이콘」).
   ⚠️ **선택**이다. 안 넘기면 예전 그대로 글자만 — 아이콘이 뜻을 못 나르는 자리
      (브랜드 칩 등)에는 붙이지 않는다. 장식으로 채우면 태그를 걷어낸 의미가 없다. */
export function Chips({
  items,
  active,
}: {
  items: { key: string; label: string; href: string; icon?: IconName }[];
  /**
   * 켜진 칩. 🔴 **배열이면 여럿이 켜진다** (2026-08-08 · 팀 지시 「토글 중복선택」).
   * 조건별은 배열(AND 로 겹쳐 건다), 영양별은 낱말 하나다 — 정렬 축이라 둘일 수 없다.
   */
  active: string | string[];
}) {
  return (
    /* `chip-rail` — hover 그림자가 스크롤 상자에 잘리지 않게 안쪽 여백을 준다
       (globals.css). 이게 없으면 분홍 빛이 직선으로 뭉텅 끊긴다 */
    <div className="rail chip-rail gap-1.5 px-5">
      {items.map((c) => {
        const on = Array.isArray(active) ? active.includes(c.key) : c.key === active;
        return (
          <Link
            key={c.key}
            href={c.href}
            scroll={false}
            aria-current={on ? "true" : undefined}
            /* hover·누름은 `.chip` 이 그린다 (globals.css) — 꺼진 알약엔 시그니처가
               스치고, 켜진 알약은 떠오른다. `transition-colors` 는 그쪽으로 옮겼다 */
            className={`chip focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
              on ? "chip--on border-ink bg-ink text-white" : "border-line-strong bg-card text-ink-sub"
            }`}
          >
            {/* 🔴 켜진 알약의 아이콘만 시그니처색 (2026-08-08 · 팀 지시). 검정 위
                #ff2358 은 5.05:1 이라 넉넉하다. 헤더 탭이 켜지면 글자가 시그니처가
                되는 것과 같은 신호 — 여기는 글자가 흰색이라 아이콘이 그 자리를 맡는다.
                ⚠️ 꺼진 알약 아이콘은 그대로 둔다. 물들이면 켜짐 표시가 둘로 갈린다 */}
            {c.icon && <Icon name={c.icon} size={14} className={on ? "text-flame" : ""} />}
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * 순위 한 줄. 1~3위는 메달, 그 아래는 숫자.
 *
 * ⚠️ 8/7 오후의 「등수 숫자를 없애라」와 부딪히는 자리라 선을 그어 둔다 —
 *    **여기 숫자는 「이 목록을 무슨 순서로 늘어놨나」**이고, 지운 것은 제품
 *    상세의 「262건 중 236위」(그 제품이 몇 등짜리인가)였다. 다른 진술이다.
 *
 * `plain` 은 메달을 끄는 것 — 브랜드 절처럼 「그 브랜드 안에서 1위」가
 * 전체 순위처럼 읽히면 안 되는 자리에 쓴다.
 */
export function RankRow({
  p,
  rank,
  plain,
  tag,
}: {
  p: Product;
  rank: number;
  plain?: boolean;
  /** 브랜드 줄 자리에 대신 적을 한 마디. 순위 없이 붙인 제품이 어디서 왔는지 적는다 */
  tag?: string;
}) {
  const b = brandLine(p);
  /* 🔴 이모지 메달을 걷어냈다 (2026-08-08 · 팀 지시 「작고 시인성이 떨어진다」).
     🥇🥈🥉 는 키워도 흐리고 **몇 위인지 숫자로 안 읽힌다.** 채움 원 + 순위 숫자로
     바꾼다 — 색이 등수 계열을, 숫자가 정확한 등수를 말한다. 4위부터는 숫자만이다. */
  const MEDAL = [
    "bg-medal-gold text-medal-gold-ink",
    "bg-medal-silver text-medal-silver-ink",
    "bg-medal-bronze text-white",
  ];
  const medal = !plain && rank <= 3 ? MEDAL[rank - 1] : null;
  return (
    /* 🔴 제품마다 구분선 (2026-08-07 밤 · 팀 지시 · 화해 벤치마크).
       목록에서 어디까지가 한 제품인지 선이 갈라 준다 — 제품명이 두 줄인 것과
       한 줄인 것이 섞여 있어 여백만으로는 경계가 흔들렸다.
       ⚠️ `last:border-b-0` 을 쓰지 않는다. RankGrid 는 세로로 채우는 격자라
          「마지막」이 DOM 상 하나뿐이고, 열마다 끝줄이 달라 오히려 어긋난다.
          모든 행에 밑선을 두면 열이 몇 개든 같은 모양이 된다. */
    /* ❌ **선을 다 지웠다** (2026-08-08 · 팀 지시 「선은 다 지우고 스칠 때 애니메이션은
       유지」). 밑줄(`border-b`) → 사방 테두리 → 무선(無線)으로 두 번 옮겼다.
       🔴 **경계는 hover 가 맡는다.** 스치면 떠오르고 그림자가 생겨 그때 한 칸이
          한 물건으로 보인다. 가만히 있을 때는 사진 틀과 여백이 칸을 가른다.
       ⚠️ 세로 간격은 `RankGrid` 가 `gap-y-3` 으로 준다. 여기서 `mb` 를 주면
          열마다 마지막 칸 아래에 빈 칸이 남는다 (세로 채움 격자라 「마지막」이 열마다 다르다). */
    <Link
      href={`/product/${p.id}`}
      className="prow focus-ring flex items-center gap-2.5 rounded-xl bg-card p-3"
    >
      {/* ⚠️ `plain` 일 때는 숨긴다. 칸이 비어 있는데 `aria-label` 만 남으면 화면에
             없는 순위를 읽어 준다 — 매거진 기사의 제품 목록은 `rank` 를 안 넘겨
             모든 행이 「0위」로 읽히고 있었다. 브랜드 절도 「그 브랜드 안에서의
             차례」라 전체 순위처럼 읽히면 안 되는 것은 마찬가지다. */}
      <span
        className="w-6 shrink-0 text-center"
        aria-label={plain ? undefined : `${rank}위`}
        aria-hidden={plain || undefined}
      >
        {medal ? (
          /* 채움 원 + 순위 숫자 — 색이 등수 계열을, 숫자가 정확한 등수를 말한다 */
          <span
            className={`inline-grid size-[22px] place-items-center rounded-full text-[12.5px] font-extrabold tabular-nums ${medal}`}
          >
            {rank}
          </span>
        ) : (
          !plain && (
            <span className="text-[13px] font-semibold tabular-nums text-ink-sub">{rank}</span>
          )
        )}
      </span>
      {/* 🔴 썸네일 테두리를 `--line`(#eee · 1.13:1) 에서 `--line-strong`(#ddd) 로.
          우리 사진이 대부분 **흰 배경 제품컷**이라 흰 카드 위에서 사진과 배경이
          이어져 보였다 — 「제품 경계선이 명확하지 않다」의 실체가 이 자리다 */}
      <span className="prow-thumb h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[6px] border border-line-strong bg-card">
        {p.img && (
          // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG. 런타임 외부 요청을 0으로 둔다
          <img src={p.img} alt="" width={52} height={52} className="h-full w-full object-contain" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[11.5px] ${
            tag ? "text-ink-dim" : b.isBrand ? "text-ink-sub" : "text-ink-dim"
          }`}
        >
          {tag ?? b.text}
        </span>
        <span className="kr clamp-2 block text-[13.5px] leading-[1.35] font-semibold text-ink">
          {p.name}
        </span>
        {/* 🔴 별점 (2026-08-08 · 화해 문법) — 제품명 아래, 영양값 위.
            화해 랭킹 행이 「제품명 → ★4.61 (84,781) → 나머지」 순서다. */}
        <CardRating id={p.id} className="mt-0.5" />
        <NutLine p={p} className="mt-0.5" />
        {/* 가격 — 수집된 제품에만 (2026-08-08 · 팀 지시) */}
        <PriceLine id={p.id} className="mt-0.5" />
      </span>
    </Link>
  );
}

/**
 * 순위 여러 개를 여러 열로 — 화해 홈의 리스트 블록.
 *
 * 🔴 **세로로 채운다.** 왼쪽 열이 1·2·3 이고 다음 열이 4·5·6 이다.
 *    grid 기본값은 가로 채움이라 그냥 두면 왼쪽이 1·4·7 이 되어
 *    메달이 한 줄에 가로로 붙는다 — 화해와 반대이고 순위가 안 읽힌다.
 *
 * ⚠️ 열 수를 브레이크포인트로 정한다. 600px 한 컬럼이던 app2 는 2열이었고
 *    app3 는 1200px 이라 데스크톱에서 3열이다. 열이 늘면 한 열의 행 수가
 *    줄도록 rows 를 같이 계산해야 세로 채움이 유지된다.
 */
export function RankGrid({
  items,
  cols = 3,
  plain,
}: {
  items: Product[];
  cols?: 2 | 3;
  plain?: boolean;
}) {
  const n = Math.max(items.length, 1);
  return (
    <div
      /* gap-y-3 — 카드를 선으로 두르면서 행 사이가 필요해졌다 (RankRow 주석) */
      className={`rank-grid gap-x-6 gap-y-3 px-5 ${cols === 3 ? "rank-grid--3" : ""}`}
      style={
        {
          "--r2": Math.ceil(n / 2),
          "--r3": Math.ceil(n / 3),
        } as React.CSSProperties
      }
    >
      {items.map((p, i) => (
        <RankRow key={p.id} p={p} rank={i + 1} plain={plain} />
      ))}
    </div>
  );
}

/** 가로 캐러셀의 큰 카드 */
export function RailCard({ p }: { p: Product }) {
  const b = brandLine(p);
  return (
    /* `.pcard` 가 hover 를 준다 (globals.css). 테두리는 없다 — RankRow 주석 참조 */
    <Link
      href={`/product/${p.id}`}
      className="pcard focus-ring block w-[176px] rounded-xl bg-card p-2.5"
    >
      <span className="block aspect-square w-full overflow-hidden rounded-lg border border-line bg-card">
        {p.img && (
          // eslint-disable-next-line @next/next/no-img-element -- 위와 같다
          <img
            src={p.img}
            alt=""
            width={168}
            height={168}
            className="h-full w-full object-contain"
          />
        )}
      </span>
      <span
        className={`mt-2 block truncate text-[11.5px] ${b.isBrand ? "text-ink-sub" : "text-ink-dim"}`}
      >
        {b.text}
      </span>
      <span className="kr clamp-2 mt-0.5 block text-[13.5px] leading-[1.35] font-semibold text-ink">
        {p.name}
      </span>
      <CardRating id={p.id} />
      <NutLine p={p} className="mt-1" />
      <PriceLine id={p.id} className="mt-0.5" />
    </Link>
  );
}

/** 절 아래 설명 한 줄 — 무엇을 근거로 골랐는지 화면에 그대로 적는다 */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="kr max-w-[760px] px-5 pt-1 pb-2.5 text-[12.5px] leading-[1.65] text-ink-dim">
      {children}
    </p>
  );
}

/** 절 사이 회색 띠 — 화해는 흰 컬럼을 이걸로 나눈다 */
export function Gap() {
  return <div className="h-2.5 bg-bg" />;
}

export function MoreButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-5 pt-3 pb-1">
      <Link
        href={href}
        className="focus-ring flex items-center justify-center gap-1 rounded-[8px] border border-line-strong py-2.5 text-[13px] font-semibold text-ink-sub hover:bg-bg"
      >
        {label}
        <Caret />
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   카테고리 고르기 — 이 개편의 핵심 부품.

   화해 랭킹의 「카테고리 전체 ▾」 자리다.

   🔴 **여는 자리는 작고 검다.** 필터가 화면의 주인공이 아니라서다 —
      목록이 주인공이고 이건 목록을 갈아 끼우는 손잡이다 (팀 지시).
   🔴 **아래로 펼치지 않고 화면을 덮는다.** 판이 목록 위에 드리우면 뒤가 비쳐
      「무엇을 고르는 중인가」가 흐려진다. 시트 안에서는 고르는 일만 한다.
   🔴 JS 가 0 이다. 체크박스 + label 셋(알약·뒷막·✕)이 같은 토글을 가리키고,
      항목을 고르면 페이지가 새로 그려지며 저절로 닫힌다. CSS 는 globals.css.

   ⚠️ 안쪽 그룹은 <details> 로 두되 **전부 펼쳐서** 내려보낸다. 시트가 이미
      화면을 덮고 있어 접을 이유가 없고, 두 번 눌러야 카테고리에 닿으면
      「깔끔함」이 아니라 번거로움이 된다.
   ══════════════════════════════════════════════════════════════════════ */
export function CategoryDropdown({
  current,
  href,
  allowAll = true,
  id = "catsheet",
}: {
  current: Category | null;
  /** 카테고리 키(또는 전체를 뜻하는 "")를 받아 이동할 주소를 만든다 */
  href: (catKey: string) => string;
  /** 영양별 탭은 카테고리를 섞으면 단위가 달라져 「전체」를 감춘다 */
  allowAll?: boolean;
  /** 한 화면에 둘 이상 놓일 때 토글이 겹치지 않게 */
  id?: string;
}) {
  /* ⚠️ 위아래 간격 — pt-1 pb-2 는 하위탭과 목록 사이에 알약이 끼어 답답했다.
     알약은 「목록을 갈아 끼우는 손잡이」라 제 자리를 가져야 한다 (팀 지시) */
  return (
    <div className="px-5 pt-4 pb-5">
      <input type="checkbox" id={id} className="sheet-toggle peer sr-only" />

      {/* 여는 알약 — 작고 검다 */}
      <label
        htmlFor={id}
        /* ⚠️ 이 손잡이는 늘 검다 — 켜짐/꺼짐이 없으므로 `chip--on` 을 고정으로 준다.
           칩과 같은 hover(떠오름 + 그림자)를 받는다 */
        className="chip chip--on sheet-open inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-white"
      >
        {/* 🔴 알약에서 건수를 뺐다 (2026-08-08 · 팀 지시 「210 이라고 적혀 있는 게 별로」).
            이건 **목록을 갈아 끼우는 손잡이**지 수록량을 알리는 자리가 아니다 —
            건수는 열었을 때 목록 안에 그대로 있다. */}
        {/* 고른 카테고리의 제형 아이콘 — 알약만 봐도 무엇을 보는 중인지.
            🔴 검은 알약의 아이콘은 시그니처색 (칩과 같은 규칙) */}
        {current && <Icon name={current.icon} size={15} className="text-flame" />}
        {current ? current.label : "카테고리 전체"}
        <Icon name="chevron-down" size={12} />
      </label>

      {/* 뒷막 — 바깥을 누르면 닫힌다 */}
      <label htmlFor={id} className="sheet-backdrop" aria-label="닫기" />

      {/* 시트 */}
      <div className="sheet-panel" role="dialog" aria-label="카테고리 고르기">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-card px-5 py-4">
          <span className="text-[16px] font-semibold text-ink">카테고리</span>
          <label
            htmlFor={id}
            className="-mr-1.5 cursor-pointer rounded p-1.5 text-ink-sub"
            aria-label="닫기"
          >
            <Icon name="x" size={20} />
          </label>
        </div>

        <div className="px-5 pt-2 pb-8">
          {allowAll && (
            <Link
              href={href("")}
              className={`focus-ring flex items-center justify-between rounded-[8px] px-3 py-3 text-[14.5px] font-semibold hover:bg-bg ${
                current ? "text-ink" : "bg-flame-wash text-flame-deep"
              }`}
            >
              전체
              <span className="text-[12.5px] font-normal text-ink-dim">{TOTAL}건</span>
            </Link>
          )}

          {GROUPS.map((g) => {
            const cats = CATEGORIES.filter((c) => c.group === g.key);
            return (
              <div key={g.key} className="border-t border-line pt-3.5 pb-1 first:border-t-0">
                <p className="px-3 text-[12.5px] text-ink-dim">
                  <span className="font-semibold text-ink-sub">{g.label}</span> · {g.hint}
                  <span className="ml-1.5 text-ink-dim">{groupCount(g.key)}건</span>
                </p>
                <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
                  {cats.map((c) => {
                    const n = countOf(c.key);
                    const on = current?.key === c.key;
                    if (!c.data)
                      /* 아직 표본이 없는 카테고리 — 감추지 않고 자리를 세워 둔다 */
                      return (
                        <span
                          key={c.key}
                          className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[14px] text-ink-dim"
                        >
                          <span className="flex items-center gap-2">
                            <Icon name={c.icon} size={17} />
                            {c.label}
                          </span>
                          <span className="rounded-full bg-track px-2 py-0.5 text-[11.5px]">
                            수집 중
                          </span>
                        </span>
                      );
                    return (
                      <Link
                        key={c.key}
                        href={href(c.key)}
                        className={`focus-ring flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[14px] hover:bg-bg ${
                          on ? "bg-flame-wash font-semibold text-flame-deep" : "text-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {/* 🔴 카테고리 아이콘 = 제형. 일곱 칸이 한 판에 깔리는
                              자리라 그림이 있으면 훑는 속도가 달라진다 */}
                          <Icon name={c.icon} size={17} />
                          {c.label}
                        </span>
                        <span className="text-[12px] font-normal text-ink-dim">{n}건</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 랭킹 하위 탭 줄 */
export function SubTabs({
  items,
  active,
}: {
  items: { key: string; label: string; href: string }[];
  active: string;
}) {
  /* 🔴 헤더 탭과 **같은 부품**을 쓴다 (2026-08-08 · 팀 지시 「밑에 탭에도 스침 적용」).
     `.tab` 하나가 밑줄·hover·켜짐을 다 그린다 (globals.css) — 두 줄의 탭이 같은
     동작을 해야 「탭」이라는 물건이 하나로 읽힌다.
     ⚠️ 여기만 `.tab--sub` 을 덧댄다. 글자가 14.5px 로 작고 아래 여백이 다르다. */
  return (
    <div className="rail gap-5 border-b border-line px-5">
      {items.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className="tab tab--sub focus-ring shrink-0 rounded-t text-[14.5px] font-semibold whitespace-nowrap"
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
