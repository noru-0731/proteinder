import OrderDone from "@/components/OrderDone";

export const metadata = { title: "주문 완료 — 프로틴더" };

/** 주문 완료 — 주문은 브라우저에 있으므로 본문은 클라이언트가 그린다 */
export default async function OrderPage({ params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  return (
    <div className="container-page px-4 lg:px-24 py-5">
      <OrderDone no={decodeURIComponent(no)} />
    </div>
  );
}
