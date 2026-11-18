import { products, type Product } from "./data";
import { servValue } from "./axes";
import { byRank, sane } from "./filters";
import { CATEGORIES, sampleOf } from "./categories";

/* ══════════════════════════════════════════════════════════════════════
   비슷한 제품 — 「무엇이 비슷한가」를 다시 정의한다 (2026-08-08 · 팀 지시).

   ── 전에 쓰던 것
       같은 카테고리에서 **`prot` 절댓값 차이**가 작은 순으로 6개.

   ── 그게 왜 안 됐나 (실측)
     🔴 **`prot` 은 신고 기준량당 값이라 이 화면의 다른 숫자와 단위가 다르다.**
        화면은 전부 1회 기준(`packLabel`)으로 적는데 이웃만 100ml/100g 당으로
        골랐다. 450ml 한 병과 190ml 한 병이 「100ml당 13g」으로 같다고 묶였다.
     🔴 **축이 하나라 단백질만 같으면 무엇이든 이웃이 된다.** 8/6 리뷰의
        「비슷한 제품이 단백질 근접만 봐서 미음(죽)류가 이웃으로 뜬다」가 이 자리다.
        열량이 3배 차이 나도, 당류가 0g 대 20g 이어도 걸러지지 않았다.
     🔴 **같은 브랜드가 자리를 다 먹었다.** 랩노쉬 맥스 초코/딸기처럼 맛만 다른
        제품이 여섯 칸 중 넷을 채우면 「비슷한 제품」이 아니라 「같은 제품 맛 목록」이다.

   ── 지금 재는 것
       같은 카테고리 안에서 **1회 기준 다섯 축의 거리** + 원료 계통이 겹치는 만큼 가산.

     축 가중은 종합 등급이 쓰는 것과 같다 (AXIS_WEIGHT · 8/7 정합성 검사).
       단백질 1 · 칼로리 1 · 지방 1 · 당류 0.5 · 탄수화물 0.5
     당류·탄수는 상관 +0.82 라 한 성질이 두 표를 행사하지 않게 반 표씩 나눠 갖는다.

   🔴 **추천이 아니라 이웃이다.** 「이게 더 낫다」고 말하지 않는다 — 같은 자리에서
      견줄 만한 제품을 옆에 놓을 뿐이고, 좋고 나쁨은 화면이 이미 적은 등급이 말한다.
   ⚠️ **카테고리를 섞지 않는다.** 1병과 1회분 30g 은 단위가 다르다.
   ⚠️ **축은 카테고리 안에서 표준화한다.** 단백질 g 과 칼로리 kcal 을 그냥 빼면
      숫자가 큰 칼로리가 거리를 독점한다. 축마다 그 카테고리의 산포로 나눈다.
   ══════════════════════════════════════════════════════════════════════ */

const AXES = [
  { key: "prot", w: 1 },
  { key: "kcal", w: 1 },
  { key: "fat", w: 1 },
  { key: "sugar", w: 0.5 },
  { key: "carb", w: 0.5 },
] as const;

/** 한 브랜드가 자리를 다 먹지 않게 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 옛 잣대(5축 거리)가 쓰던 값. 되돌릴 때 함께 산다
const MAX_PER_BRAND = 2;

/**
 * 축별 산포 — 카테고리 안 표준편차.
 * ⚠️ 0 이 나올 수 있다 (그 축을 신고한 제품이 하나뿐인 카테고리). 그때는 그 축을 버린다.
 */
const spread = new Map<string, number>();
for (const cat of new Set(products.map((p) => p.cat))) {
  const inCat = products.filter((p) => p.cat === cat);
  for (const a of AXES) {
    const vs = inCat.map((p) => servValue(p, a.key)).filter((v): v is number => v != null);
    if (vs.length < 2) continue;
    const m = vs.reduce((s, v) => s + v, 0) / vs.length;
    const sd = Math.sqrt(vs.reduce((s, v) => s + (v - m) ** 2, 0) / vs.length);
    if (sd > 0) spread.set(`${cat}|${a.key}`, sd);
  }
}

/** 원료 계통이 얼마나 겹치나 (0~1) — 자카드 */
function codeOverlap(a: Product, b: Product): number {
  if (!a.codes.length || !b.codes.length) return 0;
  const A = new Set(a.codes);
  let hit = 0;
  for (const c of new Set(b.codes)) if (A.has(c)) hit++;
  const union = new Set([...a.codes, ...b.codes]).size;
  return union ? hit / union : 0;
}

/**
 * 두 제품의 거리. 작을수록 이웃이다.
 * `null` 이면 견줄 축이 하나도 없어 이웃으로 세울 수 없다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 옛 잣대(5축 거리). 아래 주석 참조
function distance(p: Product, q: Product): number | null {
  let sum = 0;
  let used = 0;
  for (const a of AXES) {
    const sd = spread.get(`${p.cat}|${a.key}`);
    if (!sd) continue;
    const va = servValue(p, a.key);
    const vb = servValue(q, a.key);
    if (va == null || vb == null) continue;
    sum += a.w * Math.abs(va - vb) / sd;
    used += a.w;
  }
  /* 🔴 축이 절반도 안 겹치면 거리라고 부를 수 없다 — 「단백질만 신고된 제품」이
     한 축 차이 0으로 1위가 되던 자리다. */
  const total = AXES.reduce((s, a) => s + a.w, 0);
  if (used < total / 2) return null;

  /* 평균 거리로 되돌린 뒤, 원료가 겹치는 만큼 당긴다. 최대 0.5 — 축을 뒤집을 만큼
     크면 「같은 원료면 무조건 이웃」이 되어 영양이 전혀 다른 제품이 올라온다 */
  return sum / used - 0.5 * codeOverlap(p, q);
}

/* ══════════════════════════════════════════════════════════════════════
   🔴 **잣대를 바꿨다 — 이제 「같은 카테고리 랭킹 순서」다** (2026-08-08 · 팀 지시).

   위의 다섯 축 거리 계산(`distance`)은 **더 이상 이 함수가 쓰지 않는다.** 지우지 않고
   둔 것은 되돌릴 수 있게 하려는 것이고, 그때 왜 그렇게 짰는지가 위 주석에 다 있다.

   왜 바꿨나 — 이 칸에서 실제로 하는 일이 **비교 상대 고르기**이기 때문이다.
   옆에 「비교」 버튼이 붙어 있고, 사람이 견주고 싶어 하는 것은 「영양이 닮은 제품」이
   아니라 **같은 카테고리에서 나란히 오르내리는 제품**이다. 랭킹 순서를 그대로
   물려주면 이 화면에 새 잣대가 하나 줄고, 랭킹 탭과 어휘도 어긋나지 않는다.

   ⚠️ 이 제품이 랭킹(표본 30)에 없으면 그 카테고리 랭킹 **위에서부터** 채운다.
   ⚠️ 끝에 닿으면 처음으로 돌아간다 — 30위 제품도 여섯 칸이 빈 채로 뜨지 않게.
   ══════════════════════════════════════════════════════════════════════ */

/** 데이터의 cat 값 → 카테고리 키 */
const CAT_KEY = new Map(
  CATEGORIES.filter((c) => c.data).map((c) => [c.data as string, c.key]),
);

export function similarTo(p: Product, n = 6): Product[] {
  const key = CAT_KEY.get(p.cat);
  if (!key) return [];
  const ranked = byRank(sane(sampleOf(key)));
  const i = ranked.findIndex((x) => x.id === p.id);
  /* 이 제품 다음부터. 끝나면 앞으로 돌아간다 */
  const ordered = i >= 0 ? [...ranked.slice(i + 1), ...ranked.slice(0, i)] : ranked;
  return ordered.filter((x) => x.id !== p.id).slice(0, n);
}
