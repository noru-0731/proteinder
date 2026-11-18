import CartView from "@/components/CartView";
import StampCard from "@/components/StampCard";

export const metadata = { title: "장바구니 — 프로틴더" };

/**
 * 장바구니 — 「고르는 일 전부가 우리 화면에서 끝난다」 (2026-08-08 · 심사위원 피드백).
 * 껍데기는 서버에서, 담긴 것은 브라우저에서 (로그인이 없어 계정에 못 붙인다).
 *
 * ❌ 제목 밑 회색 줄(가격 출처·묶음 환산 안내)을 지웠다 (2026-08-08 · 팀 지시).
 *    ⚠️ **출처가 사라진 것은 아니다** — 제품 상세의 가격 줄이 「11번가 2026-08-08 기준 ·
 *       6개 21,200원을 낱개로 나눈 값」처럼 제품마다 그대로 적는다.
 */
export default function CartPage() {
  return (
    <div className="container-page px-4 lg:px-24 py-5">
      <h1 className="text-[26px] font-bold leading-[34px] text-title">장바구니</h1>
      <CartView />
      {/* 스탬프는 장바구니가 비어 있어도 뜬다 — 「결제하면 찍어드린다」는 안내라
          담긴 것이 없을 때 오히려 보여야 할 자리다 */}
      <StampCard />
    </div>
  );
}
