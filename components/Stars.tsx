/**
 * 별 다섯 개 — 화해 문법 (2026-08-08).
 *
 * 🔴 **반 칸을 그린다.** 4.43 을 별 4개로 반올림해 그리면 4.4 와 4.6 이 화면에서
 *    같아진다. 화해도 부분 채움이다 — clipPath 로 폭을 잘라 채운다.
 * ⚠️ 서버·클라이언트 양쪽에서 쓰므로 "use client" 를 붙이지 않는다 (순수 SVG).
 * ⚠️ clipPath id 가 한 화면에 여러 개면 충돌한다 — value 와 size 로 키를 만든다.
 */
/**
 * 🔴 **별 하나 + 숫자** — 화해의 목록/제목 문법 (2026-08-08 · 팀 지시 "깔끔하게").
 *    화해 랭킹 카드도 제품 상세 제목 밑도 전부 `★ 4.61 (84,781)` 한 덩어리다.
 *    별 다섯 개는 **개별 리뷰 한 건**에만 쓴다 — 거기서는 몇 점인지가 곧 내용이지만,
 *    목록에서는 숫자가 이미 그 일을 하고 별 다섯은 자리만 먹는다.
 * ⚠️ 부분 채움을 쓰지 않는다. 별 하나짜리는 채우거나 말거나라 4.1 과 4.6 이
 *    구분되지 않는데, 그 구분은 **옆의 숫자가 맡는다.**
 */
export function StarOne({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="shrink-0">
      <path
        d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.48l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z"
        className="fill-amber"
      />
    </svg>
  );
}

export default function Stars({
  value,
  size = 13,
}: {
  /** 0~5. 소수 그대로 넣는다 */
  value: number;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100;
  const uid = `st${Math.round(pct * 10)}-${size}`;
  const w = size * 5 + 4 * (size * 0.12);

  const path =
    "M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.48l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z";

  return (
    <svg
      width={w}
      height={size}
      viewBox={`0 0 ${100 + 4 * 12} 20`}
      aria-label={`5점 만점에 ${Math.round(value * 10) / 10}점`}
      className="shrink-0"
    >
      <defs>
        <clipPath id={uid}>
          <rect x="0" y="0" width={`${pct * 1.48}%`} height="20" />
        </clipPath>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={`b${i}`} d={path} transform={`translate(${i * 32} 0)`} className="fill-track" />
      ))}
      <g clipPath={`url(#${uid})`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={`f${i}`}
            d={path}
            transform={`translate(${i * 32} 0)`}
            className="fill-amber"
          />
        ))}
      </g>
    </svg>
  );
}
