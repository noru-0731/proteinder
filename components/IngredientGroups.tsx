import Link from "next/link";
import Icon from "@/components/Icon";
import type { Product } from "@/lib/data";
import { topic } from "@/lib/josa";
import { groupIngredients, type GroupedItem } from "@/lib/ingredient-groups";
import { sourcesOf, type ResolvedSource } from "@/lib/source-notes";
import { peersOf, peerSummary } from "@/lib/peers";
import { healthTagsOf } from "@/lib/health-tags";
import MoreDetail from "@/components/MoreDetail";

/**
 * 원재료 — 목록과 분석이 한 몸인 통합 구획 (2026-08-06 밤 · 팀 결정).
 *
 * 🔴 **「단백질 원료」 카드를 이 안으로 합쳤다.** 전에는 카드가 코드(WPI·ISP)를
 *    분석하고 이 칸이 신고 표기를 나열해, 「단백질 원료」라는 말이 한 화면에 두 번
 *    나오면서 서로 반만 겹쳤다. 이제 칩(신고 표기·순번) 바로 아래에
 *    코드 분석(강점/단점 한 줄)이 붙는다. 제품 상세와 1:1 대조가 같이 쓴다.
 *
 * 화면 규칙:
 *   앞 숫자 = 제조사가 신고한 배합 순번. 간추리되 순번은 버리지 않는다.
 *   칩은 전부 원재료 사전(/ingredients/…)으로 이어진다.
 *   당류 칩은 빨강 — 「당류 상위 20%」 배지의 빨강과 같은 문법 (방향이지 판정이 아니다).
 */
export default function IngredientGroups({ p }: { p: Product }) {
  /* ❌ 「알 수 없는 표기」 줄은 화면에서 뺐다 (팀 결정 — "쓸모없는 정보").
     혼합제제류는 「나머지 N종 보기」 접기 안에 순번과 함께 남는다. */
  const groups = groupIngredients(p.ings).filter((g) => g.key !== "opaque");
  const shownNames = new Set(groups.flatMap((g) => g.items.map((i) => i.name)));
  const restCount = p.ings.filter((n) => !shownNames.has(n)).length;
  const claimOff = p.claim && (p.claimRank == null || p.claimRank > 1);

  const sources = sourcesOf(p.codes);
  const summary = peerSummary(peersOf(p));
  const health = healthTagsOf(p);

  if (p.ings.length === 0) {
    /* 원재료 미신고 141건 — 그래도 코드가 제품명·판매처로 확인된 것은 보여준다.
       기록이 없다는 사실과 우리가 아는 것을 섞지 않고 나란히 적는다. */
    return (
      <>
        {sources.length > 0 && (
          <div className="mb-4">
            <p className="text-[12px] font-semibold text-muted">
              단백질 원료 — 제품명·판매처로 확인
            </p>
            <SourceList sources={sources} p={p} />
          </div>
        )}
        <p className="text-[13px] leading-[20px] text-muted">
          이 제품은 공공 데이터에 원재료 기록이 없습니다. 없는 것이 아니라 우리가
          확인하지 못한 것입니다.
        </p>
      </>
    );
  }

  return (
    <>
      {/* 🔴 「못 먹을 이유」가 먼저다. 값이 좋고 나쁨보다 앞선 조건이다.
          ⚠️ 「우유가 없다」고 단정하지 않는다 — 우리가 읽은 것은 신고 원재료뿐이다 */}
      {health.map((h) => (
        <div key={h.key} className="mb-4 rounded-[10px] bg-ok-soft px-4 py-3">
          <p className="text-[13px] font-bold leading-5 text-ok">{h.label}</p>
          <p className="mt-0.5 text-[12.5px] leading-[19px] text-body">{h.why}</p>
        </div>
      ))}

      <dl className="flex flex-col gap-3">
        {groups
          .filter((g) => g.items.length > 0 || g.emptyNote)
          .map((g) => (
            <div key={g.key} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-[86px] shrink-0 pt-1 text-[12px] font-semibold text-muted">
                {g.label}
              </dt>
              <dd className="min-w-0 flex-1">
                {g.items.length > 0 ? (
                  <Chips groupKey={g.key} items={g.items} />
                ) : (
                  /* 「없음」이라고 단정하지 않는다. 신고 원재료에서 확인되지
                     않았다는 뜻이지 안 들었다는 뜻이 아니다. */
                  <p className="pt-1 text-[12.5px] text-faint">{g.emptyNote}</p>
                )}

                {/* 🔴 단백질 원료 분석 — 칩 바로 아래. 코드가 확인된 원료의
                    강점/단점 한 줄(source-notes)과 근거 배지가 여기 붙는다 */}
                {/* 🔴 접는다 (2026-08-07 · 팀 결정 2안). 위 칩(신고 표기 + 배합 순번)은
                    신고값이라 늘 펼쳐 두고, 코드별 강/단 해설은 우리가 붙인 말이라 접는다.
                    ⚠️ 원재료 미신고 141건 쪽(위 noData 분기)의 SourceList 는 안 접는다 —
                       거기서는 이게 카드의 유일한 내용이라 접으면 빈 카드가 된다. */}
                {g.key === "protein" && sources.length > 0 && (
                  <MoreDetail
                    label="원료 해설"
                    hint={`${sources.map((s) => s.label).join(" · ")}`}
                    className="mt-1.5"
                  >
                    <SourceList sources={sources} p={p} />
                    {/* 판정하지 않는다 — 「적은 편」·「많은 편」까지다 (극단 25%만) */}
                    {summary && (
                      <p className="mt-2 text-[12.5px] leading-[19px] text-body">
                        {summary}
                      </p>
                    )}
                  </MoreDetail>
                )}

                {/* 당류·감미료 큐레이션 — 배합 순위·병용 사실·법정 경고까지만 */}
                {g.curation && g.items.length > 0 && (
                  <p className="mt-1.5 break-keep text-[12.5px] leading-[19px] text-muted">
                    {g.curation}
                  </p>
                )}
              </dd>
            </div>
          ))}
      </dl>

      {/* 🔴 제품명과 배합 순서가 어긋날 때만 — 이 서비스가 보여주려는 것 그 자체다 */}
      {claimOff && p.claim && (
        <p className="mt-4 flex items-start gap-1.5 border-t border-line pt-3 text-[12.5px] leading-[19px] text-body">
          {/* 🔴 경고 아이콘 — 빨간 글자만으로는 「강조」와 「경고」가 안 갈렸다.
              ⚠️ 이 문장은 판정이 아니다. 「신고서로 확인되지 않는다」까지고,
                 아이콘도 그 뜻을 넘어서지 않는다 (원칙 5·7) */}
          <Icon name="alert-triangle" size={15} className="mt-0.5 shrink-0 text-danger" />
          <span>
          제품명이 내세운 <b className="font-semibold">{p.claim}</b>
          {topic(p.claim)}{" "}
          {p.claimRank ? (
            <>
              <b className="font-semibold text-danger">배합 {p.claimRank}순위</b>입니다.
            </>
          ) : (
            <b className="font-semibold text-danger">신고 원재료 목록에 없습니다.</b>
          )}
          </span>
        </p>
      )}

      {/* 향료·정제수·증점제·비타민 + 뭉뚱그린 표기. 접어 두되 감추지는 않는다 */}
      {restCount > 0 && (
        <details className="mt-3">
          <summary className="focus-ring cursor-pointer list-none text-[12.5px] font-semibold text-ink-sub">
            나머지 {restCount}종 보기
          </summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {p.ings
              .map((name, i) => ({ name, rank: i + 1 }))
              .filter((it) => !shownNames.has(it.name))
              .map((it) => (
                <li key={`rest-${it.rank}`}>
                  <Link
                    href={`/ingredients/${encodeURIComponent(it.name)}`}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12px] text-meta transition-colors hover:border-line-hover"
                  >
                    <span className="tabular-nums opacity-60">{it.rank}</span>
                    {it.name}
                  </Link>
                </li>
              ))}
          </ul>
        </details>
      )}
    </>
  );
}

/**
 * 원재료 칩 — 배합 순번 + 이름.
 *
 * 🔴 **연분홍을 걷어냈다** (2026-08-08 · 팀 지시 「시그니처 색 일색」).
 *    한 제품의 원재료 칸에 칩이 아홉 개까지 깔리는데 전부 연분홍 면이라
 *    이 칸 하나가 화면에서 가장 넓은 분홍 밭이었다. 그런데 **분홍이 뜻하던 것이
 *    없다** — 순번이 1이든 30이든 같은 색이었으니 색이 나른 정보가 0이다.
 *
 * 🔴 **대신 배합 1순위만 채운다.** 「신고 목록 맨 앞이 무엇인가」는 이 서비스가
 *    실제로 하는 진술이라(매거진 첫 기사가 통째로 그 이야기다) 강조할 값이 있다.
 *    hue 가 아니라 **채움 강도**로 준다 — 등급 사다리가 쓰는 문법과 같고,
 *    검정이라 분홍(누르는 것)·파랑(등급)과 축이 겹치지 않는다.
 *
 * ⚠️ 당류 칩의 빨강은 그대로다. 그건 방향을 나타내는 색이라 일이 있다.
 * ⚠️ 순번 숫자의 `opacity-60` 을 뺐다. 회색 알약 위에서는 흐린 숫자가 안 읽힌다 —
 *    「배합 순번 opacity-60 대비」는 8/6 리뷰에서 이미 지적됐던 자리다.
 */
/**
 * 🔴 **칸마다 색이 다르고, 채움은 배합 1순위에만** (2026-08-08 · 팀 지시
 *    「일괄 회색은 부적합」). 앞서 분홍을 걷어내며 세 칸을 전부 회색으로 뭉갰는데,
 *    이 칸들은 **서로 다른 것을 말한다** — 회색 하나로 덮으면 「분홍 하나가 아홉 가지를
 *    뜻하던」 문제를 색만 바꿔 반복하는 것이다.
 *
 *      단백질 원료  파랑(--grade-*)   이 제품이 무엇으로 단백질을 내는가. 서비스의 본체
 *      당류        빨강(--warn/danger) 방향 표시 — 「설탕이 들어가면 최악」(팀)
 *      감미료       회색             🔴 색을 주지 않는 것이 결론이다 (아래)
 *
 * 🔴 **감미료에 색을 주면 안 된다.** 주황을 주면 「주의」가 되고 파랑을 주면 「괜찮다」가
 *    되는데, 식약처 실측이 ADI 대비 사카린 1.41%·수크랄로스 0.18%·아스파탐 0.12% 라
 *    **어느 쪽도 우리가 할 수 있는 말이 아니다** (감미료 감점을 폐기한 그 근거다).
 *    법정 표시 문구만 칸 아래 문장으로 인용한다 — 색은 중립이 맞다.
 *
 * 🔴 **두 축을 겹치지 않게 쓴다** — hue = 어느 칸인가 · 채움 = 배합 1순위인가.
 *    1순위는 제 칸의 색을 진하게 채우고 흰 글자를 얹는다. 등급 사다리가 쓰는
 *    「채움 강도가 위계」와 같은 문법이라 새 규칙이 아니다.
 *
 * ⚠️ 대비 실측 — 파랑 채움 #5563e8 + 흰 글자 4.84:1 ✅ · 연파랑 면 #e8ecff + 글자
 *    #3f4bb8 6.14:1 ✅ · 빨강 채움 #c92a2a + 흰 글자 5.46:1 ✅.
 */
const CHIP: Record<string, { rest: string; first: string }> = {
  protein: {
    rest: "bg-grade-wash text-grade-ink hover:bg-grade-strong hover:text-white",
    first: "bg-grade-strong text-white",
  },
  sugar: {
    rest: "bg-warn text-danger-ink hover:bg-danger-strong hover:text-white",
    first: "bg-danger-strong text-white",
  },
  sweetener: {
    rest: "bg-track text-ink-sub hover:bg-line-strong hover:text-ink",
    first: "bg-ink-sub text-white",
  },
};
const CHIP_FALLBACK = CHIP.sweetener;

function Chips({ groupKey, items }: { groupKey: string; items: GroupedItem[] }) {
  const c = CHIP[groupKey] ?? CHIP_FALLBACK;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const first = it.rank === 1;
        return (
          <li key={`${groupKey}-${it.name}`}>
            <Link
              href={`/ingredients/${encodeURIComponent(it.name)}`}
              className={`focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-semibold transition-colors ${
                first ? c.first : c.rest
              }`}
              title={first ? "신고 원재료 목록의 맨 앞" : undefined}
            >
              <span className="tabular-nums">{it.rank}</span>
              {it.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 코드별 강점/단점 목록 — 옛 「단백질 원료」 카드의 본문이 이리로 왔다.
 * 🔴 서열을 만들지 않는다. 계통 순서로만 늘어놓고 서로 견주지 않는다 (source-notes 주석).
 */
function SourceList({ sources, p }: { sources: ResolvedSource[]; p: Product }) {
  return (
    <ul className="mt-2.5 flex flex-col gap-2.5">
      {sources.map((s) => (
        <li key={s.code} className="border-l-2 border-line pl-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold text-title">{s.label}</span>
            {/* 유청 세부는 신고서에 안 적힌 경우가 많아 따로 확인했다.
                무엇으로 확인했는지를 숨기지 않는다 — 근거의 등급이 곧 신뢰다 */}
            {s.whey && p.srcEvidence && p.srcEvidence !== "원재료" && (
              <span className="rounded-md bg-thumb px-1.5 py-0.5 text-[11px] font-medium text-faint">
                {p.srcEvidence === "제품명" ? "제품명 표기로 확인" : "판매처 표기로 확인"}
              </span>
            )}
            <Link
              href={`/ingredients/${encodeURIComponent(s.code)}`}
              className="focus-ring text-[11.5px] text-faint underline underline-offset-2 transition-colors hover:text-muted"
            >
              사전
            </Link>
          </div>
          <p className="mt-0.5 break-keep text-[12.5px] leading-[19px] text-muted">
            {s.what}
          </p>
          {/* 원료는 확인됐고 **정제 정도**를 모른다. 둘을 섞어 적으면 틀린 말이 된다 */}
          {!s.refined && (
            <p className="mt-0.5 text-[11.5px] leading-[17px] text-faint">
              정제 정도는 신고서에 적혀 있지 않습니다.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
