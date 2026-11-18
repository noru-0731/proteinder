import type { Product } from "@/lib/data";
import { nutritionStandings, type Grade } from "@/lib/nutrition-grades";

/**
 * 성분 밸런스 오각형 — 100ml/100g당 다섯 축의 분포 위치를 한 번에 (팀 요청 · op.gg/전적 문법).
 *
 * 순수 SVG 서버 렌더링 — JS·하이드레이션 없음 (시연 안정성이 설계 제약).
 * 꼭짓점 반지름 = 좋은 쪽 비율(score). 바깥일수록 흔히 반기는 쪽이다.
 * 등급 글자는 축 라벨 옆에 칩으로 — S(파랑 진하게) ~ D(빨강).
 */

/** 축 값이 없어도 오각형이 무너지지 않게 바닥 반지름을 둔다 */
const FLOOR = 0.13;

/** 등급 점 네 개의 간격 */
const DOT_GAP = 7;

/* 🔴 금(S)을 걷어냈다 (2026-08-07 · 종합 등급 폐기와 같은 결정) — 배지와 같은 사다리:
   A 파랑 > B 연파랑 > C 주황 > D 빨강. 최고 등급이 튀지 않는 것이 보수적 표기다.
   글자는 흰 배경 위라 잉크 토큰을 쓴다. */
/* 🔴 A·B 가 `--brand-*` 였다 (2026-08-08 수정 · 배지와 같은 사유). 주석은 「파랑」인데
   app3 에서는 그게 분홍으로 흘러, 오각형의 등급 글자와 다섯 축 그물이 브랜드색이었다.
   사다리 전용 토큰으로 바꾼다 — 배지·오각형·분포 곡선이 다시 한 사다리를 쓴다. */
const GRADE_CLS: Record<Grade, string> = {
  A: "fill-grade-strong font-bold", // 파랑 채움 배지와 같은 색 (흰 배경 4.84:1)
  B: "fill-grade-ink font-semibold",
  C: "fill-caution-ink font-semibold",
  D: "fill-danger-ink font-bold",
};

export default function NutritionRadar({ p }: { p: Product }) {
  const st = nutritionStandings(p);
  if (st.every((a) => a.grade == null)) return null;

  const CX = 150;
  const CY = 118;
  const R = 78;

  const pt = (i: number, r: number): [number, number] => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
  };
  const ring = (r: number) =>
    Array.from({ length: 5 }, (_, i) => pt(i, r).map((v) => v.toFixed(1)).join(","))
      .join(" ");

  const poly = st
    .map((a, i) => pt(i, R * (FLOOR + (1 - FLOOR) * a.score)))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  /* 라벨 위치 — 꼭짓점 바깥. 위(0)는 위로, 아래 둘(2·3)은 아래로 밀어 겹침을 피한다 */
  const LABEL_R = R + 16;

  return (
    <svg
      viewBox="0 0 300 236"
      role="img"
      aria-label={`성분 밸런스 — ${st
        .map((a) => `${a.label} ${a.grade ?? "미신고"}`)
        .join(", ")}`}
      className="mx-auto block w-full max-w-[300px]"
    >
      {/* 눈금 4겹 + 축선 */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={ring(R * f)}
          fill="none"
          className="stroke-line"
          strokeWidth={f === 1 ? 1.2 : 1}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => {
        const [x, y] = pt(i, R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            className="stroke-line"
            strokeWidth={0.7}
          />
        );
      })}

      {/* 값 폴리곤 */}
      {/* 🔴 그물도 사다리 파랑이다 — 이 도형이 그리는 것이 다섯 축의 등급이라
            브랜드색이면 「브랜드가 그린 그림」으로 읽힌다 (2026-08-08) */}
      <polygon points={poly} className="fill-grade-strong/15 stroke-grade-strong" strokeWidth={1.8} />
      {st.map((a, i) => {
        const [x, y] = pt(i, R * (FLOOR + (1 - FLOOR) * a.score));
        return <circle key={a.key} cx={x} cy={y} r={2.4} className="fill-grade-strong" />;
      })}

      {/* 축 라벨 + 등급 + 점 네 개 */}
      {st.map((a, i) => {
        const [x, y] = pt(i, LABEL_R);
        const anchor = i === 0 ? "middle" : i < 3 ? "start" : "end";
        const dy = i === 0 ? -4 : i === 2 || i === 3 ? 12 : 4;
        /* 🔴 등급 글자 아래에 점 네 개 (2026-08-08 · 드링크메모 테이스팅 노트 문법).
           A●●●● B●●● C●● D● — **글자를 못 읽어도 개수로 읽힌다.**
           ⚠️ 점 줄은 라벨과 **같은 쪽으로** 정렬해야 한다. 앵커를 무시하고 가운데
              정렬하면 왼쪽 축(지방·탄수화물)에서 점이 글자를 덮는다. */
        const filled = a.grade ? { A: 4, B: 3, C: 2, D: 1 }[a.grade] : 0;
        const span = 3 * DOT_GAP;
        const x0 = anchor === "middle" ? x - span / 2 : anchor === "start" ? x : x - span;
        return (
          <g key={a.key}>
            <text
              x={x}
              y={y + dy}
              textAnchor={anchor}
              className="fill-muted text-[11px] font-medium"
            >
              {a.label}{" "}
              <tspan className={`text-[12px] ${a.grade ? GRADE_CLS[a.grade] : "fill-faint"}`}>
                {a.grade ?? "—"}
              </tspan>
            </text>
            {a.grade &&
              Array.from({ length: 4 }, (_, j) => (
                <circle
                  key={j}
                  cx={x0 + j * DOT_GAP}
                  cy={y + dy + 10}
                  r={2.5}
                  className={j < filled ? GRADE_CLS[a.grade!] : "fill-track stroke-line-strong"}
                  strokeWidth={j < filled ? 0 : 0.8}
                />
              ))}
          </g>
        );
      })}
    </svg>
  );
}
