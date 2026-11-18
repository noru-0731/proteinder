"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addToCart, readCart, CART_EVENT, type CartLine } from "@/lib/cart";

/**
 * 「담기」 — 제품 상세의 구매 줄 (2026-08-08 · 심사위원 피드백).
 *
 * 🔴 가격을 아는 제품에만 뜬다. 모르는 제품은 담을 수 없고, 대신 기존 검색 링크가
 *    그대로 남는다 — 없는 가격을 지어내 담게 하지 않는다.
 * ⚠️ 첫 렌더는 서버와 같아야 하므로 담긴 상태는 마운트 뒤에 반영한다.
 */
export default function CartButton({ line }: { line: Omit<CartLine, "qty"> }) {
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const sync = () => setInCart(readCart().some((x) => x.id === line.id));
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, [line.id]);

  /* 🔴 **두 상태의 폭이 같아야 한다** (2026-08-08 · 팀 지시 「담기 누르면 글씨가
     연장되면서 행이 바뀐다」). 「담기」(2자) → 「장바구니에 있음 ›」(9자)로 글자가
     늘면서 버튼이 커지고, 이 줄이 `flex-wrap` 이라 **옆 버튼이 아랫줄로 떨어졌다.**
     누른 자리가 그대로 있어야 하는데 화면이 통째로 흔들린 것이다.

     고치는 방법이 둘인데 — 글자를 짧게 바꾸거나(뜻이 준다), 자리를 미리 잡거나 —
     **자리를 잡는 쪽**을 골랐다. `min-w` 로 긴 쪽에 맞춰 두면 두 상태가 같은 폭이라
     어느 쪽이 떠도 줄이 안 흐른다. `justify-center` 가 있어야 짧은 글자가 왼쪽으로
     쏠리지 않는다.
     ⚠️ 서버 렌더링은 늘 「담기」다. 담긴 상태는 마운트 뒤에 오므로, 폭이 고정돼 있지
        않으면 **하이드레이션 직후에도 한 번 흔들린다.** */
  /* ⚠️ **테두리를 양쪽 다 갖는다** — 담긴 상태에만 `border` 를 주면 그 1px×2 만큼
     상자가 높아져, 폭을 고정해도 **줄 전체가 1~2px 내려앉는다** (실측: 옆 버튼
     y 341 → 342 · 아랫줄 385 → 387). 채운 쪽은 `border-transparent` 로 자리만 잡는다. */
  const BOX =
    "focus-ring inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors";

  if (inCart) {
    return (
      <Link href="/cart" className={`${BOX} border-brand-strong text-brand-ink hover:bg-brand-wash`}>
        장바구니 ›
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addToCart(line)}
      className={`${BOX} border-transparent bg-brand-strong text-on-brand hover:bg-brand-deep`}
    >
      담기
    </button>
  );
}
