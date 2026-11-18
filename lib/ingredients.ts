import type { Product } from "./products";

/**
 * 신고 원재료를 네 칸으로 간추린다.
 *
 * 제품당 중앙값 18종, 최대 44종이다. 그대로 늘어놓으면 정보가 아니라 소음이다 —
 * 44개를 눈으로 훑어서 알아낼 수 있는 게 없다.
 *
 * 🔴 배합 순번은 버리지 않는다. 간추리되 「몇 번째에 들었나」는 그대로 싣는다.
 * 🔴 칸이 비면 「없음」이라 쓰지 않는다 — 「신고 원재료에서 확인되지 않음」이다.
 *    안 들었다는 뜻이 아니라 우리가 확인 못 했다는 뜻이다.
 *
 * ⚠️ 판정 순서가 곧 우선순위다. 위에서 걸리면 아래는 보지 않는다.
 *    「혼합분유」가 대표적이다 — 분유(단백질 원료)이면서 동시에 무엇이 섞였는지
 *    알 수 없는 표기라, 알 수 없는 쪽으로 보내야 정직하다.
 *
 * 패턴은 옛 앱 lib/ingredient-groups.ts 에서 그대로 옮겼다. 하나하나가
 * 오탐을 잡아 좁힌 결과라 다시 쓰지 않는다.
 */

/** 이름만으로 안을 알 수 없는 표기 */
export const OPAQUE_NAMES = new Set([
  "기타가공품",
  "기타 가공품",
  "혼합제제",
  "식품첨가물",
  "식품첨가물혼합제제",
  "유함유가공품",
  "곡류가공품",
  "두류가공품",
  "효소식품",
  "과.채가공품",
  "아미노산혼합제제",
  "혼합분유",
  "서류가공품",
  "기타 코코아가공품",
]);

const SWEETENER =
  /수크랄로스|스테비|아세설팜|에리스리톨|알룰로|자일리톨|말티톨|소르비톨|네오탐|사카린|아스파탐|타우마틴|나한과|감미료/;

/**
 * ⚠️ 「자당」은 안 넣는다 — `자당지방산에스테르`는 유화제다.
 * ⚠️ 「덱스트로스」도 안 넣는다 — 이 자료에서 걸리는 이름은 `폴리덱스트로스` 하나뿐이고
 *    그건 식이섬유다. 포도당은 「포도당」이 잡는다.
 * ⚠️ 「말토덱스트린」·「덱스트린」도 안 넣는다 — 식이섬유·증점제다.
 */
const SUGAR =
  /설탕|정백당|원당|흑당|결정과당|액상과당|과당|물엿|올리고당|포도당|당밀|시럽|맥아당|벌꿀|당류가공품/;

/**
 * ⚠️ `L-글루타민`·`L-카르니틴`은 아미노산이지 단백질 원료가 아니다.
 * ⚠️ 「두유」는 앞에 「대」가 붙으면 안 잡는다 — 대두유는 콩기름이다.
 */
const PROTEIN =
  /단백|유청|카제인|초유|난백|콜라겐|전지분유|탈지분유|가공유크림|유크림|산양유|우유|닭가슴살|(?<!대)두유/;

/** 어느 칸에도 안 넣는 것. 향·물·소금은 모든 제품에 있어 정보가 없다 */
const NOISE = /^향료|^정제수|^물$|^정제소금|^정제염|^식염/;

export type GroupKey = "protein" | "sugar" | "sweetener" | "opaque" | "rest";

function classify(name: string): GroupKey {
  if (OPAQUE_NAMES.has(name)) return "opaque";
  if (NOISE.test(name)) return "rest";
  if (SWEETENER.test(name)) return "sweetener";
  if (SUGAR.test(name)) return "sugar";
  if (PROTEIN.test(name)) return "protein";
  return "rest";
}

export type Item = { name: string; rank: number };

export type Grouped = {
  key: GroupKey;
  label: string;
  items: Item[];
  /** 칸이 비었을 때 적을 문장. 「없음」이 아니다 */
  empty: string;
};

const LABEL: Record<GroupKey, string> = {
  protein: "단백질 원료",
  sugar: "당류",
  sweetener: "감미료",
  opaque: "알 수 없는 표기",
  rest: "나머지",
};

const EMPTY: Record<GroupKey, string> = {
  protein: "신고 원재료에서 단백질 원료를 특정하지 못했습니다.",
  sugar: "신고 원재료에서 당류가 확인되지 않습니다.",
  sweetener: "신고 원재료에서 감미료가 확인되지 않습니다.",
  opaque: "안을 알 수 없는 표기가 없습니다.",
  rest: "",
};

export function groupIngredients(p: Product): Grouped[] {
  const buckets: Record<GroupKey, Item[]> = {
    protein: [],
    sugar: [],
    sweetener: [],
    opaque: [],
    rest: [],
  };
  p.ings.forEach((name, i) => buckets[classify(name)].push({ name, rank: i + 1 }));
  return (["protein", "sugar", "sweetener", "opaque", "rest"] as GroupKey[]).map((k) => ({
    key: k,
    label: LABEL[k],
    items: buckets[k],
    empty: EMPTY[k],
  }));
}

/* ── 감미료 갈래 ──────────────────────────────────────────────────
   표기 15종이 두 갈래로 깨끗하게 갈린다. 실질적 차이는 **넣는 양**이다 —
   고감미도는 설탕의 수백 배라 극소량, 당알코올은 설탕과 비슷한 양을 넣는다.

   ⚠️ 갈래 이름을 「당알코올」로만 적으면 안 된다. 알룰로오스는 당알코올이 아니라
      **희소당**이다 — 「넣는 양이 비슷하다」는 이유로 같은 갈래에 있을 뿐이다.
      화면 라벨은 「당알코올·희소당」으로 적는다.
   ⚠️ `스테비텐후레쉬`는 상품명이다. 스테비아 계열이라 고감미도로 두되,
      무엇이 얼마나 섞였는지는 이 이름으로 알 수 없다. */
const HIGH_INTENSITY = /수크랄로스|스테비|아세설팜|아스파탐|나한과|사카린|네오탐|타우마틴/;
const BULK_SWEET = /에리스리톨|알룰로|자일리톨|말티톨|소르비톨/;

export function sweetenerKindOf(name: string): "hi" | "bulk" | null {
  if (HIGH_INTENSITY.test(name)) return "hi";
  if (BULK_SWEET.test(name)) return "bulk";
  return null;
}

export const SWEETENER_KIND_LABEL = {
  hi: "고감미도 감미료",
  bulk: "당알코올·희소당",
} as const;

/**
 * 법정 표시 의무 — 🔴 **인용이다. 우리 판정이 아니다.**
 *
 * 경고가 없으면 아무것도 적지 않는다. 수크랄로스 같은 고감미도에 복통 경고를
 * 지어 붙이지 않는다 — 그 문구는 당알코올의 법정 표시이고, 식약처 실측은
 * 사카린 1.41% · 수크랄로스 0.18% · 아스파탐 0.12% 로 전부 ADI 의 2% 미만이다.
 *
 * 🔴 알룰로스는 당알코올이 아니라 희소당이라 이 정규식에서 뺀다 —
 *    섞으면 50건에 없는 문구가 붙는다.
 */
const SUGAR_ALCOHOL = /에리스리톨|자일리톨|말티톨|소르비톨|소비톨|락티톨|만니톨|이소말트/;

export function legalNoteOf(name: string): string | null {
  if (SUGAR_ALCOHOL.test(name))
    return "「과량 섭취 시 설사를 일으킬 수 있습니다」 — 당알코올을 주요 원재료로 쓴 제품에 적도록 되어 있는 표시입니다 (식약처 표시기준).";
  if (/아스파탐/.test(name))
    return "「페닐알라닌 함유」 — 아스파탐이 든 제품에 적도록 되어 있는 표시입니다 (식약처 표시기준).";
  return null;
}

/**
 * 단맛 배수 — 🔴 식약처 카드뉴스 표에 있는 4종만 적는다 (원출처 대조 완료).
 * ⚠️ 에리스리톨·알룰로스는 그 표에 없다. 배수를 적지 않는다
 *    (에리스리톨은 설탕보다 오히려 **덜 달다** — 0.6~0.7배).
 */
const SWEETNESS: [RegExp, string][] = [
  [/수크랄로스/, "약 600배"],
  [/사카린/, "약 300배"],
  [/아세설팜/, "약 200배"],
  [/아스파탐/, "약 200배"],
];

export function sweetnessOf(name: string): string | null {
  return SWEETNESS.find(([re]) => re.test(name))?.[1] ?? null;
}

/** 화해의 「성분 구성」 스택 막대에 쓸 수치 */
export function composition(p: Product) {
  const g = groupIngredients(p);
  const get = (k: GroupKey) => g.find((x) => x.key === k)!.items.length;
  return {
    total: p.ings.length,
    protein: get("protein"),
    sugar: get("sugar"),
    sweetener: get("sweetener"),
    opaque: get("opaque"),
    rest: get("rest"),
  };
}
