"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { LIKES_EVENT, LikeSnap, isLiked, toggleLike } from "@/lib/likes";

/**
 * 찜 하트 — 카드(사진 위 원형)와 상세(구매 버튼 줄) 두 모습.
 *
 * 첫 렌더는 서버와 같은 빈 하트로 그리고 마운트 후 localStorage 에서 복원한다
 * (계산기와 같은 패턴 — 하이드레이션 불일치 없음).
 * 같은 제품의 하트가 화면에 둘 떠 있어도 LIKES_EVENT 로 함께 바뀐다.
 *
 * ⚠️ 카드 하트는 Link 안에 넣지 않는다 — a 안의 button 은 잘못된 중첩이고
 *    클릭이 카드 이동과 싸운다. ProductCard 가 relative 래퍼의 형제로 띄운다.
 */
export default function LikeButton({
  snap,
  variant,
  className = "",
}: {
  snap: LikeSnap;
  variant: "card" | "detail";
  className?: string;
}) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const sync = () => setLiked(isLiked(snap.id));
    sync();
    window.addEventListener(LIKES_EVENT, sync);
    return () => window.removeEventListener(LIKES_EVENT, sync);
  }, [snap.id]);

  /* 🔴 Tabler 하트 (MIT). 채운 모양은 별도 경로라 `filled` 로 가른다 —
     선 하트에 fill 만 채우면 안쪽이 뭉개져 모양이 달라진다 (components/Icon.tsx) */
  const heart = (
    <Icon name="heart" size={variant === "card" ? 15 : 14} filled={liked} />
  );


  if (variant === "card") {
    return (
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? `${snap.name} 찜 해제` : `${snap.name} 찜`}
        onClick={() => setLiked(toggleLike(snap))}
        className={`focus-ring z-10 grid size-7 place-items-center rounded-full border border-line bg-white/90 shadow-sm transition-colors hover:border-line-hover ${
          liked ? "text-danger" : "text-faint hover:text-body"
        } ${className}`}
      >
        {heart}
      </button>
    );
  }

  /* 상세 변형 — 구매 버튼(파랑 채움)과 같은 키의 버튼. 하트는 켜기 전에도 빨강으로
     두어 「누르는 자리」임이 보이게 한다 (2026-08-07 · 흰 박스 시인성 지적) */
  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={() => setLiked(toggleLike(snap))}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        liked
          ? "border-danger/40 bg-warn text-danger"
          : "border-line-hover bg-white text-body hover:bg-warn"
      } ${className}`}
    >
      <span className="text-danger">{heart}</span>
      {/* 「찜콩」은 오타가 아니라 팀 지시 문구다 (8/7) — 「찜됨」으로 고치지 말 것 */}
      {liked ? "찜콩" : "찜"}
    </button>
  );
}
