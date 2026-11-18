import { LikesList } from "@/components/Likes";
import { Note } from "@/components/Bits";

export const metadata = { title: "찜콩 — 프로틴더" };

export default function Likes() {
  return (
    <>
      <div className="px-5 pt-6 pb-1">
        <h1 className="kr text-[22px] leading-[1.3] font-semibold text-ink">
          <span className="text-flame">찜콩</span> 목록
        </h1>
      </div>
      <Note>
        이 브라우저에만 저장됩니다. 로그인이 없고 서버로 아무것도 보내지 않으므로,
        다른 기기에서는 보이지 않습니다.
      </Note>
      <LikesList />
    </>
  );
}
