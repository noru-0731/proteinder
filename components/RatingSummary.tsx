import Link from "next/link";
import Stars from "@/components/Stars";
import type { ReviewStats } from "@/lib/reviews";

/**
 * 평점 머리 — 화해의 「4.43 ★★★★☆ | 분포 막대」 (2026-08-08).
 *
 * 🔴 왼쪽에 큰 숫자, 세로선, 오른쪽에 5→1 분포 막대. 화해 실측 배치 그대로다
 *    (10_작업/화해레퍼런스/hwahae-detail.png).
 * 🔴 **분포를 그리는 이유** — 평균 4.4 는 「전부 4점」일 수도 「5점과 1점이 섞인 것」일
 *    수도 있다. 이 서비스의 다른 화면(오각형·구간표)이 전부 분포를 보여주는 것과
 *    같은 문법이다. 평균 하나로 뭉개지 않는다.
 * ⚠️ 막대 길이는 **최댓값 기준**이다. 전체 대비로 잡으면 5점이 45% 일 때 나머지 넷이
 *    전부 납작해져 분포가 안 읽힌다.
 */
export default function RatingSummary({
  s,
  href,
}: {
  s: ReviewStats;
  /** 있으면 「전체 리뷰보기」로 잇는다 */
  href?: string;
}) {
  const bars = [
    { star: 5, n: s.r5 },
    { star: 4, n: s.r4 },
    { star: 3, n: s.r3 },
    { star: 2, n: s.r2 },
    { star: 1, n: s.r1 },
  ];
  const max = Math.max(1, ...bars.map((b) => b.n));

  return (
    <div className="flex items-center gap-5">
      <div className="shrink-0 text-center">
        <div className="text-[34px] font-bold leading-[40px] text-title tabular-nums">
          {s.avg.toFixed(1)}
        </div>
        <div className="mt-1 flex justify-center">
          <Stars value={s.avg} size={14} />
        </div>
        <div className="mt-1 text-[12px] text-ink-dim tabular-nums">
          {s.n.toLocaleString()}개
        </div>
      </div>

      <div className="min-w-0 flex-1 border-l border-line pl-5">
        {bars.map((b) => (
          <div key={b.star} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-[11.5px] text-ink-dim tabular-nums">
              {b.star}점
            </span>
            <span className="h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-track">
              <span
                className="block h-full rounded-full bg-amber"
                style={{ width: `${(b.n / max) * 100}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-[11px] text-faint tabular-nums">
              {b.n.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {href && (
        <Link
          href={href}
          className="focus-ring hidden shrink-0 rounded-md px-2 py-1 text-[12.5px] font-semibold text-ink-sub sm:block"
        >
          전체 보기 ›
        </Link>
      )}
    </div>
  );
}
