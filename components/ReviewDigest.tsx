"use client";

import { useEffect, useState } from "react";
import { fetchReviewPage, reviewsEnabled } from "@/lib/reviews";

/**
 * 「리뷰 한눈에」 — 화해의 「AI가 분석한 리뷰」 자리 (2026-08-08).
 *
 * 화해는 좋아요/아쉬워요 두 열에 항목별 언급 수를 적는다. 우리는 리뷰 본문을
 * **실제로 세어** 같은 모양을 만든다 — 최근 200건을 받아 문장별 빈도를 매긴다.
 *
 * 🔴 지어내지 않는다. 여기 뜨는 숫자는 전부 **그 제품 리뷰에서 실제로 센 것**이다.
 * ⚠️ 200건 표본이다. 5,151건짜리 제품도 최근 200건만 본다 — 전수를 세려면 집계가
 *    필요한데 PostgREST 집계가 막혀 있다. 표본 수를 화면에 그대로 적는다.
 * ⚠️ 4~5점을 좋아요, 1~2점을 아쉬워요로 가른다. 3점은 어느 쪽도 아니라 뺀다.
 */
const SAMPLE = 200;

export default function ReviewDigest({ productId }: { productId: string }) {
  const [good, setGood] = useState<[string, number][]>([]);
  const [bad, setBad] = useState<[string, number][]>([]);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!reviewsEnabled) return;
    let alive = true;
    void fetchReviewPage(productId, 0, SAMPLE).then((rows) => {
      if (!alive || !rows) return;
      const g = new Map<string, number>();
      const b = new Map<string, number>();
      for (const r of rows) {
        if (!r.body) continue;
        const m = r.rating >= 4 ? g : r.rating <= 2 ? b : null;
        if (!m) continue;
        m.set(r.body, (m.get(r.body) ?? 0) + 1);
      }
      const top = (m: Map<string, number>) =>
        [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 7);
      setGood(top(g));
      setBad(top(b));
      setN(rows.length);
    });
    return () => {
      alive = false;
    };
  }, [productId]);

  if (n === 0 || (good.length === 0 && bad.length === 0)) return null;

  return (
    <div className="card rounded-2xl p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-[27px] text-title">리뷰 한눈에</h2>
        <span className="text-[11.5px] text-faint">최근 {n}건에서 센 것</span>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <Col title="좋아요" tone="good" rows={good} />
        <Col title="아쉬워요" tone="bad" rows={bad} />
      </div>
    </div>
  );
}

function Col({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "good" | "bad";
  rows: [string, number][];
}) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div>
      <p
        className={`text-[13px] font-bold ${tone === "good" ? "text-grade-ink" : "text-danger-ink"}`}
      >
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-faint">표본에 없습니다.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {rows.map(([text, c]) => (
            <li key={text} className="flex items-center gap-2">
              <span className="kr min-w-0 flex-1 truncate text-[12.5px] text-body">{text}</span>
              {/* 막대는 최댓값 기준 — 전체 대비로 잡으면 1위 말고는 다 납작해진다 */}
              <span className="h-[5px] w-14 shrink-0 overflow-hidden rounded-full bg-track">
                <span
                  className={`block h-full rounded-full ${
                    tone === "good" ? "bg-grade-strong" : "bg-danger-strong"
                  }`}
                  style={{ width: `${(c / max) * 100}%` }}
                />
              </span>
              <span className="w-7 shrink-0 text-right text-[11.5px] text-ink-dim tabular-nums">
                {c}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
