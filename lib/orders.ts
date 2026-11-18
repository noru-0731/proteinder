import type { CartLine } from "./cart";

/**
 * 주문 — 우리 화면에서 받은 주문을 남긴다 (2026-08-08 · 심사위원 피드백).
 *
 * 🔴 **결제·배송은 우리가 처리하지 않는다.** PG 계약·정산·사업자가 필요한 영역이라
 *    이번 범위 밖이다. 주문서를 받고 주문번호를 내주는 데까지가 우리 몫이고,
 *    화면에 그 사실을 그대로 적는다.
 * 🔴 **카드번호·계좌번호를 받지 않는다.** 공개 주소에 떠 있는 화면이라 누군가
 *    실제로 입력할 수 있다. 결제수단은 「무엇으로 낼지」 고르는 데까지만이다.
 *
 * 저장은 두 겹이다 —
 *   ① localStorage  로그인이 없어 이 브라우저에만. 없어도 화면은 완결된다
 *   ② Supabase      표가 있으면 함께 남긴다. 없으면 조용히 넘어간다 (리뷰와 같은 규칙)
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const LS = "ptd.orders";

export type Order = {
  no: string;
  at: string;
  lines: CartLine[];
  subtotal: number;
  ship: number;
  total: number;
  /** 받는 사람 — 이름·연락처·주소. 카드·계좌 정보는 받지 않는다 */
  name: string;
  phone: string;
  addr: string;
  pay: string;
};

export function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LS);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function findOrder(no: string): Order | null {
  return readOrders().find((o) => o.no === no) ?? null;
}

export function saveOrder(o: Order) {
  try {
    const all = readOrders();
    all.unshift(o);
    localStorage.setItem(LS, JSON.stringify(all.slice(0, 50)));
  } catch {
    /* 저장만 포기 — 주문 완료 화면은 그대로 뜬다 */
  }
  void pushOrder(o);
}

/**
 * Supabase 에도 남긴다. 표가 없으면 그냥 실패하고 넘어간다.
 *
 * 표: public.orders (order_no text · total int · items int · created_at)
 * ⚠️ **이름·연락처·주소는 보내지 않는다.** 개인정보를 익명 키로 열린 표에 넣을 이유가
 *    없다 — 서버에 남길 값은 「주문이 몇 건, 얼마어치 있었나」까지다.
 */
async function pushOrder(o: Order) {
  if (!URL_ || !KEY_) return;
  try {
    await fetch(`${URL_}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: KEY_,
        Authorization: `Bearer ${KEY_}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        order_no: o.no,
        total: o.total,
        items: o.lines.reduce((s, l) => s + l.qty, 0),
      }),
    });
  } catch {
    /* 표가 없거나 네트워크가 죽었다 — 주문은 이미 브라우저에 남아 있다 */
  }
}

export const won = (n: number) => `${n.toLocaleString()}원`;

/** 배송 예정 — 영업일 기준이 아니라 「이틀 뒤쯤」까지만 적는다 */
export function deliveryHint(at: string) {
  const d = new Date(at);
  d.setDate(d.getDate() + 2);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
