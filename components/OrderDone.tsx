"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deliveryHint, findOrder, won, type Order } from "@/lib/orders";

/** 주문 완료 — 「우리 화면에서 주문이 끝났다」를 보여주는 자리 */
export default function OrderDone({ no }: { no: string }) {
  const [o, setO] = useState<Order | null | undefined>(undefined);

  // 주문은 브라우저에만 있다 — 서버 렌더에는 없으므로 마운트 뒤에 찾는다
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 사유
  useEffect(() => setO(findOrder(no)), [no]);

  if (o === undefined) return null;

  if (o === null) {
    return (
      <div className="card mt-6 rounded-2xl p-10 text-center">
        <p className="text-[14px] text-ink-dim">
          주문 {no} 을 찾을 수 없습니다. 주문 내역은 주문한 브라우저에만 남습니다.
        </p>
        <Link
          href="/rank"
          className="focus-ring mt-4 inline-block rounded-md border border-line-hover px-4 py-2.5 text-[13.5px] font-semibold text-body"
        >
          제품 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="card mt-6 rounded-2xl p-8 text-center">
        <p className="text-[15px] font-bold text-brand-ink">주문이 접수되었습니다</p>
        <p className="mt-2 text-[26px] font-bold tabular-nums text-title">{o.no}</p>
        <p className="mt-2 text-[13.5px] text-muted">
          {deliveryHint(o.at)}쯤 받아보실 수 있습니다 · {o.pay}
        </p>
        <p className="mt-4 inline-block rounded-lg bg-warn px-4 py-2.5 text-[12.5px] leading-[19px] text-danger-ink">
          결제와 배송은 판매처가 맡습니다. 프로틴더는 주문서를 접수하는 데까지입니다.
        </p>
      </div>

      <section className="card mt-4 rounded-2xl p-6">
        <h2 className="text-[16px] font-bold text-title">주문 내역</h2>
        <ul className="mt-3">
          {o.lines.map((l) => (
            <li key={l.id} className="flex gap-3 border-b border-line py-3 last:border-b-0">
              <Link
                href={`/product/${l.id}`}
                className="size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white"
              >
                {l.img && (
                  // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
                  <img src={l.img} alt="" className="size-full object-contain" />
                )}
              </Link>
              <span className="min-w-0 flex-1">
                <span className="kr block text-[13.5px] font-semibold text-title">{l.name}</span>
                <span className="text-[12px] text-faint">수량 {l.qty}</span>
              </span>
              <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-title">
                {won(l.won * l.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-[14px] font-bold text-title">결제 예정 금액</span>
          <span className="text-[20px] font-bold tabular-nums text-brand-ink">{won(o.total)}</span>
        </div>
        <p className="mt-3 text-[12px] text-muted">
          받는 사람 {o.name} · {o.phone} · {o.addr}
        </p>
      </section>
    </>
  );
}
