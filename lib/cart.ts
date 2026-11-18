import prices from "@/data/prices.json";

/**
 * 장바구니 — 「우리 화면에서 골라 우리 화면에서 주문까지」 (2026-08-08 · 심사위원 피드백).
 *
 * 🔴 지적: **구매를 쿠팡으로 넘기면 고객이 거기 묶이고 우리에게 남는 게 없다.**
 *    결제 자체를 우리가 처리하려면 PG 계약·정산·사업자가 필요하다. 그래서 이번엔
 *    **주문까지를 우리 화면에서 끝내고**, 실제 배송·결제는 제휴몰이 맡는 형태로 만든다
 *    (스탬플리·다나와가 쓰는 경유 커머스 구조).
 *
 * 🔴 **가격을 지어내지 않는다.** 판매처에서 실제로 본 값만 쓰고, 없으면
 *    「가격 미확인」으로 두고 주문 대상에서 뺀다.
 *
 * 수집 (210건 중 178건 · 85%) — scratchpad/oyprice.mjs · st11price.mjs · normalize.mjs
 *    올리브영  31건  낱개가가 정확하나 취급 품목이 좁다 (닭가슴살 0건)
 *    11번가   147건  카탈로그가 넓으나 묶음이 섞인다
 *    ❌ 쿠팡 403 · G마켓 403 · 네이버 쇼핑 차단 · 다나와 오매칭
 *
 * ⚠️ **묶음가는 낱개로 나눠 적는다.** 「20개 53,400원」을 그대로 두면 낱개가로 읽힌다.
 *    제목의 개수로 나누고(103건), 개수가 안 적힌 것은 카테고리 상한에 걸치는
 *    최소 배수로 나눈다(추정 · `guess`). MVP 라 자릿수만 맞춘다 — 팀 지시.
 *    나눈 사실은 `raw`·`pack` 으로 남아 화면에 그대로 적을 수 있다.
 */
type Price = {
  /** 낱개 환산가. 묶음이면 raw ÷ pack 이다 */
  won: number;
  title: string;
  link: string | null;
  bundle: boolean;
  s: number;
  at: string;
  /** 어디서 봤나 — 없으면 올리브영 */
  src?: string;
  /** 묶음일 때 판매처 표시가와 개수 */
  raw?: number;
  pack?: number;
  /** 제목에 개수가 없어 배수를 추정한 경우 */
  guess?: boolean;
};

const TABLE = prices as unknown as Record<string, Price | null>;

/** 이 제품의 수집 가격. 못 찾았으면 null */
export function priceOf(id: string): Price | null {
  return TABLE[id] ?? null;
}

export const PRICED_COUNT = Object.values(TABLE).filter(Boolean).length;

/* ─────────────────────────────────────────────────────────────
   담기 — 로그인이 없으므로 이 브라우저에만 (찜콩과 같은 방식).
   🔴 찜콩과 **따로 둔다.** 찜은 「나중에 볼 것」이고 장바구니는 「살 것」이다 —
      섞으면 주문 화면에 안 살 것까지 올라온다.
   ───────────────────────────────────────────────────────────── */
const KEY = "ptd.cart";
export const CART_EVENT = "ptd:cart";

export type CartLine = {
  id: string;
  name: string;
  img: string | null;
  /** 담을 때의 가격을 그대로 박아 둔다 — 나중에 수집값이 바뀌어도 주문서가 안 흔들린다 */
  won: number;
  title: string;
  qty: number;
};

export function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    /* 사생활 보호 모드 — 담기만 포기한다 */
  }
}

export function addToCart(line: Omit<CartLine, "qty">, qty = 1) {
  const all = readCart();
  const found = all.find((x) => x.id === line.id);
  if (found) found.qty += qty;
  else all.push({ ...line, qty });
  write(all);
}

export function setQty(id: string, qty: number) {
  const all = readCart();
  const found = all.find((x) => x.id === id);
  if (!found) return;
  if (qty <= 0) write(all.filter((x) => x.id !== id));
  else {
    found.qty = Math.min(99, qty);
    write(all);
  }
}

export function removeFromCart(id: string) {
  write(readCart().filter((x) => x.id !== id));
}

export function clearCart() {
  write([]);
}

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + l.won * l.qty, 0);

/** 무료배송 기준 — 우리가 정한 값이라 화면에 그대로 적는다 */
export const FREE_SHIP = 30000;
export const SHIP_FEE = 3000;

export const shipFeeOf = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIP ? 0 : SHIP_FEE;

/** 주문번호 — 날짜 + 6자리. 서버가 없으므로 이 브라우저에서 만든다 */
export function makeOrderNo(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  const ymd = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const rand = String(Math.floor(Math.random() * 1e6)).padStart(6, "0");
  return `${ymd}-${rand}`;
}
