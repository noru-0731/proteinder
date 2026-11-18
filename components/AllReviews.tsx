"use client";

import { useCallback, useEffect, useState } from "react";
import RatingSummary from "@/components/RatingSummary";
import Stars from "@/components/Stars";
import {
  ago,
  fetchReviewPage,
  fetchHistogram,
  reviewsEnabled,
  type Review,
  type ReviewStats,
} from "@/lib/reviews";

const PAGE = 30;

/**
 * 전체 리뷰 목록 — 「더 보기」로 이어 붙인다 (2026-08-08).
 *
 * 🔴 **별점으로 거를 수 있다.** 화해가 그렇듯 「1점만 보기」가 실제로 눌리는 필터다 —
 *    좋은 말만 모아 보여주지 않겠다는 뜻이기도 하다.
 * ⚠️ 한 번에 30건. 5,151건짜리 제품을 통째로 받으면 화면이 멈춘다.
 * ⚠️ 필터를 바꾸면 목록을 비우고 처음부터 다시 받는다 — 이어 붙이면 섞인다.
 */
export default function AllReviews({ productId }: { productId: string }) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [list, setList] = useState<Review[]>([]);
  const [star, setStar] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const load = useCallback(
    async (offset: number, filter: number | null, reset: boolean) => {
      setLoading(true);
      const rows = await fetchReviewPage(productId, offset, PAGE, filter ?? undefined);
      setLoading(false);
      if (!rows) {
        setDone(true);
        return;
      }
      setList((prev) => (reset ? rows : [...prev, ...rows]));
      if (rows.length < PAGE) setDone(true);
    },
    [productId],
  );

  useEffect(() => {
    if (!reviewsEnabled) return;
    void fetchHistogram(productId).then(setStats);
  }, [productId]);

  // 별점 필터가 바뀌면 목록을 비우고 처음부터 다시 받는다 — 이어 붙이면 섞인다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 필터 전환 시 초기화가 목적
    setList([]);
    setDone(false);
    void load(0, star, true);
  }, [star, load]);

  if (!reviewsEnabled) return null;

  const counts: Record<number, number> = stats
    ? { 5: stats.r5, 4: stats.r4, 3: stats.r3, 2: stats.r2, 1: stats.r1 }
    : {};

  return (
    <>
      {stats && stats.n > 0 && (
        <div className="card mt-6 rounded-2xl p-6">
          <RatingSummary s={stats} />
        </div>
      )}

      {/* 별점 거르기 — 「전체」 + 5~1 */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setStar(null)}
          className={`focus-ring rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
            star === null
              ? "bg-brand-strong text-on-brand"
              : "border border-line-hover text-body hover:border-brand-strong"
          }`}
        >
          전체{stats ? ` ${stats.n.toLocaleString()}` : ""}
        </button>
        {[5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStar(n)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              star === n
                ? "bg-brand-strong text-on-brand"
                : "border border-line-hover text-body hover:border-brand-strong"
            }`}
          >
            {n}점{counts[n] != null ? ` ${counts[n].toLocaleString()}` : ""}
          </button>
        ))}
      </div>

      <ul className="mt-4">
        {list.map((r) => (
          <li key={r.id} className="border-t border-line py-4 first:border-t-0 first:pt-0">
            <p className="flex items-center gap-2">
              <Stars value={r.rating} size={13} />
              <span className="text-[12px] text-ink-dim">{ago(r.created_at)}</span>
            </p>
            {r.body && (
              <p className="kr mt-1.5 text-[14px] leading-[1.6] text-ink">{r.body}</p>
            )}
          </li>
        ))}
      </ul>

      {list.length === 0 && !loading && (
        <p className="py-8 text-center text-[13px] text-ink-dim">
          {star ? `${star}점 리뷰가 아직 없습니다.` : "아직 리뷰가 없습니다."}
        </p>
      )}

      {!done && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(list.length, star, false)}
          className="focus-ring mt-4 w-full rounded-[10px] border border-line-hover py-3 text-[13.5px] font-semibold text-body transition-colors hover:border-brand-strong hover:text-brand-ink disabled:opacity-50"
        >
          {loading ? "불러오는 중" : "더 보기"}
        </button>
      )}
    </>
  );
}
