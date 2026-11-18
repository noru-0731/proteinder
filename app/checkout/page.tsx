import Checkout from "@/components/Checkout";

export const metadata = { title: "주문서 — 프로틴더" };

export default function CheckoutPage() {
  return (
    <div className="container-page px-4 lg:px-24 py-5">
      <h1 className="text-[26px] font-bold leading-[34px] text-title">주문서</h1>
      <Checkout />
    </div>
  );
}
