import { type Product, energyConsistent } from "./products";
import { type AxisKey, AXIS_BY_KEY, servValue } from "./axes";
import { sampleOf, ALL_SAMPLE, type CatKey } from "./categories";
import { pinRank } from "./extras";
import type { IconName } from "@/components/Icon";

/* ══════════════════════════════════════════════════════════════════════
   랭킹의 축들.

   화해 랭킹은 하위 탭 다섯으로 갈린다 — 급상승 · 카테고리별 · 피부별 ·
   연령대별 · 브랜드. 그 다섯 자리에 우리가 실제로 가진 것을 넣는다.

     화해              app3            무엇으로
     ─────────────────────────────────────────────────────────
     급상승 랭킹        많이 찾는        쇼핑몰 노출 건수
     카테고리별         카테고리별        7개 카테고리 (드롭다운 2단)
     피부별            조건별           신고 원재료로 가려지는 조건 5개
     연령대별          영양별           1회 섭취 기준 다섯 축
     브랜드            브랜드별          제품명 앞머리에서 확인된 브랜드

   🔴 「급상승」을 그대로 옮기지 않았다. 시계열이 없어 무엇이 오르고 내렸는지
      말할 수 없다. 「연령대별」도 옮기지 않았다 — 나이로 제품을 가를 근거가 없다.
   ══════════════════════════════════════════════════════════════════════ */

/* ── 유당불내증 OK ────────────────────────────────────────────────
   🔴 좁게 잡은 판정이라 다시 만들지 않는다. 틀리면 사람이 다치는 축이다.
   ⚠️ 「우유가 없다」고 단정하지 않는다. 우리가 읽은 것은 신고 원재료뿐이다. */
const MILK =
  /우유|유청|유단백|카제인|분유|유크림|버터|치즈|락토|유당|산양유|초유|유함유|전지|탈지/;
const MILK_CODES = new Set(["유청", "WPI", "WPC", "WPH", "MPI", "MPC", "카제인", "산양유", "초유"]);
/** 이름만으로 내용을 알 수 없어 우유가 숨어 있을 수 있는 표기 */
const MILK_RISKY = new Set([
  "기타가공품",
  "기타 가공품",
  "혼합제제",
  "식품첨가물",
  "식품첨가물혼합제제",
  "효소식품",
  "아미노산혼합제제",
  "기타 코코아가공품",
]);

export function lactoseClear(p: Product): boolean {
  if (!p.ings.length) return false;
  if (p.ings.some((n) => MILK_RISKY.has(n))) return false;
  const codes = new Set(p.codes);
  return !(MILK.test(p.ings.join(" ")) || [...codes].some((c) => MILK_CODES.has(c)));
}

/* ── 조건별 ──────────────────────────────────────────────────── */

export type FitChip = {
  key: string;
  /** 🔴 「무엇으로 걸렀나」의 그림. ⚠️ 판정이 아니다 — milk-off 는 「우유가 안 들었다」가
      아니라 「우유에서 온 원료가 신고서에서 확인되지 않았다」는 필터 이름의 그림이다 */
  icon: IconName;
  label: string;
  /** 칩 아래 한 줄. 무엇을 근거로 걸렀는지 화면에 그대로 적는다 */
  note: string;
  test: (p: Product) => boolean;
};

export const FIT_CHIPS: FitChip[] = [
  {
    key: "lactose",
    icon: "milk-off",
    label: "유당불내증 OK",
    note: "신고된 원재료에 우유에서 온 것이 하나도 없고, 우유가 숨을 수 있는 뭉뚱그린 표기도 없는 제품입니다.",
    test: lactoseClear,
  },
  {
    key: "plant",
    icon: "leaf",
    label: "식물성",
    note: "원재료에서 확인된 단백질 계통이 식물성입니다 — 동물성 원료가 확인되지 않았다는 뜻까지입니다.",
    test: (p) => p.base === "식물성",
  },
  {
    key: "sugar0",
    icon: "candy-off",
    label: "당류 0g",
    note: "신고 당류가 정확히 0g 인 제품입니다. 0.1~0.4g 은 여기 들어오지 않습니다.",
    test: (p) => p.sugar === 0,
  },
  {
    key: "open",
    icon: "list-check",
    label: "원료 전부 공개",
    note: "「두류가공품」처럼 안을 알 수 없는 표기가 하나도 없이 신고된 제품입니다.",
    test: (p) => p.ings.length > 0 && !p.opaque && p.codes.length > 0,
  },
  {
    key: "single",
    icon: "circle-dot",
    label: "단백질원 하나",
    note: "확인된 단백질 원료 계통이 하나뿐인 제품입니다. 여러 원료를 섞지 않았습니다.",
    test: (p) => p.codes.length === 1,
  },
];

export const fitOf = (key: string | undefined) => FIT_CHIPS.find((c) => c.key === key) ?? null;

/**
 * 🔴 **조건은 여러 개 걸 수 있다** (2026-08-08 · 팀 지시 「토글 중복선택 가능하게」).
 *
 * 전에는 `fit=` 이 낱말 하나라 다른 칩을 누르면 앞의 것이 꺼졌다 —
 * 「유당불내증 OK 이면서 당류 0g」을 물을 수가 없었다.
 * 이제 콤마로 여럿을 받고 **전부 만족하는 제품만** 남긴다.
 *
 * 🔴 **절 안이 AND 다.** OR 이면 고를수록 목록이 넓어지는데, 이 절에서 원하는 것은
 *    좁히는 일이다 (ver1 의 영양 절과 같은 규칙 — 화면에도 그렇게 적는다).
 * ⚠️ 모르는 낱말은 조용히 버린다. 옛 주소(`fit=lactose`)는 그대로 하나로 읽힌다.
 */
export function fitsOf(param: string | undefined): FitChip[] {
  if (!param) return [];
  const seen = new Set<string>();
  return param
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k && !seen.has(k) && (seen.add(k), true))
    .map((k) => fitOf(k))
    .filter((c): c is FitChip => c != null);
}

/* ── 영양별 (5축) ────────────────────────────────────────────── */

/** 🔴 화살표가 **정렬 방향**이다. 「많은 순」과 「낮은 순」이 낱말로만 갈리던 자리 */
export type AxisChip = { key: AxisKey; label: string; note: string; icon: IconName };

export const AXIS_CHIPS: AxisChip[] = [
  { key: "prot", label: "단백질 많은 순", note: "1회 섭취 기준 단백질이 많은 쪽부터입니다.", icon: "arrow-narrow-up" },
  { key: "kcal", label: "칼로리 낮은 순", note: "1회 섭취 기준 열량이 낮은 쪽부터입니다.", icon: "arrow-narrow-down" },
  { key: "sugar", label: "당류 적은 순", note: "1회 섭취 기준 당류가 적은 쪽부터입니다.", icon: "arrow-narrow-down" },
  { key: "carb", label: "탄수화물 적은 순", note: "1회 섭취 기준 탄수화물이 적은 쪽부터입니다.", icon: "arrow-narrow-down" },
  { key: "fat", label: "지방 적은 순", note: "1회 섭취 기준 지방이 적은 쪽부터입니다.", icon: "arrow-narrow-down" },
];

export const axisOf = (key: string | undefined) =>
  AXIS_CHIPS.find((c) => c.key === key) ?? null;

/* ── 목록 만들기 ─────────────────────────────────────────────── */

/**
 * 신고값이 서로 어긋나는 제품은 순위 목록에서 뺀다.
 * 단백질 1g 은 그 자체로 4kcal 이라, 신고 열량이 그보다 낮으면 성립하지 않는다.
 * 🔴 고치지 않고 뺀다 — 어느 쪽 숫자가 틀렸는지 우리는 모른다.
 */
export function sane(list: Product[]): Product[] {
  return list.filter((p) => p.prot == null || p.kcal == null || energyConsistent(p));
}

/** 카테고리 하나, 또는 전체 표본 */
export function pool(cat: CatKey | null): Product[] {
  return sane(cat ? sampleOf(cat) : ALL_SAMPLE);
}

/**
 * 「많이 찾는」 — 네이버 검색 상위에 쇼핑몰 목록으로 올라와 있는 수 순.
 * 🔴 판매량이 아니다. 우리가 아는 것은 「인터넷 쇼핑몰에 이 이름으로 올라와 있는
 *    목록 수」까지고, 화면에도 그렇게 적는다. 질문 받으면 그대로 답할 것.
 */
export function byPopularity(list: Product[]): Product[] {
  return [...list].sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name, "ko"));
}

/**
 * 🔴 **카테고리 안의 순서 = 그 카테고리의 랭킹.**
 *
 * 쿠팡이 목록을 준 다섯은 **쿠팡 순위 그대로**, 우리가 고른 둘(드링크·파우더)은
 * 노출 수 순이다. 두 잣대를 한 함수에 둔 이유는 화면이 이걸 구분할 필요가 없어서다 —
 * 「이 카테고리에서 앞선 순서」 하나면 된다.
 *
 * ⚠️ 이게 없으면 `byPopularity` 가 쿠팡 순위를 덮어써서 **랭킹 탭의 「카테고리별」이
 *    「많이 찾는」과 같은 목록이 된다.** 실제로 그랬다 — 쿠팡 두유 1~3위
 *    (매일두유 99.9 · 전두유 검은콩 17곡 · 연세두유)가 뒤로 밀려 있었다.
 */
export function byRank(list: Product[]): Product[] {
  return [...list].sort((a, b) => {
    /* 🔴 고정이 가장 먼저다 (lib/extras.ts 의 PINNED). 발표 예시 제품을 카테고리
       랭킹 맨 앞에 두기로 한 것 — 「많이 찾는」 탭(byPopularity)에는 안 건다. */
    const pa = pinRank(a.id);
    const pb = pinRank(b.id);
    if (pa || pb) {
      if (pa && pb) return pa - pb;
      return pa ? -1 : 1;
    }
    const ra = (a as { cpRank?: number }).cpRank;
    const rb = (b as { cpRank?: number }).cpRank;
    if (ra != null && rb != null) return ra - rb;
    if (ra != null) return -1;
    if (rb != null) return 1;
    return b.pop - a.pop || a.name.localeCompare(b.name, "ko");
  });
}

/**
 * 한 축에서 흔히 반기는 쪽부터.
 *
 * 🔴 **카테고리를 반드시 하나 고른 뒤에만 부른다.** 1병·1회분 30g·1개는
 *    단위가 달라 섞으면 순위가 성립하지 않는다. 화면(랭킹 영양별 탭)에서도
 *    「전체」 선택지를 감춰 이 조건을 강제한다.
 */
export function byAxis(list: Product[], key: AxisKey): Product[] {
  const axis = AXIS_BY_KEY.get(key)!;
  const val = new Map<string, number>();
  for (const p of list) {
    const v = servValue(p, key);
    if (v != null) val.set(p.id, v);
  }
  return list
    .filter((p) => val.has(p.id))
    .sort((a, b) => {
      const d = val.get(a.id)! - val.get(b.id)!;
      return (axis.goodHigh ? -d : d) || b.pop - a.pop;
    });
}

/** 브랜드별 묶음 — 노출이 많은 브랜드부터, 각 브랜드에서 노출 많은 제품부터 */
export function brandGroups(
  cat: CatKey | null,
  limit = 6,
  per = 3,
): { brand: string; items: Product[]; total: number }[] {
  const m = new Map<string, Product[]>();
  for (const p of pool(cat)) {
    if (!p.brand) continue;
    const arr = m.get(p.brand);
    if (arr) arr.push(p);
    else m.set(p.brand, [p]);
  }
  return [...m.entries()]
    .map(([brand, items]) => ({
      brand,
      total: items.length,
      items: byPopularity(items).slice(0, per),
      pop: items.reduce((s, p) => s + p.pop, 0),
    }))
    .filter((g) => g.items.length >= 2)
    .sort((a, b) => b.pop - a.pop)
    .slice(0, limit)
    .map(({ brand, items, total }) => ({ brand, items, total }));
}
