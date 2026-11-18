import Link from "next/link";
import Icon from "@/components/Icon";

/**
 * 자주 묻는 질문 — 드링크메모가 홈·카테고리마다 깔아 둔 자리 (2026-08-08).
 *
 * 🔴 **홈 맨 밑에서 `/faq` 탭으로 옮겼다** (2026-08-08 오후 · 팀 지시). 그 자리에는
 *    매거진이 들어갔다. FAQ 는 홈에 있을 때 「닫는 글」이라 한 번 읽히면 끝인데,
 *    탭으로 세우면 궁금할 때 다시 찾아올 수 있는 자리가 된다.
 *    ⚠️ 컴포넌트 이름이 `HomeFaq` 였다 — 홈에서 나갔으므로 이름도 같이 고쳤다.
 *
 * 🔴 native `<details>` 다. JS 도 하이드레이션도 없다 — 시연 안정성이 설계 제약이고,
 *    아코디언 하나 열자고 클라이언트 컴포넌트를 끌어들이지 않는다 (필터와 같은 규칙).
 * 🔴 **답마다 뒷단으로 가는 다리가 하나씩 있다.** 「앞단이 데이터를 보여주는데 뒷단
 *    근거와 연결이 약하다」는 지적의 화면 쪽 처방이다 — 사전·구간표·조건 목록으로 나간다.
 * ⚠️ 링크는 실제로 있는 경로만 건다. 단백질 계산기는 제품 상세 안에 있어 독립
 *    경로가 없다 — 링크 대신 어디 있는지 글로 적는다.
 */

type Item = { q: string; a: React.ReactNode };

const ITEMS: Item[] = [
  {
    q: "하루에 단백질을 얼마나 먹어야 하나요?",
    a: (
      <>
        <b>2025 한국인 영양소 섭취기준</b>은 일반 성인의 평균필요량을 체중 1kg당 하루{" "}
        <b>0.73g</b>으로 산정하며, 개인차를 반영한 권장섭취량은 약 <b>0.91g</b> 수준입니다.
        나이·활동량·건강 상태에 따라 필요한 양은 달라질 수 있습니다. 프로틴더 계산기는
        참고용이며 개인 처방을 제공하지 않습니다.
      </>
    ),
  },
  {
    q: "WPI와 WPC는 뭐가 다른가요?",
    a: (
      <>
        둘 다 우유에서 얻는 유청단백입니다. <Link href="/ingredients/WPI">WPI</Link>는{" "}
        <Link href="/ingredients/WPC">WPC</Link>보다 여과 과정을 더 거쳐 일반적으로 단백질
        비율이 높고 유당과 지방이 적습니다. 따라서 유당 불내증이 있다면 WPI 쪽이
        낫습니다만, 개인의 소화 정도와 제품 전체 원재료를 함께 확인해야 합니다.
      </>
    ),
  },
  {
    q: "「당류 0g」은 단맛이 없다는 뜻인가요?",
    a: (
      <>
        아닙니다. 표시 기준상 해당 표시 단위의 당류가 <b>0.5g 미만</b>이면 0g으로 표시할 수
        있으며, 수크랄로스·아세설팜칼륨·스테비올배당체·당알코올 같은 감미료로 단맛을 낼 수도
        있습니다. 영양성분표의 당류와 원재료의 감미료를 함께 확인해 주세요.
      </>
    ),
  },
  {
    q: "「원료 불명확」은 나쁜 제품이라는 뜻인가요?",
    a: (
      <>
        아닙니다. 「두류가공품」, 「혼합제제」처럼 공개된 신고 명칭만으로는 내부 원료를
        구체적으로 확인하기 어렵다는 뜻입니다. 제품의 안전성이나 품질을 판단한 표시가
        아닙니다.
      </>
    ),
  },
  {
    q: "A·B·C·D 등급은 무엇을 기준으로 하나요?",
    a: (
      <>
        같은 카테고리 안에서 영양성분 값이 어느 위치에 있는지를 보여주는{" "}
        <Link href="/grades">분포 등급</Link>입니다. 단백질은 많은 쪽, 열량·당류·탄수화물·지방은
        적은 쪽부터 A로 표시합니다. A는 상위 20%, B는 다음 30%, C는 다음 30%, D는 나머지
        20%이며, <b>맛·안전성·효능을 평가한 점수가 아닙니다.</b>
      </>
    ),
  },
];

export default function HomeFaq() {
  return (
    <div className="px-5 pb-2">
      {ITEMS.map((it, i) => (
        <details key={it.q} className="group border-t border-line" open={i === 0}>
          <summary className="focus-ring flex cursor-pointer list-none items-start gap-2.5 py-3.5 text-[14px] leading-[1.5] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="pt-px text-[13px] font-extrabold text-flame-deep">
              Q
            </span>
            <span className="kr min-w-0 flex-1">{it.q}</span>
            <Icon name="chevron-down" size={18} className="mt-0.5 shrink-0 text-ink-dim transition-transform group-open:rotate-180" />
          </summary>
          <p className="kr mb-4 ml-[22px] text-[13px] leading-[1.72] text-ink-sub [&_a]:text-flame-deep [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-semibold [&_b]:text-ink">
            {it.a}
          </p>
        </details>
      ))}
    </div>
  );
}
