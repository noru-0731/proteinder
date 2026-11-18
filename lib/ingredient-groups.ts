import { OPAQUE_NAMES } from "./data";
import { subject } from "./josa";

/**
 * 원재료를 「사람이 실제로 궁금해하는 것」 네 칸으로 간추린다.
 *
 * 신고 원재료는 제품당 중앙값 18종, 최대 44종이다. 그대로 늘어놓으면
 * 정보가 아니라 소음이 된다 — 44개를 눈으로 훑어서 알아낼 수 있는 게 없다.
 *
 * 그래서 이 네 가지만 앞에 세운다.
 *   무엇으로 만든 단백질인가 · 당이 들었다면 무슨 당인가
 *   대체당을 썼다면 무엇인가 · 우리가 못 읽는 표기는 몇 개인가
 *
 * 실측 커버리지 (원재료가 있는 547건 기준)
 *   단백질 원료 79.3% · 감미료 83.4% · 당류 36.7% · 알 수 없는 표기 81.9%
 *   당류와 감미료가 둘 다 없는 제품은 47건(8.6%)뿐이다.
 *
 * 🔴 배합 순번은 버리지 않는다. 간추리되 「몇 번째에 들었나」는 그대로 싣는다 —
 *    그게 이 서비스가 보여주려는 것이기 때문이다.
 */

export type GroupKey = "protein" | "sugar" | "sweetener" | "opaque";

export type GroupedItem = {
  name: string;
  /** 제조사가 신고한 배합 순번 (1부터) */
  rank: number;
};

export type IngredientGroup = {
  key: GroupKey;
  label: string;
  /** 칸이 비었을 때 대신 적을 말. 비어 있으면 칸 자체를 감춘다 */
  emptyNote?: string;
  items: GroupedItem[];
  /**
   * 칸 안의 원료들이 **서로 어떻게 다른가**. 원재료 사전으로 나가지 않아도
   * 그 자리에서 답하려는 한 줄이다. 낱개 원료 설명이 아니라 **관계**를 적는다 —
   * 「이 둘이 뭐가 다른가」·「왜 둘 다 들었나」.
   */
  curation?: string;
};

/**
 * ⚠️ 판정 순서가 곧 우선순위다. 위에서 걸리면 아래는 보지 않는다.
 *    「혼합분유」가 대표적이다 — 분유(단백질 원료)이면서 동시에
 *    무엇이 섞였는지 알 수 없는 표기라, 알 수 없는 쪽으로 보내야 정직하다.
 */

/** 대체당. 수크랄로스 하나가 절반(367건)이다 */
const SWEETENER =
  /수크랄로스|스테비|아세설팜|에리스리톨|알룰로|자일리톨|말티톨|소르비톨|네오탐|사카린|아스파탐|타우마틴|나한과|감미료/;

/**
 * 당류.
 * ⚠️ 「자당」은 넣지 않는다. `자당지방산에스테르`(96건)는 유화제이지 당이 아니다.
 * ⚠️ 「덱스트로스」도 넣지 않는다. 이 자료에서 덱스트로스가 들어간 이름은
 *    `폴리덱스트로스`(75건) 하나뿐이고 그건 식이섬유다. 포도당은 「포도당」이 잡는다.
 * ⚠️ 「말토덱스트린」·「덱스트린」도 넣지 않는다. 식이섬유·증점제다.
 */
const SUGAR =
  /설탕|정백당|원당|흑당|결정과당|액상과당|과당|물엿|올리고당|포도당|당밀|시럽|맥아당|벌꿀|당류가공품/;

/**
 * 단백질 원료.
 * ⚠️ `L-글루타민`·`L-카르니틴`은 아미노산이지 단백질 원료가 아니라 안 잡는다.
 * ⚠️ `밀크향분말`은 향료다 — 「분유」·「유청」에 걸리지 않게 패턴을 좁혔다.
 *
 * 🔴 원물 표기를 빠뜨리고 있었다 (2026-08-06). 「단백」·「유청」처럼 가공을 거친
 *    이름만 잡고 있어서, 젖·콩·고기 이름으로 신고된 것이 통째로 빠졌다.
 *    `산양유분말` 34건이 대표적이다 — CLAUDE.md 가 확인된 코드로 세어 둔
 *    「산양유 35」와 화면이 어긋나 있었다.
 *    RTD 에서 단백질 원료 칸이 비는 제품이 42건 → 30건이 됐다.
 *
 * ⚠️ 「두유」는 앞에 「대」가 붙으면 안 잡는다. `콩기름(대두유)`·`대두유액` 5건이
 *    걸린다 — 대두유는 콩기름이지 단백질 원료가 아니다.
 * ⚠️ 「우유」는 부분일치로도 안전하다. 이 자료에서 걸리는 이름이
 *    `우유`·`우유단백질`·`우유단백`·`우유단백가수분해물분말`·`우유농축액` 다섯뿐이다.
 */
const PROTEIN =
  /단백|유청|카제인|초유|난백|콜라겐|전지분유|탈지분유|가공유크림|유크림|산양유|우유|닭가슴살|(?<!대)두유/;

/** 어느 칸에도 안 넣는 것. 향·물·소금은 모든 제품에 있어 정보가 없다 */
const NOISE = /^향료|^정제수|^물$|^정제소금|^정제염|^식염/;

const LABEL: Record<GroupKey, string> = {
  protein: "단백질 원료",
  sugar: "당류",
  sweetener: "감미료",
  opaque: "알 수 없는 표기",
};

function classify(name: string): GroupKey | null {
  // 순서가 우선순위다 — 위 주석 참조
  if (OPAQUE_NAMES.has(name)) return "opaque";
  if (NOISE.test(name)) return null;
  if (SWEETENER.test(name)) return "sweetener";
  if (SUGAR.test(name)) return "sugar";
  if (PROTEIN.test(name)) return "protein";
  return null;
}

/**
 * 신고 원재료 목록을 네 칸으로 나눈다.
 * 배열 순서가 화면에 뜨는 순서다 — 단백질 → 당 → 감미료 → 알 수 없는 것.
 *
 * 같은 원재료가 여러 번 신고된 제품이 있다(원본 그대로 둔 값이다).
 * 칸 안에서는 이름 기준으로 한 번만 싣되, 순번은 가장 앞선 것을 쓴다.
 */
export function groupIngredients(ings: string[]): IngredientGroup[] {
  const buckets: Record<GroupKey, GroupedItem[]> = {
    protein: [],
    sugar: [],
    sweetener: [],
    opaque: [],
  };
  const seen: Record<GroupKey, Set<string>> = {
    protein: new Set(),
    sugar: new Set(),
    sweetener: new Set(),
    opaque: new Set(),
  };

  ings.forEach((name, i) => {
    const key = classify(name);
    if (!key) return;
    if (seen[key].has(name)) return;
    seen[key].add(name);
    buckets[key].push({ name, rank: i + 1 });
  });

  const order: GroupKey[] = ["protein", "sugar", "sweetener", "opaque"];
  return order.map((key) => ({
    key,
    label: LABEL[key],
    items: buckets[key],
    emptyNote: emptyNoteFor(key),
    /* ❌ 단백질 원료 칸의 계통 문장(「식물에서 온 …이 2순위, 동물에서 온 …이 5순위」)은
       걷어냈다 (2026-08-06 밤 · 팀 결정 — "의미없는 큐레이션").
       원료별 강점/단점은 위 「단백질 원료」 카드(source-notes)가 말하고,
       낱개 표기는 칩이 사전으로 잇는다. */
    curation:
      key === "sugar"
        ? sugarCuration(buckets.sugar, buckets.sweetener)
        : key === "sweetener"
          ? sweetenerCuration(buckets.sweetener, buckets.sugar)
          : undefined,
  }));
}

/* ══════════════════════════════════════════════════════════════════════
   큐레이션 — 칸 안의 원료들이 서로 어떻게 다른가
   ══════════════════════════════════════════════════════════════════════

   낱개 원료가 무엇인지는 원재료 사전이 답한다. 여기서 답할 것은 **관계**다.
   실측으로 이게 소수 사례가 아니다 —
     동물성·식물성 단백질 원료를 함께 쓴 제품   222건 (34%)
     감미료가 2종 이상인 제품                 370건 (56%)

   🔴 건수를 화면에 적지 않는다. 「437건 중 89건」은 우리가 센 값이지
      읽는 사람이 쓸 말이 아니다. 「널리 쓰이는 조합」처럼 성질로 적는다.
   🔴 효능·안전·우열을 말하지 않는다. 「WPI가 낫다」·「수크랄로스가 안전하다」는
      우리가 판정할 자리가 아니다 (원칙 7). 공정과 배합 순서까지만 적는다.
*/

/** 단백질 원료의 계통. `유크림`은 유지방이라 안 넣는다 — 단백질 원료가 아니다 */
const ANIMAL_SRC = /유청|카제인|초유|난백|콜라겐|분유|산양유|우유|유단백|닭가슴살/;
const PLANT_SRC = /대두단백|두유|완두|현미단백|쌀단백|귀리단백|식물성단백|콩단백|검정콩/;

/**
 * 감미료를 두 갈래로 나눈다. **넣는 양이 다르다**는 것이 이 둘의 실질적인 차이다.
 *
 * 실측 표기 15종이 여기에 다 들어간다 (2026-08-06 기준)
 *   고감미도  수크랄로스 350 · 효소처리스테비아 234 · 아세설팜칼륨 144 ·
 *            스테비올배당체 26 · 아스파탐 25 · 스테비텐후레쉬 10 · 나한과 10 · 스테비아추출물 1
 *   당알코올  에리스리톨 63 · 알룰로오스 50 · 자일리톨 8 · D-소르비톨 1
 *
 * ⚠️ 화면에 배수(600배 같은 숫자)를 적지 않는다. 우리가 원출처에 대조한 값이 아니다.
 *    「수백 배」라는 성질까지만 적는다.
 * ⚠️ `스테비텐후레쉬`는 상품명이다. 스테비아 계열이라 고감미도로 두되,
 *    무엇이 얼마나 섞였는지는 이 이름으로 알 수 없다.
 */
const HIGH_INTENSITY =
  /수크랄로스|스테비|아세설팜|아스파탐|나한과|사카린|네오탐|타우마틴/;
const BULK_SWEET = /에리스리톨|알룰로|자일리톨|말티톨|소르비톨/;

/**
 * 감미료 한 종이 어느 갈래인가 — 원재료 칸의 하위 묶음과 사전 상세가 함께 쓴다.
 * ⚠️ 갈래 이름을 「당알코올」로만 적으면 안 된다. 알룰로오스는 당알코올이 아니라
 *    희소당이다 (BULK_SWEET 에는 「넣는 양이 비슷하다」는 이유로 함께 있다).
 *    화면 라벨은 「당알코올·희소당」으로 적는다.
 */
export function sweetenerKindOf(name: string): "hi" | "bulk" | null {
  if (HIGH_INTENSITY.test(name)) return "hi";
  if (BULK_SWEET.test(name)) return "bulk";
  return null;
}

/* ❌ 지운 것 (2026-08-06 밤 · 팀 결정 — "의미없는 큐레이션")
   · comboPhrase — 「가끔 보이는 조합입니다」 빈도 문구. 읽는 사람이 쓸 데가 없다.
   · proteinCuration — 「식물에서 온 …이 2순위, 동물에서 온 …이 5순위」 계통 문장.
     원료별 강점/단점은 「단백질 원료」 카드(source-notes)가 말한다.
   ANIMAL_SRC·PLANT_SRC 는 계통 판정이 다시 필요해질 때를 위해 남겨 둔다. */
void ANIMAL_SRC;
void PLANT_SRC;

/**
 * 법정 표시 의무 — **인용이다. 우리 판정이 아니다.**
 *
 * 🔴 여기 있던 감미료 **감점**(당알코올 −20 · 아스파탐 −30)은 폐기했다.
 *    식약처 실측이 사카린 1.41% · 수크랄로스 0.18% · 아스파탐 0.12% 로
 *    **전부 ADI 의 2% 미만**이고 발표 제목이 「감미료 사용 안전한 수준」이다.
 *    거기에 우리가 점수를 깎으면 질문 한 번에 무너진다.
 *    → 10_작업/06_원료벤치마크_리서치.md §3
 *
 * ⚠️ **IARC 2B 는 뺐다.** 표시 의무가 아니라 평가이고, ADI 맥락 없이 한 줄만
 *    적으면 오도한다. 남긴 둘은 **제품 라벨에 실제로 찍히는 문구**다.
 * 🔴 **알룰로스는 당알코올이 아니다** (희소당). BULK_SWEET 에는 들어 있으므로
 *    이 정규식을 따로 둔다 — 섞으면 50건에 없는 문구가 붙는다.
 */
const SUGAR_ALCOHOL =
  /에리스리톨|자일리톨|말티톨|소르비톨|소비톨|락티톨|만니톨|이소말트|폴리글리시톨/;
const ASPARTAME = /아스파탐/;

function dutyPhrase(items: GroupedItem[]): string {
  const out: string[] = [];
  if (items.some((i) => SUGAR_ALCOHOL.test(i.name)))
    out.push(
      "「과량 섭취 시 설사를 일으킬 수 있습니다」 — 당알코올을 주요 원재료로 쓴 제품에 적도록 되어 있는 표시입니다 (식약처 표시기준).",
    );
  if (items.some((i) => ASPARTAME.test(i.name)))
    out.push(
      "「페닐알라닌 함유」 — 아스파탐이 든 제품에 적도록 되어 있는 표시입니다 (식약처 표시기준).",
    );
  return out.join(" ");
}

/**
 * 당류 칸 — 당이 배합 몇 순위인지, 대체 감미료와 함께 쓰는지 (2026-08-06 밤 신설).
 *
 * 🔴 「그래서 당류가 높다」고 적지 않는다 — 원료별 함량 비율은 신고서에 없다
 *    (푸터 면책과 같은 말). **배합 순위와 병용 사실까지만** 적는다.
 *    「백설탕이 배합 1순위 + 대체 감미료 병용」을 나란히 놓으면
 *    읽는 사람이 알아서 잇는다.
 */
function sugarCuration(sugar: GroupedItem[], sweet: GroupedItem[]): string | undefined {
  if (sugar.length === 0) return undefined;
  const first = sugar[0];
  /* 🔴 짧게 (2026-08-06 밤 · 팀 피드백 — "신고 목록 맨 앞에 있는 원재료입니다" 같은
     풀이는 군더더기). 사실 두 개만: 들어 있다 + 몇 순위. 「좋지 않다」는 판정 낱말
     대신 빨간 칩이 방향을 말한다 (원칙 7). */
  const head = `${first.name}${subject(first.name)} 들어 있습니다 (배합 ${first.rank}순위).`;
  return sweet.length > 0 ? `${head} 대체 감미료를 쓰면서도 당을 넣었습니다.` : head;
}

/**
 * 감미료 칸 — **경고(법정 표시 인용)만 적는다** (2026-08-06 밤 · 팀 결정).
 *
 * ❌ 걷어낸 것 — 「설탕보다 수백 배 단 …」 성질 설명 · 「가끔 보이는 조합」 빈도 문구.
 *    읽는 사람이 쓸 데 없는 정보라는 팀 판단. 갈래는 하위 묶음 라벨이 이미 말한다.
 * ⚠️ 고감미도 감미료(수크랄로스 등)에 복통·설사 경고를 지어 붙이지 않는다.
 *    그 문구는 **당알코올의 법정 표시**이고, 고감미도는 식약처 실측이 ADI 대비
 *    2% 미만 섭취라 근거가 반대다. 경고가 없으면 아무것도 안 적는다.
 */
function sweetenerCuration(
  items: GroupedItem[],
  sugarItems: GroupedItem[],
): string | undefined {
  if (items.length === 0) return undefined;
  const parts: string[] = [];
  /* 🔴 당류 칸이 비어 있을 때만 — 「당류 0인데 왜 단맛이 나는가」에 답하는 줄이다.
     당도 함께 든 제품은 당류 칸의 문장이 병용을 이미 말하므로 되풀이하지 않는다. */
  if (sugarItems.length === 0)
    parts.push("신고 원재료에 당류가 없어, 단맛은 이 감미료가 냅니다.");
  const duty = dutyPhrase(items);
  if (duty) parts.push(duty);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * 칸이 비었을 때 무엇을 적을지.
 * 🔴 「없음」이라고 단정하지 않는다. 신고 원재료에서 확인되지 않았다는 뜻일 뿐이고,
 *    실제로 안 들었다는 뜻이 아니다 — 우리가 아는 것과 사실을 섞지 않는다.
 */
function emptyNoteFor(key: GroupKey): string | undefined {
  if (key === "protein") return "신고 원재료로는 특정되지 않음";
  if (key === "sweetener") return "신고 원재료에서 확인되지 않음";
  // 당류·알 수 없는 표기는 비면 줄째로 감춘다.
  //
  // 🔴 감미료는 비어도 남긴다. 「어떤 감미료가 들었나」가 이 화면이 답하려는
  //    질문이라, 확인되지 않았다는 사실 자체가 답이다. 실측으로도 RTD 213건 중
  //    44건만 빈 칸이라 줄이 늘 비어 있지 않다.
  // 당류는 반대다 — 원재료가 있는 제품의 36.7% 에만 잡히고, 「당류 28g」은
  //    바로 위 영양정보 카드가 이미 말한다. 없는데 빈 줄을 그리면 같은 말이 두 번이다.
  return undefined;
}

/** 이 표기가 제품 상세의 어느 칸에 잡히는가 — 원재료 사전 상세가 쓴다 */
export function groupKeyOf(name: string): GroupKey | null {
  return classify(name);
}

/** 칸 이름 — 사전 상세가 「감미료」 같은 칸 이름을 그대로 쓰기 위한 노출 */
export const GROUP_LABEL = LABEL;

/** 네 칸 어디에도 안 들어간 나머지 (전체 보기에서 쓴다) */
export function ungroupedCount(ings: string[]): number {
  const grouped = new Set<string>();
  for (const g of groupIngredients(ings)) for (const it of g.items) grouped.add(it.name);
  return ings.filter((n) => !grouped.has(n)).length;
}
