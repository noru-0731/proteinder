import Link from "next/link";
import { CAUTIONS, GROUPS, type Entry } from "@/lib/ingredient-notes";
import { SOURCE_NOTES } from "@/lib/source-notes";
import { countOfName, ingredientCounts, ingredientTotal, sourceCount } from "@/lib/dictionary";
import { products } from "@/lib/products";

/**
 * 원재료 사전 — **ver1(app/) 화면을 그대로 옮겨 왔다** (2026-08-08 · 팀 지시).
 *
 * app3 에도 사전이 있었지만 절 제목과 표뿐이라 훑을 손잡이가 없었다. ver1 이 갖고
 * 있던 세 가지가 실질이다:
 *
 *   ① 절 바로가기 칩       절이 일곱이라 위에서 바로 건너뛸 수 있어야 한다
 *   ② 주의 배지 범례       배지를 보고 나서 무슨 뜻인지 찾아 올라오게 두지 않는다
 *   ③ 절 번호 + 종수       「1 원료 분류 15종」 — 이 사전이 얼마나 큰지가 먼저 보인다
 *
 * 🔴 **색·글자 크기는 app3 것으로 갈아 끼웠다.** ver1 은 `hub-*` 토큰(파랑 계열)과
 *    1248px 컨테이너를 쓰는데 app3 는 불꽃 팔레트에 1200px 셸이다. 마크업을 통째로
 *    베끼면 이 앱에서 혼자 다른 화면이 된다 — 구조를 옮기고 표기는 이 앱 것을 쓴다.
 * 🔴 **표기 절보다 「원료 분류」가 먼저 온다.** 제품 상세의 원료 카드에서 들어오는
 *    사람이 가장 많고, 정제 정도라는 상위 개념이 낱개 표기보다 앞선다.
 *
 * ⚠️ 건수 0인 항목은 그리지 않는다. 이 데이터에 없는 원료를 설명할 이유가 없다.
 * ⚠️ 건수는 표기 변형(`names`)을 전부 합산한다 — 「알룰로스」와 「알룰로오스」가
 *    따로 세어져 같은 원료가 두 줄로 쪼개지던 자리다.
 * ⚠️ `prefetch={false}` — 이 쪽의 링크가 700개 가까워 전부 미리 당기면 각 상세에
 *    딸린 제품 사진까지 preload 되어 경고가 수십 건 뜬다. 여기는 훑는 화면이다.
 */

export const metadata = { title: "원재료 사전 — 프로틴더" };

const countOfEntry = (e: Entry) => e.names.reduce((s, n) => s + countOfName(n), 0);

const SECTIONS = GROUPS.map((g) => ({
  ...g,
  rows: g.entries
    .map((e) => ({ entry: e, count: countOfEntry(e) }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count),
})).filter((g) => g.rows.length > 0);

const EXPLAINED = SECTIONS.reduce((s, g) => s + g.rows.length, 0);
const COVERED = SECTIONS.reduce((s, g) => s + g.rows.reduce((t, r) => t + r.count, 0), 0);
const ALL_MENTIONS = ingredientCounts.reduce((s, r) => s + r.count, 0);

/** 코드 절 — 신고 **표기**가 아니라 원료 **분류**다 */
const CODES = Object.entries(SOURCE_NOTES)
  .map(([code, note]) => ({ code, note, count: sourceCount(code) }))
  .filter((r) => r.count > 0)
  .sort((a, b) => b.count - a.count);

const CAUTION_KEYS = Object.keys(CAUTIONS) as (keyof typeof CAUTIONS)[];

export default function Dictionary() {
  return (
    <div className="px-5 pt-7 pb-12">
      <p className="text-[12px] font-bold tracking-[0.1em] text-flame-deep">INGREDIENT GUIDE</p>
      <h1 className="kr mt-1.5 text-[26px] leading-[1.28] font-bold text-ink">원재료 사전</h1>
      <p className="kr mt-3 max-w-[720px] text-[13.5px] leading-[1.7] text-ink-sub">
        단백질 제품 {products.length.toLocaleString()}개의 성분표에서 원재료{" "}
        {ingredientTotal.toLocaleString()}종을 확인했습니다. 이 가운데 자주 쓰이거나 이름만으로
        역할을 알기 어려운 {EXPLAINED}종을 골라, 무엇이며 제품에 왜 들어가는지 적었습니다.
        등장 횟수로 세면 전체 {ALL_MENTIONS.toLocaleString()}회 중{" "}
        {Math.round((COVERED / ALL_MENTIONS) * 100)}%입니다.
      </p>
      <p className="kr mt-2 max-w-[720px] text-[12.5px] leading-[1.65] text-ink-dim">
        특정 원재료의 효능이나 안전성에 대한 평가는 하지 않습니다.
      </p>

      {/* ① 절 바로가기 — 앵커라 JS 가 없다 */}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="원재료 묶음 바로가기">
        <SkipChip href="#codes" label="원료 분류" n={CODES.length} />
        {SECTIONS.map((g) => (
          <SkipChip key={g.key} href={`#${g.key}`} label={g.title} n={g.rows.length} />
        ))}
      </nav>

      {/* ② 주의 배지 범례 — 목록보다 **먼저** 무슨 뜻인지 알려 준다 */}
      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 rounded-xl bg-warn px-4 py-3">
        {CAUTION_KEYS.map((k) => (
          <p key={k} className="kr text-[12.5px] leading-6 text-ink-sub">
            <CautionBadge k={k} />
            <span className="ml-2">{CAUTIONS[k].tip}</span>
          </p>
        ))}
      </div>

      {/* ③ 원료 분류 */}
      <Section id="codes" no={1} title="원료 분류" n={CODES.length}>
        <p className="kr mt-1.5 max-w-[720px] text-[13px] leading-[1.7] text-ink-dim">
          신고 표기가 아니라 단백질 원료의 분류입니다. 건수는 이 분류가 확인된 제품 수이며,
          신고서 표기 외에 제품명·판매처로 확인한 것도 셉니다.
        </p>
        <Rows>
          {CODES.map(({ code, note, count }) => (
            <Row
              key={code}
              href={`/ingredients/${encodeURIComponent(code)}`}
              title={note.label}
              what={note.what}
              count={count}
            />
          ))}
        </Rows>
      </Section>

      {SECTIONS.map((g, gi) => (
        <Section key={g.key} id={g.key} no={gi + 2} title={g.title} n={g.rows.length}>
          <p className="kr mt-1.5 max-w-[720px] text-[13px] leading-[1.7] text-ink-dim">{g.lead}</p>
          <Rows>
            {g.rows.map(({ entry, count }) => (
              <Row
                key={entry.title}
                href={`/ingredients/${encodeURIComponent(entry.names[0])}`}
                title={entry.title}
                what={entry.what}
                count={count}
                caution={entry.caution}
                /* 표기 변형은 작게 덧붙인다 — 성분표에서 실제로 마주칠 이름이 이것들이다 */
                aka={entry.names.length > 1 ? entry.names.join(" · ") : undefined}
              />
            ))}
          </Rows>
        </Section>
      ))}

      <p className="kr mt-12 max-w-[720px] text-[12px] leading-[1.7] text-ink-dim">
        건수는 이 데이터에 그 이름이 신고된 제품 수입니다. 함량이 아니라 배합 순서만
        공개되므로, 많이 나온다고 많이 들었다는 뜻이 아닙니다. 해설이 없는 원재료는 제품
        상세의 원재료 목록에서 신고된 이름 그대로 볼 수 있습니다.
      </p>
    </div>
  );
}

/* ── 조각들 ───────────────────────────────────────────────── */

function SkipChip({ href, label, n }: { href: string; label: string; n: number }) {
  return (
    <a
      href={href}
      className="focus-ring rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-semibold text-ink-sub transition-colors hover:border-flame hover:text-flame-deep"
    >
      {label}
      <span className="ml-1.5 text-[12px] font-normal text-ink-dim tabular-nums">{n}</span>
    </a>
  );
}

function Section({
  id,
  no,
  title,
  n,
  children,
}: {
  id: string;
  no: number;
  title: string;
  n: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <div className="flex items-baseline gap-2.5">
        <span className="text-[14px] font-bold text-flame tabular-nums">{no}</span>
        <h2 className="kr text-[20px] leading-[1.35] font-bold text-ink">{title}</h2>
        <span className="text-[12.5px] text-ink-dim tabular-nums">{n}종</span>
      </div>
      {children}
    </section>
  );
}

function Rows({ children }: { children: React.ReactNode }) {
  return <ul className="mt-4 border-y border-line">{children}</ul>;
}

function Row({
  href,
  title,
  what,
  count,
  caution,
  aka,
}: {
  href: string;
  title: string;
  what: string;
  count: number;
  caution?: keyof typeof CAUTIONS;
  aka?: string;
}) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        prefetch={false}
        href={href}
        className="focus-ring group flex flex-col gap-1 rounded px-1 py-3.5 transition-colors hover:bg-bg sm:flex-row sm:items-baseline sm:gap-5"
      >
        <span className="flex shrink-0 items-center gap-2 sm:w-[212px]">
          <span className="kr text-[14.5px] font-semibold text-ink group-hover:text-flame-deep">
            {title}
          </span>
          {caution && <CautionBadge k={caution} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="kr block text-[13px] leading-[1.68] text-ink-sub">{what}</span>
          {aka && (
            <span className="kr mt-0.5 block text-[11.5px] leading-[1.55] text-ink-dim">
              성분표 표기 · {aka}
            </span>
          )}
        </span>
        <span className="shrink-0 text-[12px] text-ink-dim tabular-nums sm:w-[76px] sm:text-right">
          {count}개 제품
        </span>
      </Link>
    </li>
  );
}

/**
 * 주의 배지. `title` 로 네이티브 툴팁을, CSS 로 보이는 툴팁을 함께 준다 —
 * JS 없이 hover·focus 둘 다에서 뜬다.
 * ⚠️ 배지가 링크 **안에** 있어 `tabIndex`를 주면 탭 순서가 두 번 걸린다. ver1 은
 *    줬는데, 줄 전체가 링크인 이 구조에서는 툴팁이 링크 포커스로도 뜨므로 뺀다.
 */
function CautionBadge({ k }: { k: keyof typeof CAUTIONS }) {
  const c = CAUTIONS[k];
  return (
    <span className="relative inline-flex align-middle">
      <span
        role="note"
        aria-label={c.tip}
        title={c.tip}
        className="peer inline-flex cursor-help items-center gap-1 rounded-full border border-red/35 bg-warn px-2 py-0.5 text-[11px] font-bold text-red"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
          <path
            d="M8 2.5 15 14H1L8 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 6.6v3.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.7" r="0.75" fill="currentColor" />
        </svg>
        {c.label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-0 z-20 mt-1.5 hidden w-max max-w-[260px] rounded-lg bg-ink px-2.5 py-1.5 text-[12px] leading-[19px] font-medium text-white shadow-lg peer-hover:block peer-focus:block"
      >
        {c.tip}
      </span>
    </span>
  );
}
