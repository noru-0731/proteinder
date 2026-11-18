import { priceOf } from "@/lib/cart";

/**
 * 목록 카드의 가격 한 줄 (2026-08-08 · 팀 지시 「가격 진행된 것만 표기」).
 *
 * 🔴 **수집된 제품에만 뜬다.** 210건 중 178건이고, 없으면 이 줄이 아예 안 생긴다 —
 *    「가격 미확인」 같은 빈 자리를 남기지 않는다.
 * 🔴 서버에서 그린다. 가격은 정적 JSON(data/prices.json)이라 별점처럼 받아올 필요가 없다.
 * ⚠️ 묶음을 나눈 값은 「개당」이라고 적는다 — 판매처 표시가와 다르다는 사실을 숨기지 않는다.
 */
export default function PriceLine({ id, className = "" }: { id: string; className?: string }) {
  const p = priceOf(id);
  if (!p) return null;
  return (
    <span className={`block text-[13px] font-bold tabular-nums text-title ${className}`}>
      {p.pack && <span className="font-medium text-faint">개당 </span>}
      {p.won.toLocaleString()}원
    </span>
  );
}
