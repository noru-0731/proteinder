import type { Metadata } from "next";
import HomeFaq from "@/components/HomeFaq";
import { Note } from "@/components/Bits";

export const metadata: Metadata = {
  title: "자주 묻는 질문 — 프로틴더",
  description:
    "단백질 섭취량, WPI와 WPC의 차이, 당류 0g의 뜻, 「원료 불명확」의 뜻, A~D 등급의 기준을 정리했습니다.",
};

/**
 * 자주 묻는 질문 — 홈 맨 아래에 있던 절을 탭으로 올렸다 (2026-08-08 · 팀 지시).
 *
 * 🔴 **옮긴 것이지 지운 것이 아니다.** 홈의 그 자리는 매거진이 받았다.
 *    FAQ 는 한 번 읽으면 되는 글이라 홈에서 매번 스크롤을 먹을 값이 아니었고,
 *    반대로 탭에 있으면 궁금할 때 찾아올 수 있다.
 * ⚠️ 부품(`HomeFaq`)은 그대로 쓴다. 답마다 뒷단으로 가는 다리가 하나씩 박혀 있어
 *    (사전·구간표·조건 목록) 그게 이 화면의 값이다 — 다시 짜면 그 링크를 잃는다.
 */
export default function Faq() {
  return (
    <>
      <div className="px-5 pt-6 pb-1">
        <p className="text-[12.5px] font-semibold text-flame-deep">자주 묻는 질문</p>
        <h1 className="kr mt-1 text-[22px] leading-[1.3] font-semibold text-ink">
          이 화면의 숫자는 무슨 뜻인가요
        </h1>
      </div>

      <Note>
        답마다 근거가 있는 화면으로 가는 링크를 하나씩 달아 뒀습니다. 우리가 무엇을 재고
        무엇을 재지 않는지는 <b className="font-semibold text-ink-sub">등급 구간표</b>와{" "}
        <b className="font-semibold text-ink-sub">원재료 사전</b>에 그대로 공개합니다.
      </Note>

      <div className="pb-9">
        <HomeFaq />
      </div>
    </>
  );
}
