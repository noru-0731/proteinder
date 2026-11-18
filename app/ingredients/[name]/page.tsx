import Link from "next/link";
import { notFound } from "next/navigation";
import { CAUTIONS, GROUPS, entryOf, noteOf } from "@/lib/ingredient-notes";
import { SOURCE_NOTES } from "@/lib/source-notes";
import {
  OPAQUE_NAMES,
  SWEETENER_KIND_LABEL,
  legalNoteOf,
  sweetenerKindOf,
  sweetnessOf,
} from "@/lib/ingredients";
import {
  countOfName,
  productsWithCode,
  productsWithIngredient,
  rankStatsOf,
  sourceCount,
} from "@/lib/dictionary";
import { products } from "@/lib/products";
import { Note, RankGrid } from "@/components/Bits";

/**
 * 원재료 사전 상세.
 *
 * 🔴 두 갈래를 받는다.
 *    ① 신고 표기 (「수크랄로스」·「두류가공품」) — 원재료 칩이 들어오는 곳
 *    ② 원료 분류 코드 (「WPI」·「ISP」)         — 단백질 원료 칸이 들어오는 곳
 *    ②가 없으면 제품 상세의 원료 이름이 사전으로 이어지지 못한다.
 *
 * 🔴 단맛 배수는 식약처 표에 있는 4종만 적는다. 경고 문구는 법정 표시 인용뿐이고,
 *    경고가 없는 원료에는 아무것도 적지 않는다 — 지어 붙이면 그게 판정이 된다.
 */

const MAX_LIST = 12;

export function generateStaticParams() {
  const names = new Set<string>();
  for (const p of products) for (const n of p.ings) names.add(n);
  for (const g of GROUPS) for (const e of g.entries) for (const n of e.names) names.add(n);
  for (const code of Object.keys(SOURCE_NOTES)) names.add(code);
  /* ⚠️ 이름에 「/」가 든 표기는 경로 구분자와 부딪혀 정적 목록에서 뺀다.
     dynamicParams 기본값이 true 라 링크는 그대로 동작한다. */
  return [...names].filter((n) => !n.includes("/")).map((name) => ({ name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  return { title: `${name} — 원재료 사전 · 프로틴더` };
}

export default async function IngredientDetail({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const name = decodeURIComponent((await params).name);

  const code = SOURCE_NOTES[name] ? name : null;
  const note = noteOf(name);
  const found = entryOf(name);
  const stats = rankStatsOf(name);

  /* 코드도 아니고 해설도 없고 이 데이터에 나오지도 않으면 사전에 없는 이름이다 */
  if (!code && !note && !stats) notFound();

  const used = code ? productsWithCode(code) : productsWithIngredient(name);
  const kind = sweetenerKindOf(name);
  const legal = legalNoteOf(name);
  const times = sweetnessOf(name);
  const opaque = OPAQUE_NAMES.has(name);

  /* 같은 원료의 다른 표기 — 「알룰로스」와 「알룰로오스」를 서로 잇는다 */
  const variants = (found?.entry.names ?? []).filter((n) => n !== name && countOfName(n) > 0);

  return (
    <>
      <div className="px-5 pt-6 pb-2">
        <nav className="mb-2 text-[12px] text-ink-dim">
          <Link href="/ingredients" className="focus-ring rounded hover:text-ink-sub">
            원재료 사전
          </Link>
          {found && <> › {found.group.title}</>}
          {code && <> › 원료 분류</>}
        </nav>

        <h1 className="kr text-[22px] leading-[1.3] font-semibold text-ink">
          {code ? SOURCE_NOTES[code].label : name}
        </h1>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-dim">
          {code ? (
            <span>코드가 확인된 제품 {sourceCount(code)}건</span>
          ) : (
            <span>이 이름으로 신고된 제품 {countOfName(name)}건</span>
          )}
          {kind && (
            <span className="rounded-full bg-flame-wash px-2 py-0.5 text-[11.5px] font-semibold text-flame-deep">
              {SWEETENER_KIND_LABEL[kind]}
            </span>
          )}
          {times && (
            <span className="rounded-full bg-track px-2 py-0.5 text-[11.5px] text-ink-sub">
              설탕의 {times}
            </span>
          )}
        </p>
      </div>

      {/* ── 무엇인가 ── */}
      <div className="px-5 pb-2">
        <p className="kr max-w-[720px] text-[14px] leading-[1.75] text-ink">
          {code ? SOURCE_NOTES[code].what : (note?.what ?? "아직 해설을 적지 못한 원재료입니다.")}
        </p>
        {note?.why && (
          <p className="kr mt-2 max-w-[720px] text-[13px] leading-[1.7] text-ink-sub">{note.why}</p>
        )}
        {code && !SOURCE_NOTES[code].refined && (
          <p className="kr mt-2 max-w-[720px] text-[13px] leading-[1.7] text-ink-sub">
            정제 정도는 신고서에 적혀 있지 않습니다 — 분리인지 농축인지 우리는 모릅니다.
          </p>
        )}
        {opaque && (
          <p className="kr mt-2 max-w-[720px] text-[13px] leading-[1.7] text-ink-sub">
            안에 무엇이 들었는지 이 이름만으로는 알 수 없는 표기입니다. 제품 상세에서도
            「알 수 없는 표기」로 셉니다 — 나쁘다는 뜻이 아니라 우리가 읽지 못한다는 뜻입니다.
          </p>
        )}
      </div>

      {/* ── 주의 · 법정 표시 ── */}
      {(note?.caution || legal) && (
        <div className="mx-5 mt-2 rounded-[10px] bg-bg px-4 py-3.5">
          {note?.caution && (
            <p className="kr text-[13px] leading-[1.7] text-ink-sub">
              <b className="font-semibold text-ink">{CAUTIONS[note.caution].label}</b>{" "}
              {CAUTIONS[note.caution].tip}
            </p>
          )}
          {legal && (
            <p className="kr mt-1.5 text-[13px] leading-[1.7] text-ink-sub">
              <b className="font-semibold text-ink">표시 의무</b> {legal}
            </p>
          )}
        </div>
      )}

      {/* ── 다른 표기 ── */}
      {variants.length > 0 && (
        <div className="px-5 pt-4">
          <p className="text-[12px] text-ink-dim">같은 원료의 다른 신고 표기</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <Link
                key={v}
                href={`/ingredients/${encodeURIComponent(v)}`}
                className="focus-ring rounded-full border border-line-strong px-3 py-1 text-[12.5px] text-ink-sub hover:bg-bg"
              >
                {v} {countOfName(v)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 배합 순번 ──
          🔴 함량이 아니다. 신고서에 함량 비율은 없다 */}
      {stats && !code && (
        <div className="px-5 pt-6">
          <h2 className="text-[15.5px] font-semibold text-ink">배합 순서에서의 자리</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Stat value={stats.first} unit="건" label="배합 1순위로 신고됨" />
            <Stat value={stats.median} unit="번째" label="배합 순서 중앙값" />
            <Stat value={stats.n} unit="건" label="이 이름이 든 제품" />
          </div>
          <p className="kr mt-2 max-w-[720px] text-[12px] leading-[1.7] text-ink-dim">
            신고 원재료는 배합 비율이 높은 순으로 적습니다. 몇 번째에 적혔는지는 알 수 있지만
            얼마나 들었는지는 공개되지 않습니다.
          </p>
        </div>
      )}

      {/* ── 이 원료가 든 제품 ── */}
      {used.length > 0 && (
        <>
          <div className="px-5 pt-7 pb-1">
            <h2 className="text-[15.5px] font-semibold text-ink">
              {code ? "이 분류로 확인된 제품" : "이 원재료가 든 제품"}
            </h2>
          </div>
          <Note>
            {code
              ? "제품명이나 판매처에서 확인한 것도 함께 셉니다. 노출이 많은 쪽부터입니다."
              : "배합 순서가 앞선 제품부터 보여줍니다."}{" "}
            {used.length > MAX_LIST && `전체 ${used.length}건 중 ${MAX_LIST}건입니다.`}
          </Note>
          <RankGrid items={used.slice(0, MAX_LIST)} plain />
        </>
      )}

      <div className="px-5 pt-8 pb-9">
        <Link
          href="/ingredients"
          className="focus-ring inline-block rounded text-[13px] font-semibold text-flame-deep"
        >
          ← 원재료 사전
        </Link>
      </div>
    </>
  );
}

function Stat({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    <span className="rounded-[8px] border border-line px-4 py-2.5">
      <span className="block text-[17px] font-semibold text-ink tabular-nums">
        {value}
        <span className="ml-0.5 text-[12px] font-normal text-ink-dim">{unit}</span>
      </span>
      <span className="mt-0.5 block text-[11.5px] text-ink-dim">{label}</span>
    </span>
  );
}
