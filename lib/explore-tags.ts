import { OPAQUE_NAMES, products, type Product } from "./data";
import { groupIngredients } from "./ingredient-groups";
import { nutritionStandings } from "./nutrition-grades";

/**
 * 구경 태그 — 3차 전용 (2026-08-07 · meta.tft 태그 리서치 → 팀 승인 1~4).
 *
 * 🔴 **2차에는 올리지 않는다.** 2차 태그는 낱말만으로 서야 하고(거르기),
 *    이 넷은 한 줄 설명이 있어야 뜻이 서는 「구경할만한」 태그다(이해).
 *    설명은 title 툴팁으로 태그에 붙는다 — JS 없이 뜬다.
 *
 * 🔴 전부 기존 데이터의 재조합이다 — 새 판정 없음.
 *    장단 뚜렷   축 등급에 A 와 D 가 공존 (오각형이 찌그러진 별)      98건 (21%)
 *    원재료 단출  신고 종수 카테고리 하위 20% (RTD ≤14 · 파우더 ≤11)  112건 (24%)
 *    단맛 원료 없음  당류·감미료 원료가 신고 목록에 0종               ~29건 (6%)
 *    숨은 강자   단백질 축 A + 쇼핑몰 노출 하위 40%                      ≤46건 (10%)
 *
 * ⚠️ 숨은 강자는 pop ≥ 1 을 요구한다 — pop 0 은 「무명」이 아니라 검색 매칭
 *    실패일 수 있다 (제트맥스 계열이 전부 0으로 잡혔던 실측). 정직한 라벨을 위해
 *    설명에 「쇼핑몰 검색 목록 수 기준」을 그대로 적는다.
 * ⚠️ 단맛 원료 없음은 불명 표기가 하나라도 있으면 안 붙는다 — 「혼합제제」 안에
 *    감미료가 숨을 수 있다 (유당불내증 OK 와 같은 게이트).
 */

export type ExploreTag = { key: string; label: string; desc: string };

/* 원재료 종수 하위 20% 경계 — 카테고리별, 빌드 때 계산 */
const ingCut = new Map<string, number>();
{
  const byCat = new Map<string, number[]>();
  for (const p of products) {
    const arr = byCat.get(p.cat) ?? [];
    arr.push(p.ings.length);
    byCat.set(p.cat, arr);
  }
  for (const [cat, arr] of byCat) {
    arr.sort((a, b) => a - b);
    ingCut.set(cat, arr[Math.floor(arr.length * 0.2)]);
  }
}

/* 쇼핑몰 노출(pop) 하위 40% 경계 — 카테고리별 */
const popCut = new Map<string, number>();
{
  const byCat = new Map<string, number[]>();
  for (const p of products) {
    const arr = byCat.get(p.cat) ?? [];
    arr.push(p.pop);
    byCat.set(p.cat, arr);
  }
  for (const [cat, arr] of byCat) {
    arr.sort((a, b) => a - b);
    popCut.set(cat, arr[Math.floor(arr.length * 0.4)]);
  }
}

export function exploreTagsOf(p: Product): ExploreTag[] {
  const out: ExploreTag[] = [];
  const st = nutritionStandings(p).filter((a) => a.grade != null);

  /* 1) 장단 뚜렷 — 좋은 쪽 극단과 꺼리는 쪽 극단이 한 제품에
        ⚠️ "S" 를 "A" 로 바꿨다 (2026-08-07 · S 폐지). 안 바꾸면 이 조건이
           영원히 거짓이 되어 태그가 조용히 사라진다. */
  if (st.some((a) => a.grade === "A") && st.some((a) => a.grade === "D")) {
    const good = st.filter((a) => a.grade === "A").map((a) => a.label);
    const bad = st.filter((a) => a.grade === "D").map((a) => a.label);
    out.push({
      key: "tradeoff",
      label: "장단 뚜렷",
      desc: `${good.join("·")}은 상위 20%, ${bad.join("·")}은 하위 20% — 성분 밸런스 오각형이 찌그러진 별 모양입니다.`,
    });
  }

  // 2) 원재료 단출 — 신고 종수가 카테고리 하위 20%
  const cut = ingCut.get(p.cat);
  if (cut != null && p.ings.length > 0 && p.ings.length <= cut) {
    out.push({
      key: "few-ings",
      label: "원재료 단출",
      desc: `신고 원재료 ${p.ings.length}종 — 수록 제품에서 적은 쪽 20%입니다 (경계 ${cut}종).`,
    });
  }

  // 3) 단맛 원료 없음 — 당류·감미료 칸이 둘 다 비고, 불명 표기도 없다
  if (p.ings.length > 0 && !p.ings.some((n) => OPAQUE_NAMES.has(n))) {
    const groups = groupIngredients(p.ings);
    const sugar = groups.find((g) => g.key === "sugar");
    const sweet = groups.find((g) => g.key === "sweetener");
    if (sugar?.items.length === 0 && sweet?.items.length === 0) {
      out.push({
        key: "no-sweet",
        label: "단맛 원료 없음",
        desc: "당류도 대체 감미료도 신고 원재료 목록에 없습니다 — 플레인에 가까운 구성입니다.",
      });
    }
  }

  /* 4) 숨은 강자 — 🔴 판정 축을 「종합 S」에서 **「단백질 축 A」**로 바꿨다
        (2026-08-07 · 종합 등급 폐기). 합친 값이 사라졌으니 기댈 축이 하나여야 하고,
        이 서비스가 재는 것은 단백질이다. */
  const pc = popCut.get(p.cat);
  const protA = nutritionStandings(p).find((a) => a.key === "prot")?.grade === "A";
  if (pc != null && p.pop >= 1 && p.pop <= pc && protA) {
    out.push({
      key: "sleeper",
      label: "숨은 강자",
      desc: "1회 단백질이 같은 카테고리 상위 20%인데 쇼핑몰 검색 목록 수는 적은 쪽 40%입니다 — 판매량이 아니라 노출량 기준입니다.",
    });
  }

  return out;
}
