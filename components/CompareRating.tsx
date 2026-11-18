"use client";

import { useEffect, useState } from "react";
import { StarOne } from "@/components/Stars";
import { getStats, ratingsEnabled, type Stats } from "@/lib/rating-batch";

/** 비교표의 별점 칸 — 별점만 Supabase 에 있어 열마다 채운다 (배치 조회라 요청 1회) */
export default function CompareRating({ id }: { id: string }) {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    if (!ratingsEnabled) return;
    let alive = true;
    getStats(id).then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, [id]);
  if (!s || s.n === 0) return <span className="text-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <StarOne size={12} />
      <span className="font-bold tabular-nums text-title">{s.avg.toFixed(1)}</span>
      <span className="text-[11.5px] text-ink-dim tabular-nums">({s.n.toLocaleString()})</span>
    </span>
  );
}
