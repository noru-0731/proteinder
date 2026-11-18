import type { Product } from "@/lib/data";
import { nutritionStandings } from "@/lib/nutrition-grades";

/**
 * 비교 표의 **미니 오각형** (2026-08-08 · 팀 지시 「다른 도형이나 지표를 활용」).
 *
 * 🔴 숫자 표는 **행으로는 읽히는데 열로는 안 읽힌다.** 「단백질 22g」과 「칼로리 180kcal」을
 *    위아래로 봐도 「이 제품이 어떤 물건인가」가 안 잡힌다 — 그건 다섯 축을 한꺼번에
 *    봐야 나오는 것이고, 그러라고 만든 도형이 제품 상세의 오각형이다.
 *    같은 도형을 표 안에 작게 넣으면 **열마다 모양이 달라 한눈에 갈린다.**
 *
 * 🔴 상세의 `NutritionRadar` 를 줄인 것이 아니라 **다시 그렸다.** 그쪽은 300×236 에
 *    축 라벨·등급 점 네 개까지 그리는데, 84px 로 줄이면 글자가 뭉개진다.
 *    여기서는 **모양만** 그리고 축 이름은 행 머리가 한 번 말한다.
 *
 * ⚠️ 축 차례와 방향은 상세와 **똑같다** — 위(12시)가 단백질, 시계방향으로 칼로리·당류·
 *    탄수화물·지방. 두 화면에서 같은 제품이 다른 모양이면 도형을 믿을 수 없다.
 * ⚠️ **바깥일수록 「흔히 반기는 쪽」이지 좋은 제품이 아니다** (원칙 7). 각주에 적는다.
 * ⚠️ 모수가 얕아 등급이 하나도 없는 카테고리(쿠팡 5종)는 `score` 가 전부 0 이라
 *    **찌그러진 별**이 된다 — 그리면 「나쁜 제품」으로 읽히므로 아예 안 그린다.
 */

/** 축 값이 없어도 오각형이 무너지지 않게 바닥 반지름을 둔다 (상세와 같은 값) */
const FLOOR = 0.13;

const S = 96; // 그림 한 변
const C = S / 2;
const R = 38; // 바깥 링 반지름 — 테두리 글자가 없어 여백을 덜 준다

const pt = (i: number, r: number): [number, number] => {
  const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return [C + r * Math.cos(ang), C + r * Math.sin(ang)];
};

const ring = (r: number) =>
  Array.from({ length: 5 }, (_, i) => pt(i, r).map((v) => v.toFixed(1)).join(",")).join(" ");

const shape = (p: Product) =>
  nutritionStandings(p)
    .map((a, i) => pt(i, R * (FLOOR + (1 - FLOOR) * a.score)))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

/**
 * @param others 같이 견주는 나머지 제품 — **윤곽만 겹쳐 그린다.**
 *
 * 🔴 모양 하나만 그려서는 비교가 안 된다. 실화면에서 두 오각형이 나란히 있었는데
 *    둘 다 작아서 **거의 같아 보였다** — 눈이 두 그림을 왕복하며 꼭짓점을 재야 했다.
 *    상대의 윤곽을 같은 자리에 점선으로 얹으면 **벌어진 틈이 곧 차이**가 된다.
 * ⚠️ 상대 윤곽은 회색 점선이다. 색을 주면 어느 쪽이 나은지를 말하게 된다 (원칙 7).
 */
export default function CompareShape({ p, others = [] }: { p: Product; others?: Product[] }) {
  const st = nutritionStandings(p);
  if (st.every((a) => a.grade == null))
    return <span className="text-[11.5px] text-ink-dim">분포 미산출</span>;

  const poly = shape(p);
  const ghosts = others
    .filter((o) => nutritionStandings(o).some((a) => a.grade != null))
    .map((o) => ({ id: o.id, pts: shape(o) }));

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={S}
      height={S}
      role="img"
      aria-label={`성분 밸런스 — ${st.map((a) => `${a.label} ${a.grade ?? "미산출"}`).join(", ")}`}
      className="mx-auto block"
    >
      {/* 바깥 링 둘 — 100%·50% 자리를 알려 준다. 이게 없으면 모양이 큰지 작은지 모른다 */}
      <polygon points={ring(R)} className="fill-track stroke-line-strong" strokeWidth={1} />
      <polygon points={ring(R * 0.5)} className="fill-none stroke-line-strong" strokeWidth={1} />
      {/* 살 다섯 */}
      {st.map((a, i) => {
        const [x, y] = pt(i, R);
        return (
          <line
            key={a.key}
            x1={C}
            y1={C}
            x2={x}
            y2={y}
            className="stroke-line-strong"
            strokeWidth={1}
          />
        );
      })}
      {/* 나머지 제품의 윤곽 — 회색 점선. 벌어진 틈이 곧 차이다 */}
      {ghosts.map((g) => (
        <polygon
          key={g.id}
          points={g.pts}
          className="fill-none stroke-ink-dim"
          strokeWidth={1}
          strokeDasharray="3 2"
          strokeLinejoin="round"
          opacity={0.55}
        />
      ))}
      {/* 🔴 면은 시그니처색 옅게 · 선은 진하게. 등급 사다리 색(파랑)을 쓰지 않는다 —
          다섯 축이 섞인 모양이라 어느 한 등급의 색을 입히면 그 등급처럼 읽힌다 */}
      <polygon
        points={poly}
        className="fill-flame/25 stroke-flame-deep"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {st.map((a, i) => {
        const [x, y] = pt(i, R * (FLOOR + (1 - FLOOR) * a.score));
        return <circle key={a.key} cx={x} cy={y} r={1.8} className="fill-flame-deep" />;
      })}
    </svg>
  );
}
