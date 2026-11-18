"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CART_EVENT,
  FREE_SHIP,
  cartTotal,
  readCart,
  removeFromCart,
  setQty,
  shipFeeOf,
  type CartLine,
} from "@/lib/cart";
import { won } from "@/lib/orders";

/** 장바구니 본문 — 담긴 것은 이 브라우저에만 있다 (로그인 없음) */
export default function CartView() {
  const [lines, setLines] = useState<CartLine[] | null>(null);

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  if (lines === null) return null; // 서버 렌더와 어긋나지 않게 마운트 전에는 안 그린다

  if (lines.length === 0) {
    return (
      <div className="card mt-6 rounded-2xl p-10 text-center">
        <p className="text-[14px] text-ink-dim">장바구니가 비어 있습니다.</p>
        <Link
          href="/rank"
          className="focus-ring mt-4 inline-block rounded-md bg-brand-strong px-4 py-2.5 text-[13.5px] font-semibold text-on-brand"
        >
          제품 둘러보기
        </Link>
      </div>
    );
  }

  const subtotal = cartTotal(lines);
  const ship = shipFeeOf(subtotal);

  return (
    <>
      <ul className="card mt-6 rounded-2xl px-6">
        {lines.map((l) => (
          <li key={l.id} className="flex gap-4 border-b border-line py-5 last:border-b-0">
            <Link
              href={`/product/${l.id}`}
              className="size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-white"
            >
              {l.img && (
                // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
                <img src={l.img} alt="" className="size-full object-contain" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${l.id}`}
                className="kr block text-[14.5px] font-bold leading-[20px] text-title hover:underline"
              >
                {l.name}
              </Link>
              {/* 🔴 수집한 상품명을 그대로 적는다 — 우리가 가격을 어디서 봤는지 밝히는 줄 */}
              <p className="kr mt-0.5 line-clamp-1 text-[11.5px] text-faint">{l.title}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-md border border-line-hover">
                  <button
                    type="button"
                    onClick={() => setQty(l.id, l.qty - 1)}
                    aria-label="수량 줄이기"
                    className="focus-ring px-2.5 py-1 text-[15px] text-body"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-[13.5px] font-semibold tabular-nums text-title">
                    {l.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(l.id, l.qty + 1)}
                    aria-label="수량 늘리기"
                    className="focus-ring px-2.5 py-1 text-[15px] text-body"
                  >
                    +
                  </button>
                </span>
                <span className="text-[15px] font-bold tabular-nums text-title">
                  {won(l.won * l.qty)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFromCart(l.id)}
              aria-label={`${l.name} 빼기`}
              className="focus-ring h-fit shrink-0 rounded p-1 text-[12px] text-faint hover:text-danger-ink"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="card mt-4 rounded-2xl p-6">
        <Row label="상품 금액" value={won(subtotal)} />
        <Row
          label="배송비"
          value={ship === 0 ? "무료" : won(ship)}
          note={ship > 0 ? `${won(FREE_SHIP)} 이상 무료` : undefined}
        />
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-[14px] font-bold text-title">결제 예정 금액</span>
          <span className="text-[22px] font-bold tabular-nums text-brand-ink">
            {won(subtotal + ship)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="focus-ring mt-4 block rounded-[10px] bg-brand-strong py-3.5 text-center text-[15px] font-bold text-on-brand transition-colors hover:bg-brand-deep"
        >
          주문하기
        </Link>
      </div>
    </>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-[13.5px] text-muted">
        {label}
        {note && <span className="ml-1.5 text-[11.5px] text-faint">{note}</span>}
      </span>
      <span className="text-[14px] font-semibold tabular-nums text-title">{value}</span>
    </div>
  );
}
