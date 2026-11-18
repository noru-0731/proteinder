"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RatingSummary from "@/components/RatingSummary";
import {
  ago,
  fetchReviews,
  fetchHistogram,
  postReview,
  reviewsEnabled,
  summarize,
  type Review,
  type ReviewStats,
} from "@/lib/reviews";

/**
 * 리뷰 칸 — 제품 상세.
 *
 * 🔴 **없으면 없다고 적는다.** 「아직 리뷰가 없습니다」이고, 예시를 채워 넣지 않는다.
 * 🔴 **불러오기 실패와 리뷰 없음을 갈라 적는다** — 표가 아직 없는 것과 아무도 안 쓴
 *    것은 다른 사실이다. 전자는 우리 사정이라 화면에 변명을 길게 쓰지 않고
 *    「지금은 불러올 수 없습니다」까지만.
 * ⚠️ 한 브라우저에서 같은 제품에 한 번만 — 시연 중 연타로 별점이 부풀지 않게.
 *    로그인이 없으니 이것이 우리가 걸 수 있는 유일한 문턱이다.
 */
export default function Reviews({ productId }: { productId: string }) {
  const [list, setList] = useState<Review[] | null>(null);
  /* 전체 개수·평균 — 목록(최근 20건)과 다른 값이다. 뷰가 없으면 null */
  const [stats, setStats] = useState<ReviewStats | null>(null);
  /* env 가 없으면 애초에 부를 곳이 없다 — 「불러오는 중」을 거치지 않는다 */
  const [loaded, setLoaded] = useState(!reviewsEnabled);
  const [mine, setMine] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const guard = `ptd.reviewed.${productId}`;

  const load = useCallback(async () => {
    const [rows, st] = await Promise.all([fetchReviews(productId), fetchHistogram(productId)]);
    setList(rows);
    setStats(st);
    setLoaded(true);
  }, [productId]);

  useEffect(() => {
    if (!reviewsEnabled) return;
    try {
      // 마운트 1회 localStorage 복원. 서버에는 localStorage 가 없어 첫 렌더는 반드시
      // 「아직 안 남김」이어야 하이드레이션이 어긋나지 않는다 — useState 초기값으로
      // 옮길 수 없는 자리다 (app/ 에서도 같은 사유로 억제했다).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 사유
      if (localStorage.getItem(guard)) setMine(true);
    } catch {
      /* 사생활 보호 모드 — 문턱만 포기한다 */
    }
    void load();
  }, [guard, load]);

  if (!reviewsEnabled) return null;
  /* 🔴 **불러오기 전에는 아무것도 그리지 않는다.** 서버에서 껍데기를 그려 두면
     표가 없을 때 「리뷰 칸이 떴다가 사라지는」 화면이 된다 — 실패를 오히려
     크게 보여주는 꼴이다. 성공했을 때만 나타난다.
     ⚠️ 표를 만들면 재배포 없이 이 칸이 저절로 켜진다.
     ⚠️ 그래서 이 칸은 SSR 결과물에 없다. 리뷰는 부가 정보라 검색 노출을 포기해도 된다. */
  if (!loaded || list === null) return null;

  /* 🔴 뷰가 있으면 전체 집계를, 없으면 옛 방식(최근 20건)으로 물러선다.
     20건을 넘는 제품에서 「20개」로 찍히던 자리다 (lib/reviews.ts fetchStats 주석). */
  const sum = stats ?? (list ? summarize(list) : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || sending) return;
    setSending(true);
    const ok = await postReview(productId, rating, body);
    setSending(false);
    if (!ok) {
      setFailed(true);
      return;
    }
    try {
      localStorage.setItem(guard, "1");
    } catch {
      /* 저장만 포기 */
    }
    setMine(true);
    setRating(0);
    setBody("");
    await load();
  }

  return (
    /* 🔴 카드 껍데기가 **이 안에** 있다. 표가 없거나 env 가 비면 위에서 null 을
       돌려주는데, 껍데기가 부르는 쪽에 있으면 그때 빈 카드만 덩그러니 남는다.
       ⚠️ 옛 app3(600px 한 컬럼) 때의 `px-5 pt-6` 는 걷어냈다 — ver1 제품 상세의
          다른 구획과 같은 `.card rounded-2xl p-6` 을 쓴다. */
    <section id="sec-reviews" className="card rounded-2xl p-6">
      {/* 🔴 화해 문법 — 제목이 「리뷰 95,027」처럼 **개수를 품는다** (2026-08-08).
          별점·개수를 따로 흩지 않고 제목 한 줄에서 끝낸다 */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-[27px] text-title">
          리뷰{" "}
          {sum && sum.n > 0 && (
            <span className="tabular-nums text-ink">{sum.n.toLocaleString()}</span>
          )}
        </h2>
        {sum && sum.n > 0 && (
          <Link
            href={`/product/${encodeURIComponent(productId)}/reviews`}
            className="focus-ring rounded text-[12.5px] font-semibold text-ink-sub"
          >
            전체 리뷰보기 ›
          </Link>
        )}
      </div>

      {/* 🔴 평점 요약 — 큰 평균 + 별 + 5→1 분포 막대 (화해 실측 배치).
          ⚠️ 뷰(review_stats)가 없으면 히스토그램이 0 이라 안 그린다 — 평균만으로
             막대를 지어내지 않는다 (원칙 1). */}
      {sum && sum.n > 0 && "r5" in sum && (
        <div className="mt-4 rounded-[10px] bg-bg px-4 py-4">
          <RatingSummary s={sum as ReviewStats} />
        </div>
      )}

      <p className="kr mt-3 text-[12.5px] leading-[1.6] text-ink-sub">
        먹어 본 사람이 남긴 것입니다. 이 화면의 다른 숫자는 전부 신고값이지만,
        여기만은 우리가 잰 것이 아닙니다.
      </p>

      {/* ── 남기기 ── */}
      {mine ? (
        <p className="mt-4 rounded-[8px] bg-bg px-4 py-3 text-[13px] text-ink-sub">
          이 브라우저에서 이미 리뷰를 남겼습니다. 고맙습니다.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 rounded-[10px] bg-bg px-4 py-4">
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">별점</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}점`}
                aria-pressed={rating === n}
                className="focus-ring rounded p-0.5"
              >
                <Star filled={n <= rating} size={26} />
              </button>
            ))}
            <span className="ml-1 text-[13px] text-ink-dim">
              {rating ? `${rating}점` : "별점을 골라 주세요"}
            </span>
          </fieldset>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={140}
              placeholder="한 줄 남기기 (선택)"
              aria-label="한 줄 리뷰"
              className="focus-ring min-w-0 flex-1 rounded-[8px] border border-line-strong bg-card px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-dim"
            />
            <button
              type="submit"
              disabled={!rating || sending}
              className="focus-ring rounded-[8px] bg-flame-deep px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {sending ? "남기는 중" : "남기기"}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-dim">
            {body.length}/140 · 로그인이 없어 누가 썼는지 남지 않고, 한 번 남기면 지울 수 없습니다.
          </p>
          {failed && (
            <p className="mt-1.5 text-[12.5px] text-red">
              지금은 남길 수 없습니다. 잠시 뒤 다시 시도해 주세요.
            </p>
          )}
        </form>
      )}

      {/* ── 목록 ── */}
      {/* ⚠️ 목록은 최근 20건까지만 그린다. 5,000건짜리 제품에서 전부 그리면
          화면이 안 끝난다 — 개수·평균은 위 머리줄이 전체 기준으로 말한다. */}
      <div className="mt-5">
        {list.length === 0 ? (
          <p className="py-4 text-[13px] text-ink-dim">
            아직 리뷰가 없습니다. 첫 리뷰를 남겨 보세요.
          </p>
        ) : (
          <ul>
            {list.map((r) => (
              <li key={r.id} className="border-t border-line py-3.5 first:border-t-0 first:pt-0">
                <p className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-[12px] text-ink-dim">{ago(r.created_at)}</span>
                </p>
                {r.body && (
                  <p className="kr mt-1.5 text-[14px] leading-[1.6] text-ink">{r.body}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {/* 🔴 목록이 잘렸다는 사실을 화면이 말한다. 머리줄은 「1,204개」인데 아래에
            20개만 있으면 나머지가 어디 갔는지 알 수 없다 (원칙 5 와 같은 결). */}
        {sum && sum.n > list.length && (
          <p className="mt-2 border-t border-line pt-3 text-[12px] text-ink-dim">
            전체 {sum.n.toLocaleString()}개 가운데 최근 {list.length}개만 보여드립니다.
          </p>
        )}
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= value} size={14} />
      ))}
    </span>
  );
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path
        d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.48l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z"
        fill={filled ? "var(--amber)" : "var(--track)"}
        stroke={filled ? "var(--amber)" : "var(--line-strong)"}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
