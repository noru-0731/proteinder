"use client";

import { useEffect, useState } from "react";
import { getStats, ratingsEnabled } from "@/lib/rating-batch";

/**
 * 「리뷰 128」 의 숫자 (2026-08-08 · 팀 지시 「탭이 존재감을 드러내야 한다」).
 *
 * 🔴 **요청이 늘지 않는다.** 같은 쪽의 제목 밑 별점(`CardRating`)이 이미
 *    `getStats(id)` 를 부르고 있고, `lib/rating-batch` 가 한 틱을 모아 **한 요청**으로
 *    묶는다 — 이 부품은 그 캐시에 얹힌다.
 * ⚠️ 0 이면 아무것도 안 그린다. 「리뷰 0」은 탭 이름이 아니라 빈 상태의 말이고,
 *    그건 패널 안이 이미 적는다.
 * ⚠️ 서버 렌더링에는 이 숫자가 없다 — 첫 렌더가 서버와 같아야 하이드레이션이
 *    안 어긋난다 (카드 별점과 같은 규칙).
 */
export default function ReviewCount({ id }: { id: string }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!ratingsEnabled) return;
    let alive = true;
    getStats(id).then((s) => {
      if (alive) setN(s?.n ?? 0);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!n) return null;
  return <span className="ptab-count tabular-nums">{n.toLocaleString()}</span>;
}
