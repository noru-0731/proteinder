import type { Metadata } from "next";
import { ARTICLES, SCOPE } from "@/lib/magazine";
import { MagazineGrid } from "@/components/Magazine";
import { Note } from "@/components/Bits";

export const metadata: Metadata = {
  title: "매거진 — 프로틴더",
  description:
    "수록 제품을 같은 자로 재다 눈에 걸린 것들을 적어 둡니다. 신고서가 무엇을 적고 무엇을 안 적는가에 대한 이야기입니다.",
};

/**
 * 매거진 목록 — 뉴닉의 「시리즈」 한 칸 자리다.
 *
 * 🔴 **코너를 하나만 둔다.** 뉴닉은 시리즈가 90개지만 자체 코너는 열둘 남짓이고,
 *    우리 기사 여섯은 전부 한 성격이다 — 「신고서가 무엇을 적고 무엇을 안 적는가」.
 *    성격이 하나인데 코너를 셋으로 쪼개면 이름만 늘고 내용은 안 는다.
 */
export default function Magazine() {
  return (
    <>
      <div className="px-5 pt-6 pb-1">
        <p className="text-[12.5px] font-semibold text-flame-deep">프로틴더 매거진</p>
        <h1 className="kr mt-1 text-[22px] leading-[1.3] font-semibold text-ink">
          신고서에는 이렇게 적혀 있어요
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-dim">
          수록 {SCOPE.total}건 · 원재료 신고 {SCOPE.withIngredients}건 · 기사 {ARTICLES.length}편
        </p>
      </div>

      <Note>
        기사에 적힌 숫자는 전부 <b className="font-semibold text-ink-sub">수록 제품을 센 값</b>
        입니다. 따로 조사한 것도, 어림한 것도 없습니다. 수록이 바뀌면 문장의 숫자와 아래 제품
        목록이 함께 바뀌도록 짜 두었습니다.
      </Note>

      <div className="pt-2 pb-9">
        <MagazineGrid items={ARTICLES} cols={3} />
      </div>
    </>
  );
}
