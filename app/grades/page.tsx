import Link from "next/link";
import type { Metadata } from "next";
import { products, OPAQUE_NAMES, CATEGORIES, catLabel } from "@/lib/data";
import { AXES, EDGE_PCT, edgeCounts } from "@/lib/grades";
import { DISCLOSURE_CUTS, MIN_INGREDIENTS, disclosureCounts } from "@/lib/disclosure";
import { NUT_AXES, gradeCuts, GRADES } from "@/lib/nutrition-grades";

export const metadata: Metadata = {
  title: "등급 기준 — 프로틴더",
  description:
    "단백질·당류·원료 공개 세 축의 등급 기준. 제품의 품질·효능 등급이 아니라 수록 제품 분포에서의 위치입니다.",
};

/**
 * 🔴 **이 페이지가 배지의 안전장치다.** 배지만 있고 기준이 없으면 우리가 매긴 등급이
 *    사실처럼 읽힌다 — 화해가 EWG 등급으로 맞은 자리다. 컷·건수·한계를 전부 여기에 적는다.
 *    **이 페이지를 지우면 배지도 지워야 한다.**
 */
export default function GradesPage() {
  const dc = disclosureCounts(products);
  const freq = new Map<string, number>();
  for (const p of products)
    for (const n of p.ings) if (OPAQUE_NAMES.has(n)) freq.set(n, (freq.get(n) ?? 0) + 1);
  const listed = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 lg:px-8 lg:py-14">
      <h1 className="text-[26px] font-bold leading-[34px] text-title">등급 기준</h1>
      <p className="mt-3 text-[15px] leading-[24px] text-body">
        제품 카드에 붙는 배지가 무엇을 재는지 전부 적습니다.
        컷을 정한 것도, 어느 축을 볼지 고른 것도 우리입니다.
      </p>

      <div className="mt-5 rounded-[12px] bg-warn px-5 py-4 text-[13px] leading-[21px] text-body">
        <p>
          <b className="font-bold text-danger">품질·효능 등급이 아닙니다.</b> 맛도, 효과도,
          안전성도 재지 않습니다. <b className="font-semibold">수록 제품 분포에서 어디쯤인가</b>
          까지가 우리 진술의 전부입니다.
        </p>
        <p className="mt-2">
          <b className="font-bold text-danger">배지보다 숫자가 본체입니다.</b> 제품 카드에서
          배지 바로 윗줄에 「단백질 20g · 150kcal · 당류 3g」이 늘 함께 뜹니다. 배지는 위치를
          요약한 말이고, 실제 값은 제조사 신고값 그대로입니다.
        </p>
        <p className="mt-2">
          <b className="font-bold text-danger">색은 우리가 붙인 것입니다.</b> 파랑은 흔히 반기는
          쪽, 빨강은 꺼리는 쪽으로 칠합니다. 다만 <b className="font-semibold">바뀐 것은 색뿐이고
          문구는 그대로 위치 진술</b>입니다 — 「당류 상위 20%」는 당류가 많은 쪽 20%에 든다는
          사실이지, 그게 몸에 나쁘다는 우리 판정이 아닙니다.
        </p>
      </div>

      {/* ── 성분 밸런스 A~D 구간표 (2026-08-07 신설 · 헤더 탭이 여기로 온다) ── */}
      <h2 id="cuts" className="mt-9 scroll-mt-6 text-[19px] font-bold leading-[27px] text-title">
        성분 밸런스 A~D 구간표
      </h2>
      <p className="mt-1.5 text-[13px] leading-5 text-muted">
        제품 상세 오각형의 등급이 갈리는 <b className="font-semibold">실측 경계</b>입니다.
        기준은 1회 섭취 — 프로틴 음료는 1병, 프로틴 파우더는 1스쿱 30g. 경계값은 우리가
        고른 숫자가 아니라 수록 제품 분포의{" "}
        <b className="font-semibold">상위 20% · 50% · 80%</b> 지점이고, 수록이 바뀌면
        저절로 다시 계산됩니다 (A 20% · B 30% · C 30% · D 20%). A는 흔히 반기는
        쪽(단백질은 많은 쪽, 나머지는 적은 쪽)입니다.
      </p>

      {CATEGORIES.map((cat) => (
        <CutTable key={cat} cat={cat} />
      ))}

      <p className="mt-3 rounded-lg border-l-[3px] border-brand bg-thumb px-3.5 py-3 text-[13px] leading-[21px] text-body">
        <b className="font-bold text-brand-ink">축을 합치지 않습니다</b> — 다섯 축을 하나로
        평균한 「종합 등급」이 있었는데 <b className="font-semibold">폐기했습니다</b>{" "}
        (2026-08-07). 계산이 틀려서가 아니라, 축을 합치는 순간 우리가 「무엇이 좋은
        제품인가」를 정하게 되기 때문입니다. 실제로 합친 값은 단백질이 아니라
        <b className="font-semibold">당류가 적은 제품</b>을 위로 올렸습니다 — 최고 등급
        97건 가운데 당류 축도 최고인 것이 67%인데 단백질 축이 최고인 것은 43%뿐이었고,
        11%는 단백질 축이 C·D였습니다. 용량과의 상관도 +0.39라 200ml 이하 62건에서는
        최고 등급이 <b className="font-semibold">한 건도 나올 수 없었습니다</b>.
        지금은 축별 등급만 보여드립니다.
      </p>
      <p className="mt-2 text-[13px] leading-5 text-muted">
        ⚠️ 파우더의 칼로리 축은 폭이 좁습니다. 단백질이 그 자체로 4kcal/g이라 순도가
        높을수록 칼로리도 오르기 때문이며, 등급이 낮다고 이상한 제품이 아닙니다.
        동점은 같은 등급을 받습니다 — 당류 0인 제품은 전부 A입니다.
      </p>
      <p className="mt-2 text-[13px] leading-5 text-muted">
        ⚠️ <b className="font-semibold text-body">이 등급은 「단백질을 우선하고 당·열량
        부담을 줄이려는 선택」 기준입니다.</b> 증량·식사대용처럼 열량과 탄수를 채우려는
        목적이라면 칼로리·탄수화물 축은 거꾸로 읽어야 합니다 — 방향은 관습이지 우리가
        잰 값이 아닙니다.
      </p>
      <p className="mt-2 text-[13px] leading-5 text-muted">
        ⚠️ 기준이 1병이므로 <b className="font-semibold text-body">병 크기가 값에
        들어갑니다.</b> 병이 크면 단백질도 열량·당류도 함께 커집니다 — 병째 마신다는
        전제이며, 190ml 안팎의 소용량 제품은 단백질 축이 구조적으로 불리합니다.
      </p>

      {/* ── 축 1·2·3 : 신고 영양성분의 극단 ───────────────────── */}
      <h2 className="mt-9 text-[19px] font-bold leading-[27px] text-title">
        단백질 · 당류 · 칼로리 · 단백질 비중
      </h2>
      <p className="mt-1.5 text-[13px] leading-5 text-muted">
        같은 카테고리 안에서 <b className="font-semibold">값이 큰 쪽 {EDGE_PCT}%</b> 또는{" "}
        <b className="font-semibold">작은 쪽 {EDGE_PCT}%</b>를 경계로 잡습니다.
        이 경계는 검색의 <b className="font-semibold">영양 필터</b>와 상세의{" "}
        <b className="font-semibold">한 줄 요약</b>(「~쪽입니다」)이 씁니다. 가운데{" "}
        {100 - EDGE_PCT * 2}%는 어느 쪽도 아닙니다 — 「단백질 상위 47%」는 정보가 아니라
        소음입니다.
      </p>
      <p className="mt-2 rounded-[10px] bg-warn px-4 py-3 text-[12.5px] leading-[19px] text-body">
        🔴 <b className="font-semibold text-danger">「상위」는 값이 큰 쪽이라는 뜻일 뿐입니다.</b>{" "}
        「단백질 상위 {EDGE_PCT}%」는 단백질이 많다는 말입니다. 화면이 쓰는 파랑·빨강도{" "}
        <b className="font-semibold">
          흔히 그렇게 여긴다는 관습이지 우리가 잰 값이 아닙니다.
        </b>{" "}
        단백질을 줄이려는 사람에게는 반대로 읽힐 수 있습니다.
      </p>
      <p className="mt-2 text-[13px] leading-5 text-muted">
        <b className="font-semibold text-body">단백질 비중</b>은 신고 열량 가운데 단백질이
        차지하는 몫입니다 (단백질 g × 4kcal ÷ 열량). 「1병에 몇 g 인가」와 달리{" "}
        <b className="font-semibold text-body">이 음료가 무엇으로 채워져 있는가</b>를 잽니다 —
        RTD 271건에서 두 축이 겹치는 제품은 19건뿐입니다. 🔴{" "}
        <b className="font-semibold text-body">파우더에는 붙이지 않습니다.</b> 1회분이 30g 고정이라
        비중이 순도의 상수배가 되어, 파우더에서는 「단백질 상위 {EDGE_PCT}%」 78건 중 72건이
        그대로 겹쳤습니다. 갈리지 않는 것으로 배지를 만들지 않습니다.
      </p>
      <div className="card mt-3 overflow-hidden rounded-2xl">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-[12.5px] text-muted">
              <th className="px-4 py-2.5 text-left font-semibold">카테고리 · 축</th>
              <th className="px-3 py-2.5 text-right font-semibold">상위 {EDGE_PCT}%</th>
              <th className="px-3 py-2.5 text-right font-semibold">하위 {EDGE_PCT}%</th>
              <th className="px-3 py-2.5 text-right font-semibold">모수</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.flatMap((cat) =>
              Object.entries(AXES).map(([key, axis]) => {
                // 당류는 이 표에 안 넣는다 — 아래 「당류 3단계」 절이 따로 맡는다.
                // 남겨 두면 edgesOf 가 당류를 건너뛰므로 0/0 행이 나온다.
                if (key === "sugar") return null;
                if (axis.only && cat !== axis.only) return null;
                const c = edgeCounts(cat, key);
                if (!c.n) return null;
                const name = axis.name;
                return (
                  <tr key={`${cat}-${key}`} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-body">
                      {cat} · {name}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{c.high}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{c.low}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-faint">{c.n}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[12.5px] leading-[19px] text-muted">
        <li>
          🔴 <b className="font-semibold text-body">카테고리를 섞지 않습니다.</b> 파우더 1회분 30g
          과 RTD 1병은 단위부터 달라 같은 자로 잴 수 없습니다.
        </li>
        <li>
          <b className="font-semibold text-body">칼로리는 RTD 에만 붙입니다.</b> 파우더 1회분 30g
          의 열량은 제품이 아니라 가루의 무게가 정합니다 — 중앙 113kcal 에 88%가 120 이하라
          갈리지 않습니다. 나트륨도 같은 이유로 축에서 뺐습니다.
        </li>
        <li>
          🔴 <b className="font-semibold text-body">당류는 백분위를 쓰지 않습니다.</b> 적은 쪽은 0g
          에 동점이 몰려 있어 상·하위 5%·10%·20% 컷이 <b className="font-semibold">전부 0.0</b> 이
          됩니다. 「하위 {EDGE_PCT}%」라고 적으면 실제로는 RTD 29%·파우더 11%에 붙어 문구가
          사실과 어긋납니다. 그래서 아래 3단계로 따로 잽니다.
        </li>
      </ul>

      {/* ── 당류 ───────────────────────────────────────────────── */}
      <h2 className="mt-9 text-[19px] font-bold leading-[27px] text-title">당류</h2>
      <p className="mt-1.5 text-[13px] leading-5 text-muted">
        당류만 다른 축과 다르게 잽니다. 적은 쪽에{" "}
        <b className="font-semibold">0g 이 동점으로 몰려 있어</b> 백분위가 성립하지 않기 때문에,{" "}
        <b className="font-semibold">0g 이라는 사실</b>과{" "}
        <b className="font-semibold">많은 쪽 상위 {EDGE_PCT}%</b> 둘만 적습니다.
      </p>
      <div className="card mt-3 overflow-x-auto rounded-xl">
        <table className="w-full text-[13px]">
          <thead className="bg-thumb text-left text-[12.5px] text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">배지</th>
              <th className="px-3 py-2 font-semibold">기준</th>
              <th className="px-3 py-2 font-semibold">건수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="px-3 py-2 font-semibold text-brand-ink">당류 0g</td>
              <td className="px-3 py-2 text-muted">신고값이 0g</td>
              <td className="px-3 py-2 tabular-nums text-muted">90</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-faint">(배지 없음)</td>
              <td className="px-3 py-2 text-muted">그 사이</td>
              <td className="px-3 py-2 tabular-nums text-muted">306</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-semibold text-danger">당류 많음</td>
              <td className="px-3 py-2 text-muted">
                상위 {EDGE_PCT}% — 프로틴 음료 1병 7.0g↑ · 파우더 1회분 3.5g↑
              </td>
              <td className="px-3 py-2 tabular-nums text-muted">100</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[12.5px] leading-[19px] text-muted">
        <li>
          <b className="font-semibold text-body">가운데 306건에는 배지를 붙이지 않습니다.</b> 카드에
          「당류 4g」이 이미 적혀 있어 배지를 하나 더 달아도 새로 알려주는 것이 없습니다.
        </li>
        <li>
          <b className="font-semibold text-body">전부 1회 섭취량 기준입니다.</b> 프로틴 음료는 1병,
          파우더는 1회분 30g — 카드 영양 줄과 같은 기준이라 어긋나지 않습니다.
        </li>
      </ul>

      {/* ── 축 3 : 원료 공개 ─────────────────────────────────── */}
      <h2 className="mt-9 text-[19px] font-bold leading-[27px] text-title">원료 공개</h2>
      <p className="mt-1.5 text-[13px] leading-5 text-muted">
        신고된 원재료 가운데 <b className="font-semibold">이름만으로 내용을 알 수 없는 표기</b>가
        몇 종인지를 셉니다. 수록 {dc.total}건 중 {dc.graded}건에서 셀 수 있었습니다.
        🔴 여기는 <b className="font-semibold">상·하위로 적지 않습니다.</b> 백분위가 아니라
        「몇 종인가」라는 절대 사실이라, 카드에는{" "}
        <b className="font-semibold">「원료 전부 공개」 · 「원료 4종 불명」</b>처럼 그대로 적습니다.
      </p>
      <div className="card mt-3 overflow-hidden rounded-2xl">
        <table className="w-full text-[13.5px]">
          <tbody>
            {DISCLOSURE_CUTS.map((cut) => {
              const n = dc.byGrade.get(cut.grade) ?? 0;
              return (
                <tr key={cut.grade} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-body">{cut.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                    {n}건 ({Math.round((n / dc.graded) * 100)}%)
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-[12px] bg-warn px-5 py-4 text-[13px] leading-[21px] text-body">
        <p>
          <b className="font-bold text-danger">공개도가 낮다고 회사가 숨긴 것이 아닙니다.</b>{" "}
          완제품 회사가 다른 업체에서 사 온 반제품을 「두류가공품」 한 줄로 신고하면, 그 안에
          무엇이 들었는지는 신고 의무 밖이라 목록에 드러나지 않습니다.{" "}
          <b className="font-semibold">위탁생산 구조에서 저절로 생기는 표기</b>입니다.
        </p>
      </div>

      <h3 className="mt-6 text-[15px] font-bold leading-[23px] text-title">
        세지 않는 경우
      </h3>
      <dl className="mt-2.5 flex flex-col gap-3 text-[13.5px] leading-[21px]">
        <div className="card rounded-2xl px-5 py-4">
          <dt className="font-semibold text-title">원재료 신고 자료가 없음 — {dc.미신고}건</dt>
          <dd className="mt-1 text-muted">
            공공 데이터에 원재료 기록이 없는 제품입니다.{" "}
            <b className="font-semibold text-body">「0%」가 아니라 「모름」입니다.</b> 모르는 것을
            좋은 쪽으로도 나쁜 쪽으로도 적지 않습니다.
          </dd>
        </div>
        <div className="card rounded-2xl px-5 py-4">
          <dt className="font-semibold text-title">표기가 너무 적음 — {dc.표기부족}건</dt>
          <dd className="mt-1 text-muted">
            신고된 원재료가 {MIN_INGREDIENTS}종 미만이면 「몇 종 불명」이 제품을 대표하지 못합니다. 원재료가{" "}
            <b className="font-semibold text-body">1종뿐인데 그것이 알 수 없는 표기</b>면 100%가
            되는데, 이건 가린 것이 아니라 적게 적힌 것입니다.
          </dd>
        </div>
      </dl>

      <h3 className="mt-6 text-[15px] font-bold leading-[23px] text-title">
        「알 수 없는 표기」로 센 것 — {listed.length}가지
      </h3>
      <p className="mt-1.5 text-[13px] leading-5 text-muted">
        무엇을 셌는지 전부 공개합니다. 옆의 숫자는 수록 제품 전체에서 등장한 횟수입니다.
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {listed.map(([name, n]) => (
          <li key={name}>
            <Link
              href={`/ingredients/${encodeURIComponent(name)}`}
              className="focus-ring inline-flex items-center gap-1.5 rounded-md bg-warn px-2.5 py-1 text-[12.5px] font-semibold text-danger transition-opacity hover:opacity-80"
            >
              {name}
              <span className="font-medium tabular-nums opacity-60">{n}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-9 text-[19px] font-bold leading-[27px] text-title">한계</h2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[13.5px] leading-[21px] text-body">
        <li>
          <b className="font-semibold">구간을 정한 것은 우리입니다.</b> 상·하위 {EDGE_PCT}% 라는
          선에도, 파랑·빨강이라는 색에도 공인된 근거가 없습니다. 그래서 배지 바로 윗줄에
          늘 신고값 그대로를 함께 적습니다.
        </li>
        <li>
          <b className="font-semibold">원료 공개는 가짓수를 세지 무게를 세지 않습니다.</b>{" "}
          「두류가공품」이 1순위인 제품과 20순위인 제품이 같은 1종으로 셉니다. 배합비는
          신고되지 않습니다.
        </li>
        <li>
          <b className="font-semibold">목록에 없는 표기는 못 셉니다.</b> 위 {listed.length}가지는
          우리가 눈으로 골라 넣은 것이라, 빠진 표기가 있으면 그 제품은 실제보다 높은 등급을
          받습니다.
        </li>
        <li>
          <b className="font-semibold">신고값이 틀린 것은 우리도 모릅니다.</b> 앞뒤가 안 맞는
          레코드는 비교에서 빼되, 어느 쪽 숫자가 틀렸는지는 판정하지 않습니다.
        </li>
      </ul>

      <p className="mt-9 text-[12.5px] leading-5 text-faint">
        기준 시점 2026-08-06 · 수록 {dc.total}건 · 영양성분 식품의약품안전처 가공식품
        영양성분 · 원재료 식품안전나라 품목제조보고(C002)
      </p>
      <Link
        href="/products"
        className="focus-ring mt-4 inline-block text-[13.5px] font-semibold text-brand-ink underline underline-offset-2"
      >
        제품 목록으로 →
      </Link>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   성분 밸런스 구간표 — nutrition-grades 의 실제 스케일에서 그대로 읽는다.
   숫자를 손으로 옮겨 적지 않는다 — 데이터가 바뀌면 표도 같이 바뀐다.
   ══════════════════════════════════════════════════════════════════════ */

function fmtCut(v: number): string {
  return v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
}

/**
 * [20,50,80] 백분위 경계 → A~D 구간 문자열 **네 개**.
 * 🔴 20/40/60/80 다섯 칸에서 프로틴랩과 같은 20/50/80 네 칸으로 바꿨다 (2026-08-07).
 * ⚠️ 좋은 쪽이 위인 축(단백질)은 상위 20% 가 **80분위 이상**이다 — 방향에 따라
 *    같은 경계 배열을 반대로 읽는다.
 */
function rangesOf(cuts: number[], goodHigh: boolean, unit: string): string[] {
  const [c1, c2, c3] = cuts.map(fmtCut);
  return goodHigh
    ? [`${c3}${unit} 이상`, `${c2}~${c3}`, `${c1}~${c2}`, `${c1}${unit} 미만`]
    : [
        Number(c1) === 0 ? `0${unit}` : `${c1}${unit} 이하`,
        `${c1}~${c2}`,
        `${c2}~${c3}`,
        `${c3}${unit} 초과`,
      ];
}

const AXIS_UNIT: Record<string, string> = {
  prot: "g",
  kcal: "kcal",
  sugar: "g",
  carb: "g",
  fat: "g",
};

function CutTable({ cat }: { cat: string }) {
  const n = products.filter((p) => p.cat === cat).length;
  const unitLabel = cat === "파우더" ? "1스쿱 30g" : "1병";
  return (
    <div className="mt-5">
      <h3 className="text-[15px] font-bold leading-6 text-title">
        {catLabel(cat)} — {unitLabel} 기준 · {n}개
      </h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[13px] leading-5">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-muted">
              <th className="py-1.5 pr-3 font-semibold">축</th>
              {GRADES.map((g) => (
                <th key={g} className="py-1.5 pr-3 font-semibold">
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NUT_AXES.map((a) => {
              const cuts = gradeCuts(cat, a.key);
              if (!cuts) return null;
              const ranges = rangesOf(cuts, a.goodHigh, AXIS_UNIT[a.key]);
              return (
                <tr key={a.key} className="border-b border-line">
                  <td className="py-1.5 pr-3 font-semibold text-body">{a.label}</td>
                  {ranges.map((r, i) => (
                    <td key={i} className="py-1.5 pr-3 tabular-nums text-body">
                      {r}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
