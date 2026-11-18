import { isEnergyConsistent, products, type Product } from "./data";
import { disclosureOf } from "./disclosure";

/* ══════════════════════════════════════════════════════════════════════
   카드 배지 — 🔴 **극단만 적는다. 등급 문자를 쓰지 않는다**
   ══════════════════════════════════════════════════════════════════════

   ❌ 폐기 — A·B·C·D 등급 (프로틴랩 방식). 두 가지가 걸렸다.
      ① **네 글자가 방향을 안 말한다.** 「당류 A」가 많다는 뜻인지 적다는 뜻인지
         읽는 사람이 알 수 없어 규칙을 하나 더 외워야 했다.
      ② 곧이곧대로 베낀 모양이 됐다.

   ✅ 채택 — **「단백질 상위 20%」 꼴.** 「상위」는 **값이 큰 쪽**이라는 뜻이다.

   🔴 **중간은 적지 않는다.** 「단백질 상위 47%」는 배지가 아니라 소음이다.
      상·하위 20% 안에 드는 것만 붙인다 — 그래야 배지가 읽을 값이 된다.

   🔴 **색으로 방향을 표시한다** (2026-08-06). 이 파일은 원래
      *"우리는 어느 쪽이 좋다고 말하지 않는다"* 고 적고 있었다. 그 자리를 바꾼다 —
      **파랑은 흔히 반기는 쪽, 빨강은 꺼리는 쪽**이다. op.gg 가 「더블 킬」을 빨강으로,
      「멈출 수 없는」을 초록으로 칠하는 것과 같은 방식이다.

      ⚠️ **바뀐 것은 색뿐이고 문구는 그대로 위치 진술이다.** 「당류 상위 20%」는
         여전히 「당류가 많은 쪽 20%에 든다」는 사실이고, 우리는 그게 몸에
         나쁘다고 말하지 않는다 (원칙 7). `/grades` 에 이 문장을 그대로 적어 뒀다.

   🔴 **수치를 배지 안에 넣지 않는다** (2026-08-06). 전에는 「당류 하위 20% · 0g」처럼
      배지 안에 값을 달았는데, 배지가 길어져 한 줄에 두 개가 안 들어갔다.
      값은 **바로 윗줄 영양 줄**(`단백질 20g · 150kcal · 당류 3g`)이 전부 맡는다 —
      숫자를 감춘 게 아니라 한 곳으로 모은 것이다.

   ⚠️ **칼로리는 RTD 에만 붙인다.** 파우더 1회분 30g 의 열량은 제품이 아니라
      **가루의 무게**가 정한다 — 중앙 113kcal 에 88%가 120 이하다.
      CLAUDE.md 가 「저열량」 태그를 RTD 전용으로 둔 것과 같은 이유다.

   ⚠️ **나트륨은 축이 아니다.** 신고값은 영양성분 표에만 둔다.

   실측 (2026-08-06)
     RTD   단백질 상위53/하위52 · 당류 상위56/하위79 · 칼로리 상위53/하위53
     파우더 단백질 상위78/하위92 · 당류 상위83/하위97
*/

/** 상·하위 몇 %까지를 「극단」으로 볼 것인가. 우리가 정한 값이다 */
export const EDGE_PCT = 20;

/**
 * 🔴 **단백질 비중 — 열량 가운데 단백질이 차지하는 몫** (2026-08-06 추가).
 *
 * 「1병에 몇 g 인가」(protPack)와 **다른 것을 잰다.** 앞은 양이고 이건 농도도 아닌
 * **구성**이다 — 이 음료가 단백질 음료인지, 단백질이 조금 든 단맛 음료인지.
 *
 * ⚠️ **RTD 에만 붙인다.** 파우더는 1회분이 30g 고정이라 비중이 순도의 상수배가 된다 —
 *    실측에서 파우더는 「단백질 상위 20%」 78건 중 **72건이 이 배지와 겹쳤다.**
 *    RTD 는 겹침이 19건뿐이라 새 정보를 준다.
 *
 * ⚠️ 단백질 1g = 4kcal 는 우리가 정한 값이 아니라 `isEnergyConsistent()` 가
 *    이미 쓰고 있는 상수다. 앞뒤가 안 맞는 신고 레코드는 그 함수로 걸러낸다.
 * ⚠️ 100% 를 넘는 값이 나온다 (최대 102.4%). 신고값 반올림 때문이며 자르지 않는다 —
 *    자르면 1위 여러 건이 동점이 되어 오히려 순위가 뭉갠다.
 */
function proteinShareOf(p: Product): number | null {
  if (!isEnergyConsistent(p)) return null;
  return (p.prot! * 4) / p.kcal! * 100;
}

/** 축 하나의 정의. 이름·방향·모수·어느 카테고리에 붙는지가 여기 한 곳에 있다 */
type AxisDef = {
  name: string;
  /** 값이 큰 쪽이 흔히 반기는 쪽인가. 색(파랑/빨강)이 이 값으로 갈린다 */
  goodHigh: boolean;
  pick: (p: Product) => number | null;
  /** 이 카테고리에만 붙는다. null 이면 전부 */
  only?: string;
};

export const AXES: Record<string, AxisDef> = {
  prot: { name: "단백질", goodHigh: true, pick: (p) => p.protPack },
  // 🔴 당류는 여기서 **위쪽만** 잰다. 아래쪽은 백분위가 성립하지 않아 sugarTier() 가 맡는다.
  sugar: { name: "당류", goodHigh: false, pick: (p) => p.sugarPack },
  kcal: { name: "칼로리", goodHigh: false, pick: (p) => p.kcalPack, only: "RTD 음료" },
  share: { name: "단백질 비중", goodHigh: true, pick: proteinShareOf, only: "RTD 음료" },
};

/* ══════════════════════════════════════════════════════════════════════
   🔴 당류 — 3단계 (2026-08-07). 이 축만 백분위를 안 쓴다
   ══════════════════════════════════════════════════════════════════════

   ❌ 폐기 — 「당류 하위 20%」. **문구가 사실과 달랐다.**
      당류 적은 쪽은 0g 에 동점이 무더기로 쌓여 백분위 컷이 무의미하다 —
      5%·10%·20% 컷이 **전부 0.0** 이었고, 「하위 20%」 배지가 실제로는
      RTD 29%(58건)·파우더 11%(32건)에 붙고 있었다.
      위치 진술을 쓰기로 해 놓고 그 위치가 틀린 자리였다 (원칙 4).

   ✅ 채택 — **제로 / 당류 많음, 둘뿐이다.**
      「당이 들어 있다는 것 자체가 디메리트」라는 판단을 화면에 넣는다.

   ❌ 폐기 — 가운데 「저당」 칸 (식약처 저당류 기준, 2026-08-07 하루 만에 뺌).
      두 가지가 걸렸다.
      ① **217건(44%)** 에 붙어 파란 배지가 흔해졌다. 절반 가까이가 달면 변별이 없다.
      ② 🔴 **기준이 둘이 되어 모순이 났다.** 법정 「저당류」는 100ml·100g 당으로
         정의돼 있는데 제로·많음은 1회분 기준이다. `랩노쉬 350ml` 계열 13건이
         「저당」이면서 1병 5~6.5g 이었다 — 병이 커서 그렇다.
      → 빼고 나니 **모든 칸이 1회분(1병 / 1회분 30g) 한 기준**으로 통일됐다.

   ⚠️ 가운데를 안 적는 것이 정보를 감추는 게 아니다. 카드 영양 줄에
      「당류 4g」이 이미 적혀 있다 — **디메리트는 배지가 아니라 그 숫자가 말한다.**

   실측 (496건 · 1회분 기준)
     제로 90(18%) · 무표시 306(62%) · 많음 100(20%)
     RTD    제로 58(29%) · 많음 40(20%, ≥7.0g)
     파우더  제로 32(11%) · 많음 60(20%, ≥3.5g)
*/

export type SugarTier = "zero" | "high";

export function sugarTier(p: Product): SugarTier | null {
  if (p.sugarPack == null) return null;
  if (p.sugarPack === 0) return "zero";
  const arr = scales.sugar?.get(p.cat);
  if (arr?.length && topPct(arr, p.sugarPack, true) <= EDGE_PCT) return "high";
  return null;
}

export const SUGAR_TIERS: Record<SugarTier, { label: string; good: boolean; hint: string }> = {
  // 「제로」가 아니라 「당류 0g」이다 — 제로는 상품 마케팅 용어이고 0g 은 신고값이다
  zero: { label: "당류 0g", good: true, hint: "신고값이 0g" },
  high: { label: "당류 많음", good: false, hint: `1회 섭취량 기준 상위 ${EDGE_PCT}%` },
};

export type AxisKey = keyof typeof AXES;

export type EdgeBadge = {
  key: string;
  /** 「단백질 상위 20%」 — 수치는 들어가지 않는다. 윗줄 영양 줄이 맡는다 */
  label: string;
  /** 값이 큰 쪽인가 */
  high: boolean;
  /** 흔히 반기는 쪽인가. 파랑/빨강을 이 값으로 가른다 */
  good: boolean;
};

function scaleOf(pick: (p: Product) => number | null) {
  const m = new Map<string, number[]>();
  for (const p of products) {
    const v = pick(p);
    if (v == null) continue;
    const arr = m.get(p.cat) ?? [];
    arr.push(v);
    m.set(p.cat, arr);
  }
  return m;
}

const scales = Object.fromEntries(
  Object.entries(AXES).map(([key, a]) => [key, scaleOf(a.pick)]),
) as Record<string, Map<string, number[]>>;

/** 값이 큰 쪽/작은 쪽에서 상위 몇 %인가. 1 이 가장 끝이다 */
function topPct(sorted: number[], v: number, high: boolean): number {
  let ahead = 0;
  for (const x of sorted) if (high ? x > v : x < v) ahead++;
  return ((ahead + 1) / sorted.length) * 100;
}

/**
 * 이 제품의 극단 배지. 중간이면 빈 배열이다 — 배지가 없는 것이 정상이다.
 */
export function edgesOf(p: Product): EdgeBadge[] {
  const out: EdgeBadge[] = [];

  for (const [key, axis] of Object.entries(AXES)) {
    // 🔴 **당류는 여기서 배지를 내지 않는다** — `sugarTier()` 가 3단계로 전담한다.
    //    안 막으면 「당류 많음」 옆에 「당류 상위 20%」가 같이 붙는다. 실제로 그랬다.
    //    AXES 에 sugar 를 남겨 두는 것은 sugarTier 가 그 백분위 눈금(scales)을 쓰기 때문이다.
    if (key === "sugar") continue;
    if (axis.only && p.cat !== axis.only) continue;
    const v = axis.pick(p);
    const arr = scales[key].get(p.cat);
    if (v == null || !arr?.length) continue;

    const high = topPct(arr, v, true) <= EDGE_PCT;
    const low = !high && topPct(arr, v, false) <= EDGE_PCT;
    if (!high && !low) continue;
    /* ❌ 「단백질 비중 하위 20%」는 안 단다 (2026-08-07 · 태그 정합성 검사).
       그 배지가 붙는 제품의 64%가 「단백질 하위 20%」도 달아 같은 말이 두 번 나왔다.
       상위는 겹침 14%라 고유 정보(양은 평범해도 열량 대부분이 단백질)가 있어 남긴다 */
    if (key === "share" && !high) continue;

    out.push({
      key,
      label: `${axis.name} ${high ? "상위" : "하위"} ${EDGE_PCT}%`,
      high,
      good: high === axis.goodHigh,
    });
  }

  return out;
}

/**
 * 원료 공개 — 🔴 **여기는 상·하위로 적지 않는다.** 백분위가 아니라
 * 「알 수 없는 표기가 몇 종인가」라는 절대 사실이라, 사실 그대로 적는 편이 짧고 정확하다.
 * 등급을 못 주는 제품(원재료 미신고 141 · 표기 5종 미만 14)에는 아무것도 안 뜬다.
 *
 * ⚠️ **`strong` 이 아닌 쪽은 제품 카드에 안 뜬다** (2026-08-06). 「원료 N종 불명」은
 *    회색 배지였고, 2차 화면에서 회색을 전부 걷어냈다. 제품 상세에는 그대로 있다.
 */
export function opaqueBadge(p: Product): { label: string; strong: boolean } | null {
  const d = disclosureOf(p);
  if (!d.grade) return null;
  return d.opaque === 0
    ? { label: "원료 전부 공개", strong: true }
    : { label: `원료 ${d.opaque}종 불명`, strong: false };
}

/* ══════════════════════════════════════════════════════════════════════
   「영양」 필터 — 🔴 **카드 배지와 같은 말을 쓴다** (2026-08-06)
   ══════════════════════════════════════════════════════════════════════

   전에는 카드와 필터가 **다른 어휘**를 쓰고 있었다.

     카드가 말하는 것   단백질 상위 20% · 당류 하위 20% · 칼로리 · 단백질 비중
     필터가 말하는 것   고단백 · 저열량 · 당류 0 · 식물성 · 락토프리

   카드에서 「단백질 상위 20%」를 보고 그걸 필터에서 찾으면 없었다.
   그래서 「고르는 목적」 절을 없애고 **배지를 그대로 필터로** 만든다 —
   `edgesOf()` 하나가 두 화면을 함께 먹이므로 어긋날 수가 없다.

   ❌ 없앤 것과 이유 (실측)
     식물성  98 = 원료·계통 식물성 98      완전 중복
     분리유청 49 = 원료·WPI/WPH 49        완전 중복
     락토프리  4                          필터 한 줄 값을 못 한다
     고단백 234 ⊃ 「단백질 많은 쪽」 131    상위집합이라 배지 쪽을 남긴다
     당류 0 119 ⊃ 「당류 적은 쪽」 176

   ⚠️ `tag` 파라미터는 살려 뒀다. 화면에서만 뺐지 링크는 그대로 동작한다.
*/

/**
 * 🔴 **이름을 카드 배지와 글자까지 똑같이 맞췄다** (2026-08-06 · 팀 검수판).
 *    「단백질 많은 쪽」과 「단백질 상위 20%」는 같은 것을 가리키는 **두 가지 말**이었다.
 *    카드에서 본 낱말을 필터에서 그대로 찾을 수 있어야 한다.
 */
export type NutFilter = {
  key: string;
  label: string;
  /** 라벨이 다 말하지 못하는 것만 적는다. 라벨을 되풀이하지 않는다 */
  hint?: string;
  match: (p: Product) => boolean;
};

const hasEdge = (p: Product, key: string, high: boolean) =>
  edgesOf(p).some((e) => e.key === key && e.high === high);

export const NUT_FILTERS: NutFilter[] = [
  {
    key: "prot-high",
    label: `단백질 상위 ${EDGE_PCT}%`,
    hint: "1회 섭취량 기준",
    match: (p) => hasEdge(p, "prot", true),
  },
  // 🔴 당류는 양 끝만 적는다 — 위 sugarTier() 참조. 가운데 「저당」은 폐기했다.
  //    ⚠️ 필터 이름이 배지 글자와 같아야 한다는 규칙은 그대로다.
  { key: "sugar-zero", label: "당류 0g", match: (p) => sugarTier(p) === "zero" },
  {
    key: "sugar-high",
    label: "당류 많음",
    hint: `1회 섭취량 기준 상위 ${EDGE_PCT}%`,
    match: (p) => sugarTier(p) === "high",
  },
  {
    key: "kcal-low",
    label: `칼로리 하위 ${EDGE_PCT}%`,
    hint: "프로틴 음료만 해당됨",
    match: (p) => hasEdge(p, "kcal", false),
  },
  {
    key: "share-high",
    label: `단백질 비중 상위 ${EDGE_PCT}%`,
    hint: "프로틴 음료만 해당됨",
    match: (p) => hasEdge(p, "share", true),
  },
  // ⚠️ 「알 수 없는 표기 0종」 회색글씨는 뺐다 — 라벨이 이미 같은 말이다
  {
    key: "open",
    label: "원료 전부 공개",
    match: (p) => opaqueBadge(p)?.strong === true,
  },
  /* 🔴 이름 원료가 신고 목록에 없음 (2026-08-07 · 「프리미엄 산양유 초유 단백질」 사례).
     제품명은 산양유·초유를 내세우는데 신고 원재료에 그 계열 표기가 없는 15건 —
     종합 A·식물성으로 멀쩡해 보여서 걸러낼 방법이 없던 자리다.
     ⚠️ **원물 클레임만 잡는다.** WPI·아이솔레이트류 11건은 신고 서식이 정제 등급을
        원래 안 적어서 글자가 없는 것이라 불일치가 아니다 — 여기 넣으면
        「유청단백분말→WPC 매핑」 폐기와 같은 실수를 거꾸로 반복한다.
     ⚠️ 「안 들었다」가 아니라 「신고서로 확인되지 않는다」까지다 (원칙 5). */
  {
    key: "claim-missing",
    label: "이름 원료가 목록에 없음",
    hint: "제품명이 내세운 원료(산양유 등)가 신고 원재료에 없는 제품 — 안 들었다는 뜻이 아니라 신고서로 확인되지 않는다는 뜻",
    match: (p) => !!p.claim && p.claimRank == null && !REFINED_CLAIMS.has(p.claim),
  },
];

/** 정제 등급 클레임 — 신고 표기 관행상 목록에 글자가 없는 게 정상이라 필터에서 제외 */
export const REFINED_CLAIMS = new Set(["WPI", "WPC", "WPH", "MPI", "MPC", "ISP", "아이솔레이트"]);

const nutIndex = new Map(NUT_FILTERS.map((f) => [f.key, f]));
export const nutFilter = (key: string) => nutIndex.get(key);

const nutCounts = new Map(
  NUT_FILTERS.map((f) => [f.key, products.filter(f.match).length] as const),
);
export const nutCount = (key: string) => nutCounts.get(key) ?? 0;

/** 기준 페이지가 쓰는 실제 건수. 우리가 센 값이므로 화면에 그대로 적는다 */
export function edgeCounts(cat: string, key: string) {
  const axis = AXES[key];
  let high = 0;
  let low = 0;
  let n = 0;
  for (const p of products) {
    if (p.cat !== cat) continue;
    if (axis.only && cat !== axis.only) continue;
    if (axis.pick(p) != null) n++;
    const e = edgesOf(p).find((x) => x.key === key);
    if (!e) continue;
    if (e.high) high++;
    else low++;
  }
  return { high, low, n };
}
