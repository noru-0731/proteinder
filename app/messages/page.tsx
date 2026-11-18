import Messages from "@/components/Messages";

export const metadata = { title: "쪽지 — 프로틴더" };

/**
 * 쪽지함 — 열어 본 제품이 보낸 대화가 모이는 자리 (2026-08-08 · 팀 지시 「틴더 정체성」).
 *
 * 🔴 라우트가 하나뿐이다. 대화 내용이 localStorage 에만 있어 `/messages/[id]` 를
 *    만들어도 링크를 받은 사람에겐 빈 화면이다 — 고른 대화는 상태로만 들고 있는다.
 * ⚠️ 본문은 클라이언트 렌더링이다 (찜콩·장바구니와 같은 사정). 껍데기는 정적이라
 *    JS 가 죽어도 제목과 안내는 뜬다.
 */
export default function MessagesPage() {
  return (
    <>
      <div className="px-5 pt-6 pb-2">
        <h1 className="kr text-[28px] leading-[1.25] font-semibold text-flame">쪽지</h1>
        <p className="kr mt-1 max-w-[560px] text-[12.5px] leading-[1.6] text-ink-dim">
          열어 본 제품이 자기 성분을 소개하고, 성분이 가까운 제품을 함께 알려 줍니다.
          이 브라우저에만 저장되고 서버로는 아무것도 보내지 않습니다.
        </p>
      </div>
      <Messages />
    </>
  );
}
