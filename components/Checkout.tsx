"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cartTotal, clearCart, readCart, shipFeeOf, makeOrderNo, type CartLine } from "@/lib/cart";
import { saveOrder, won } from "@/lib/orders";

/**
 * 주문서 — 우리 화면에서 주문을 받는다 (2026-08-08 · 심사위원 피드백).
 *
 * 🔴 **카드번호·계좌번호를 받는 칸이 없다.** 이 사이트는 공개 주소에 떠 있어서
 *    누군가 실제 카드 정보를 입력할 수 있다. 결제수단은 「무엇으로 낼지」 고르는
 *    데까지이고, 실제 결제·배송은 제휴몰이 맡는다는 사실을 화면에 그대로 적는다.
 * ⚠️ 이름·연락처·주소는 이 브라우저에만 남는다 — 서버로 보내지 않는다 (lib/orders.ts).
 */
const PAYS = ["신용·체크카드", "간편결제", "무통장 입금"];

export default function Checkout() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [pay, setPay] = useState(PAYS[0]);
  const [sending, setSending] = useState(false);

  // 마운트 1회 localStorage 복원 — 서버에는 장바구니가 없어 첫 렌더가 반드시
  // 비어 있어야 하이드레이션이 안 어긋난다 (찜콩·계산기와 같은 사유)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 사유
  useEffect(() => setLines(readCart()), []);

  if (lines === null) return null;

  if (lines.length === 0) {
    return (
      <div className="card mt-6 rounded-2xl p-10 text-center">
        <p className="text-[14px] text-ink-dim">장바구니가 비어 있어 주문할 수 없습니다.</p>
        <Link
          href="/cart"
          className="focus-ring mt-4 inline-block rounded-md border border-line-hover px-4 py-2.5 text-[13.5px] font-semibold text-body"
        >
          장바구니로
        </Link>
      </div>
    );
  }

  const subtotal = cartTotal(lines);
  const ship = shipFeeOf(subtotal);
  const total = subtotal + ship;
  const ready = name.trim().length >= 2 && phone.trim().length >= 9 && addr.trim().length >= 5;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    const no = makeOrderNo();
    saveOrder({
      no,
      at: new Date().toISOString(),
      lines: lines!,
      subtotal,
      ship,
      total,
      name: name.trim(),
      phone: phone.trim(),
      addr: addr.trim(),
      pay,
    });
    clearCart();
    router.push(`/order/${no}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <section className="card rounded-2xl p-6">
          <h2 className="text-[18px] font-bold leading-[27px] text-title">받는 사람</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Field label="이름" value={name} onChange={setName} placeholder="홍길동" />
            <Field
              label="연락처"
              value={phone}
              onChange={setPhone}
              placeholder="010-0000-0000"
              type="tel"
            />
            <Field label="주소" value={addr} onChange={setAddr} placeholder="서울시 동대문구 …" />
          </div>
          <p className="mt-3 text-[11.5px] leading-[17px] text-faint">
            입력한 정보는 이 브라우저에만 남고 서버로 보내지 않습니다.
          </p>
        </section>

        <section className="card mt-4 rounded-2xl p-6">
          <h2 className="text-[18px] font-bold leading-[27px] text-title">결제수단</h2>
          <div className="mt-3 flex flex-col gap-2">
            {PAYS.map((p) => (
              <label
                key={p}
                className={`focus-ring flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-[14px] transition-colors ${
                  pay === p
                    ? "border-brand-strong bg-brand-wash font-semibold text-brand-ink"
                    : "border-line-hover text-body hover:border-brand-strong"
                }`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={pay === p}
                  onChange={() => setPay(p)}
                  className="accent-brand-strong"
                />
                {p}
              </label>
            ))}
          </div>
          {/* 🔴 이 줄이 이 화면에서 가장 중요한 문장이다 */}
          <p className="mt-3 rounded-lg border-l-[3px] border-danger-strong bg-warn px-3.5 py-2.5 text-[12.5px] leading-[19px] text-danger-ink">
            카드번호·계좌번호는 받지 않습니다. 주문서를 접수하는 데까지가 프로틴더의 몫이고,
            실제 결제와 배송은 판매처가 맡습니다.
          </p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <section className="card rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-title">주문 요약</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {lines.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="kr min-w-0 flex-1 truncate text-muted">
                  {l.name} <span className="text-faint">×{l.qty}</span>
                </span>
                <span className="shrink-0 tabular-nums text-body">{won(l.won * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-muted">배송비</span>
              <span className="tabular-nums text-body">{ship === 0 ? "무료" : won(ship)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[14px] font-bold text-title">합계</span>
              <span className="text-[22px] font-bold tabular-nums text-brand-ink">{won(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!ready || sending}
            className="focus-ring mt-4 w-full rounded-[10px] bg-brand-strong py-3.5 text-[15px] font-bold text-on-brand transition-colors hover:bg-brand-deep disabled:opacity-40"
          >
            {sending ? "접수 중" : `${won(total)} 주문하기`}
          </button>
          {!ready && (
            <p className="mt-2 text-center text-[11.5px] text-faint">
              받는 사람 정보를 모두 채워 주세요.
            </p>
          )}
        </section>
      </aside>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="text-[12.5px] font-semibold text-body">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring mt-1 block w-full rounded-md border border-line-hover px-3 py-2.5 text-[14px] font-normal text-title placeholder:text-faint"
      />
    </label>
  );
}
