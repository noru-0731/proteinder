import { products, type Product, energyConsistent } from "./products";
import { OPAQUE_NAMES } from "./ingredients";
import { COUPANG_CATS, coupangOf } from "./coupang";
import { EXTRAS, EXTRA_IDS, pinRank } from "./extras";
import type { IconName } from "@/components/Icon";

/* ══════════════════════════════════════════════════════════════════════
   카테고리 7종 — app3 의 뼈대.

   app2 는 프로틴 음료·파우더 둘뿐이었다. 여기서는 일곱으로 늘리고,
   화해의 「카테고리 전체 ▾」 2단 드롭다운이 성립하게 **먹는 형태 3그룹**으로 묶는다.

     마시는 것    프로틴 드링크 · 두유
     타 먹는 것   프로틴 파우더
     먹는 것      닭가슴살 · 단백질바 · 그릭요거트 · 과자류

   그룹은 제형이다. 「끼니 대용 / 간식」처럼 목적으로 묶으면 우리가 판정을
   하는 것이 되고, 제형은 신고서에 있는 사실이다.

   🔴 `ready: false` 인 다섯은 **아직 표본이 없다.** 화면에서 감추지 않고
      「수집 중」으로 세워 둔다 — 일곱 칸이 서 있어야 이 개편이 무엇을 하려는지
      보이고, 데이터가 들어오면 `data` 에 cat 값만 적으면 켜진다.
   ══════════════════════════════════════════════════════════════════════ */

export type GroupKey = "drink" | "mix" | "eat";

export const GROUPS: { key: GroupKey; label: string; hint: string }[] = [
  { key: "drink", label: "마시는 것", hint: "뚜껑만 열어 바로 마시는 완제품" },
  { key: "mix", label: "타 먹는 것", hint: "물이나 우유에 타 먹는 가루" },
  { key: "eat", label: "먹는 것", hint: "그대로 먹거나 떠먹는 제품" },
];

export type CatKey =
  | "rtd"
  | "soymilk"
  | "powder"
  | "chicken"
  | "bar"
  | "yogurt"
  | "snack";

export type Category = {
  key: CatKey;
  label: string;
  group: GroupKey;
  /**
   * products.json 의 `cat` 값. null 이면 아직 표본을 모으지 않은 카테고리다.
   * ⚠️ 데이터 값(「RTD 음료」·「파우더」)은 건드리지 않는다 — 바꾸면 파이프라인을
   *    다시 돌려야 하고 food_cd 가 바뀌어 사진 연결이 끊긴다.
   */
  data: string | null;
  /** 영양값을 무엇 기준으로 적는가. 카테고리마다 다르다 */
  serving: string;
  /**
   * 🔴 카테고리 아이콘 = **제형** (2026-08-08 · 팀 지시 「적합한 곳에 아이콘」).
   * 이 서비스의 카테고리를 정의하는 것이 「먹는 형태」라(위 GROUPS 주석) 그림으로
   * 바로 읽힌다 — 병·우유팩·스푼·고기·바·컵·과자.
   * ⚠️ 매핑을 여기 둔다. 칩·드롭다운·시트가 각자 아이콘을 고르면 화면마다 달라진다.
   */
  icon: IconName;
};

export const CATEGORIES: Category[] = [
  { key: "rtd", label: "프로틴 드링크", group: "drink", data: "RTD 음료", serving: "1병", icon: "bottle" },
  { key: "soymilk", label: "두유", group: "drink", data: "두유", serving: "1팩", icon: "milk" },
  { key: "powder", label: "프로틴 파우더", group: "mix", data: "파우더", serving: "1회분 30g", icon: "bowl-spoon" },
  /* 🔴 아래 넷과 두유는 **쿠팡 랭킹이 목록을 정한다** (2026-08-07 밤).
     C002 일일 한도로 못 채웠던 닭가슴살·그릭요거트가 이걸로 켜졌다 —
     식약처 슬라이스에는 아예 없던 부류라 우리 힘으로는 못 만들던 칸이다. */
  { key: "chicken", label: "닭가슴살", group: "eat", data: "닭가슴살", serving: "1팩", icon: "meat" },
  { key: "bar", label: "단백질바", group: "eat", data: "단백질바", serving: "1개", icon: "chocolate" },
  { key: "yogurt", label: "그릭요거트", group: "eat", data: "그릭요거트", serving: "1컵", icon: "cup" },
  { key: "snack", label: "과자류", group: "eat", data: "과자류", serving: "1봉", icon: "cookie" },
];

export const CAT_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function catOf(key: string | undefined): Category | null {
  return (key && CAT_BY_KEY.get(key as CatKey)) || null;
}

/** 표본 크기. 카테고리마다 같은 수를 담아야 카테고리끼리 견줄 때 기울지 않는다 */
export const SAMPLE_SIZE = 30;

/* ── 표본 30개를 고르는 규칙 ──────────────────────────────────────────

   🔴 **품질 판정이 아니다.** 재는 것은 「이 제품에 대해 우리가 아는 것이
      얼마나 갖춰져 있는가」다 — 사진이 없거나 원재료가 뭉뚱그려져 있으면
      화면에 띄워도 할 말이 없다. 좋은 제품 순이 아니라 **말할 수 있는 것이
      많은 제품 순**이고, 동점은 노출 많은 순으로 가른다.

   점수 재료는 전부 화면이 이미 쓰는 사실이다. 새 판정을 만들지 않는다.
     +4    1회 환산 성립          환산이 안 되면 영양 줄을 못 적는다
     +1×5  다섯 축 신고           단백질·칼로리·당류·탄수화물·지방
     +3~0  원재료 공개도          알 수 없는 표기 비율 (0% / 10% / 25% / 그 위)
     −2    원재료 미신고
     +1    원료 계통 확인 · +1 브랜드 확인 · +1 사진 있음
     −4    제품명이 내세운 원료가 신고 목록에 없음
     −3    신고 열량이 단백질과 앞뒤가 안 맞음
   ───────────────────────────────────────────────────────────────── */

/** 정제 등급 표기는 신고 서식에 원래 안 적힌다 — 글자가 없다고 불일치가 아니다 */
const REFINED_CLAIMS = new Set(["WPI", "WPC", "WPH", "MPI", "MPC", "ISP", "아이솔레이트"]);

function scoreOf(p: Product): number {
  let s = 0;
  if (p.protPack != null) s += 4;
  for (const v of [p.prot, p.kcal, p.sugar, p.carb, p.fat]) if (v != null) s += 1;

  const total = p.ings.length;
  if (total === 0) s -= 2;
  else {
    const ratio = p.ings.filter((n) => OPAQUE_NAMES.has(n)).length / total;
    if (ratio === 0) s += 3;
    else if (ratio <= 0.1) s += 2;
    else if (ratio <= 0.25) s += 1;
  }

  if (p.base !== "원료 불명확") s += 1;
  if (p.brand) s += 1;
  if (p.img) s += 1;

  if (p.claim && p.claimRank == null && !REFINED_CLAIMS.has(p.claim)) s -= 4;
  /* ⚠️ 미신고와 모순은 다른 사안이다 — 둘 다 신고돼 있는데 어긋난 경우만 깎는다.
     미신고는 위 축 점수가 이미 셌으므로 두 번 깎으면 안 된다. */
  if (p.prot != null && p.kcal != null && !energyConsistent(p)) s -= 3;

  return s;
}

const scoreCache = new Map<string, number>();
export function sampleScore(p: Product): number {
  let s = scoreCache.get(p.id);
  if (s == null) {
    s = scoreOf(p);
    scoreCache.set(p.id, s);
  }
  return s;
}

/* ── 추가 수록 ── 목록과 그 이유는 `lib/extras.ts` 에 있다 ─────────── */

/** 쿠팡 목록 밖에서 덧붙인 제품인가 — 화면은 이걸 보고 순위 숫자를 비운다 */
export const isExtra = (p: Product): boolean => EXTRA_IDS.has(p.id);

const byId = new Map(products.map((p) => [p.id, p]));

/** 표본 뒤에 추가 수록을 붙인다. 이미 표본에 든 것은 두 번 넣지 않는다 */
function withExtras(list: Product[], data: string): Product[] {
  const has = new Set(list.map((p) => p.id));
  const add = (EXTRAS[data] ?? [])
    .filter((id) => !has.has(id))
    .map((id) => byId.get(id))
    .filter((p): p is Product => p != null);
  return add.length ? [...list, ...add] : list;
}

/* 카테고리별 표본을 빌드 때 한 번 고른다.
   🔴 **고르는 방식이 카테고리마다 다르다** (2026-08-07 밤).
      쿠팡이 목록을 준 다섯은 **순위 그대로** 쓴다 — 우리가 다시 고르면 팀이
      「쿠팡을 상위 데이터로 취급한다」고 정한 것을 뒤집는 셈이다.
      나머지 둘(드링크·파우더)만 정보 충실도로 고른다. */
const samples = new Map<CatKey, Product[]>();
for (const c of CATEGORIES) {
  if (!c.data) {
    samples.set(c.key, []);
    continue;
  }
  if (COUPANG_CATS.includes(c.data)) {
    samples.set(c.key, withExtras(coupangOf(c.data).slice(0, SAMPLE_SIZE), c.data));
    continue;
  }
  const picked = products
    .filter((p) => p.cat === c.data)
    .sort(
      (a, b) =>
        /* 🔴 고정한 제품은 점수와 무관하게 표본에 든다 (lib/extras.ts 의 PINNED).
           목록에 없는 제품을 1위로 세울 수는 없어서다 — 자리는 뒤가 하나 밀린다.
           ⚠️ 노출 수가 0이라 그대로 두면 195건 중 186번째다. */
        pinRank(b.id) - pinRank(a.id) ||
        sampleScore(b) - sampleScore(a) ||
        b.pop - a.pop ||
        b.popMatch - a.popMatch ||
        a.name.localeCompare(b.name, "ko"),
    )
    .slice(0, SAMPLE_SIZE);
  samples.set(c.key, withExtras(picked, c.data));
}

/** 한 카테고리의 표본 */
export function sampleOf(key: CatKey): Product[] {
  return samples.get(key) ?? [];
}

/** 표본 전체. 카테고리 순서대로 이어 붙인다 */
export const ALL_SAMPLE: Product[] = CATEGORIES.flatMap((c) => sampleOf(c.key));

const catByProductId = new Map<string, Category>();
for (const c of CATEGORIES) for (const p of sampleOf(c.key)) catByProductId.set(p.id, c);

/** 이 제품이 어느 카테고리 표본에 들었나 */
export function categoryOfProduct(p: Product): Category | null {
  return catByProductId.get(p.id) ?? null;
}

export function countOf(key: CatKey): number {
  return sampleOf(key).length;
}

export function groupCount(g: GroupKey): number {
  return CATEGORIES.filter((c) => c.group === g).reduce((n, c) => n + countOf(c.key), 0);
}

export const TOTAL = ALL_SAMPLE.length;

/** 아직 표본이 없는 카테고리 */
export const PENDING = CATEGORIES.filter((c) => !c.data);
