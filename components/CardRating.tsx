"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarOne } from "@/components/Stars";
import { getStats, ratingsEnabled, type Stats } from "@/lib/rating-batch";

/**
 * 목록 카드의 별점 한 줄 — 「★★★★☆ 4.4 (5,151)」 (2026-08-08 · 화해 문법).
 *
 * 🔴 **자리를 미리 비워 두지 않는다.** 별점이 없는 제품이 아직 많은데 빈 줄을 잡아 두면
 *    카드 높이가 들쭉날쭉해 보인다. 값이 오면 그때 한 줄이 생긴다.
 * ⚠️ 서버 렌더링 결과에는 이 줄이 없다 — 첫 렌더가 서버와 같아야 하이드레이션이
 *    안 어긋나므로, 마운트 뒤에 채운다 (LikesBadge·ShareButton 과 같은 규칙).
 * ⚠️ 카드마다 fetch 하지 않는다. lib/rating-batch 가 한 틱 모아 **한 요청**으로 부른다.
 */
export default function CardRating({
  id,
  className = "",
  /** 제품 상세 제목 밑처럼 크게 쓸 때 */
  big,
  /** 있으면 누를 수 있다 — 화해도 제목 밑 별점을 누르면 리뷰로 간다 */
  href,
}: {
  id: string;
  className?: string;
  big?: boolean;
  href?: string;
}) {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    if (!ratingsEnabled) return;
    let alive = true;
    getStats(id).then((v) => {
      if (alive) setS(v);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!s || s.n === 0) return null;

  /* ⚠️ <p> 가 아니라 <span className="flex"> 다 — RankRow·RailCard 가 통째로 <a> 라
     그 안은 전부 span 으로 짜여 있다. 한 곳만 <p> 를 쓰면 마크업이 어긋난다. */
  const inner = (
    <>
      <StarOne size={big ? 17 : 13} />
      <span
        className={`font-bold text-title tabular-nums ${big ? "text-[17px]" : "text-[13.5px]"}`}
      >
        {s.avg.toFixed(1)}
      </span>
      <span
        className={`text-ink-dim tabular-nums ${big ? "text-[15px]" : "text-[12.5px]"}`}
      >
        ({s.n.toLocaleString()})
      </span>
    </>
  );

  if (href) {
    /* 🔴 **해시로 가는 링크는 `<a>` 여야 한다** (2026-08-08 · 「별점을 누르면 이상한
       곳으로 간다」의 나머지 절반). next/link 는 같은 쪽 해시도 `history.pushState`
       로 처리하는데, **pushState 로는 `:target` 이 다시 계산되지 않는다** — 주소만
       `#review` 로 바뀌고 탭은 상품정보에 머물렀다 (실측: hash=#review 인데
       review 패널 display:none). 진짜 fragment navigation 이어야 탭이 바뀐다.
       ⚠️ 탭 막대의 두 칸이 `<a>` 인 것과 같은 사유다 (ProductTabs 주석). */
    const cls = `focus-ring inline-flex items-center gap-1 rounded transition-opacity hover:opacity-70 ${className}`;
    if (href.startsWith("#")) {
      return (
        <a href={href} className={cls}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return <span className={`mt-1 flex items-center gap-1 ${className}`}>{inner}</span>;
}
