import raw from "@/data/products.json";
import ingredientRaw from "@/data/ingredients.json";
import { coupangProducts } from "./coupang";
import { EXTRA_IDS } from "./extras";

export type Product = {
  id: string;
  rpt: string;
  name: string;
  // 제조사는 내보내지 않는다 — 신고값이 위탁생산 공장명이라 브랜드가 아니다.
  // 「더단백 워터 프로틴」의 제조사가 「(주)삼양패키징광혜원공장」으로 적혀 있다.
  /** 식약처 신고 식품유형 (88종). 소비자용이 아니라 출처 표기용 */
  type: string;
  /** 카테고리 — 어느 선별 목록에서 왔는가 */
  cat: string;
  /**
   * 브랜드 — 제품명 앞머리에서 뽑는다 (10_작업/data/food/curated/brands.csv).
   * 신고 제조사와 다르다. 제조사는 위탁생산 공장명이라 브랜드가 아니다.
   * 목록에 없으면 빈 문자열 — 추측하지 않는다.
   */
  brand: string;
  /** 맛 — 제품명에 적힌 것만. 이름에 없으면 빈 배열 */
  flavors: string[];
  /** 포장 — 어떻게 담겨 있는가. 신고값이 모순이면 빈 문자열 */
  pack: string;
  /** 영양성분 신고 기준량 (100ml당 등). servSize 와 다르다 */
  basis: string;
  serv: string;
  size: string;
  kcal: number | null;
  prot: number | null;
  fat: number | null;
  carb: number | null;
  sugar: number | null;
  na: number | null;
  satfat: number | null;
  fiber: number | null;
  /**
   * 1회 섭취량당 환산값. 기준량이 없으면 null
   * RTD는 1병, 파우더는 1회분 30g 이다 — 통이 2kg이라 「1통당」은 의미가 없다
   */
  protPack: number | null;
  kcalPack: number | null;
  sugarPack: number | null;
  /** 위 환산값이 무엇 기준인지 — "1병(330ml)" · "1회분 30g" */
  packLabel: string;
  /** 1차 — 동물성 / 식물성 / 혼합 */
  base: string;
  /** 원재료에서 확인된 원료 코드 (WPC · MPI · ISP …) */
  codes: string[];
  /** 유청 세부(WPI·WPC·WPH)를 무엇으로 확인했는지 — 원재료 / 제품명 / 검색. 빈 값이면 미확인 */
  srcEvidence: string;
  /**
   * 인터넷 쇼핑몰에 이 이름으로 올라와 있는 목록 수 (0~20).
   * ⚠️ 판매량이 아니다. 팔린 개수는 어디에도 공개돼 있지 않다.
   */
  pop: number;
  /** 검색 상위 20건 중 제품명이 일치한 결과 수 (0~20). 동점을 가를 때 쓴다 */
  popMatch: number;
  /** 2차 — 고르는 목적 */
  tags: string[];
  ings: string[];
  top: string;
  opaque: boolean;
  src: string;
  srcRank: number | null;
  claim: string;
  claimSrc: string;
  claimRank: number | null;
  date: string;
  img: string | null;
  /** 사진 매칭 신뢰도 0~1. 화면에는 쓰지 않고 어떤 사진이 덜 미더운지 추적용 */
  imgScore: number | null;
};

/**
 * 🔴 **수록은 app3 규칙을 따른다** (2026-08-07 밤 · ver1 상세를 그대로 옮기면서
 *    이 한 줄만 바꿨다).
 *
 *    ver1 은 products.json 을 통째로 썼다. app3 는 두 갈래에서 온다 —
 *      프로틴 드링크·파우더   식약처 신고 476건
 *      나머지 다섯 카테고리   쿠팡 TOP 30 (lib/coupang.ts)
 *
 *    ⚠️ products.json 에 남아 있는 두유·단백질바·과자류의 **식약처판**은 뺀다.
 *       쿠팡 파일을 받기 전에 우리가 골라 둔 것이라, 같이 실으면 한 카테고리에
 *       두 벌이 뜬다. 데이터 파일은 그대로 둔다 (쿠팡 쪽 영양의 출처로 쓰고 있다).
 *
 *    ⚠️ 쿠팡에서 온 150건은 Product 의 절반만 채워져 있다 (영양 90 · 원재료 23).
 *       등급·순위 계산은 값이 없으면 알아서 빠지므로 섞어도 안전하다 —
 *       실제로 「영양성분 미확보」로 그려진다.
 */
const SIK_CATS = new Set(["RTD 음료", "파우더"]);
/* ⚠️ 「추가 수록」만 이 필터를 통과한다 — 쿠팡 목록에 없는 성질(두유의 당류 0g 처럼)을
      채우려고 손으로 골라 둔 몇 건이다. 나머지 식약처판은 그대로 뺀다 (lib/extras.ts) */
export const products = [
  ...(raw as Product[]).filter((p) => SIK_CATS.has(p.cat) || EXTRA_IDS.has(p.id)),
  ...(coupangProducts as unknown as Product[]),
];

const ingredientData = ingredientRaw as {
  total: number;
  items: { name: string; count: number }[];
};

/** 등장 횟수 상위 원재료 (전체가 아니라 상위 400종) */
export const ingredientCounts = ingredientData.items;

/** 수록 제품에 등장하는 고유 원재료 전체 종수 */
export const ingredientTotal = ingredientData.total;

/**
 * 카테고리 — 10_작업/data/food/curated/ 안의 선별 목록 하나가 카테고리 하나다.
 * 제품명으로 제형을 추측하지 않는다. 목록에 넣은 것만 수록한다.
 */
/* 🔴 일곱으로 늘었다 (2026-08-07 밤) — 다섯은 쿠팡 랭킹이 목록을 준 카테고리다.
   ⚠️ 데이터 값(「RTD 음료」)은 그대로다. 화면 이름만 CATEGORY_LABEL 이 갈아 끼운다. */
export const CATEGORIES = [
  "RTD 음료",
  "두유",
  "파우더",
  "닭가슴살",
  "단백질바",
  "그릭요거트",
  "과자류",
] as const;

// 포장(통·묶음·낱개) 필터는 걷어냈다. p.pack 은 데이터에 남아 있지만 화면에 쓰지 않는다.

/**
 * 🔴 **화면에 적는 이름은 데이터 값과 다르다** (2026-08-06 · 팀 검수판 「프로틴 엑셀 필터」).
 *
 *   데이터   RTD 음료 · 파우더        ← curated/ 목록 이름. 건드리지 않는다
 *   화면     프로틴 음료 · 프로틴 파우더
 *
 * ⚠️ **데이터 값을 바꾸지 않는 이유** — `products.json` 의 `cat`, 선별 목록 CSV,
 *    `verify_*.py` 가 전부 이 문자열을 키로 쓴다. 이름 하나 고치려고 파이프라인을
 *    다시 돌리면 `food_cd` 가 바뀌고 사진 연결이 끊긴다.
 *    화면에 뜨는 자리에서만 갈아 끼운다 — `catLabel()`.
 */
/* 🔴 셋은 `lib/format.ts` 로 옮겼다 (2026-08-08 · 번들 실측). 순수 함수인데 이 파일에
   있어서, `catLabel` 하나 쓰려고 `./data` 를 부르면 제품 626건이 클라이언트 번들에
   통째로 실렸다 (776KB). 기존 import 가 안 깨지게 여기서 그대로 다시 내보낸다.
   ⚠️ **클라이언트 컴포넌트는 `lib/format.ts` 에서 직접 가져올 것.** 여기서 받으면
      products.json 이 다시 딸려온다. */
export { CATEGORY_LABEL, catLabel, formatWhole, formatNum } from "./format";

/**
 * 카테고리 설명 — 두 줄이다. 둘째 줄은 **이 카테고리의 수치가 무엇 기준인가**다.
 * 카드·상세의 숫자가 무엇 기준인지 필터에서 미리 알려 준다.
 */
export const CATEGORY_HINT: Record<string, string[]> = {
  "RTD 음료": ["뚜껑만 열어 바로 마시는 완제품 음료", "1병 기준"],
  두유: ["콩으로 만든 완제품 음료", "1팩 기준"],
  파우더: ["물이나 우유에 타 먹는 가루", "1스쿱(30g) 기준"],
  닭가슴살: ["그대로 먹는 조리·가공 닭가슴살", "1팩 기준"],
  단백질바: ["한 손에 드는 바 형태", "1개 기준"],
  그릭요거트: ["떠먹는 농후발효유", "1컵 기준"],
  과자류: ["단백질을 내세운 과자·스낵", "1봉 기준"],
};

/**
 * 원료 계통 트리 — 계통(상위) · 원료군(중위) · 원료(하위).
 *
 * ⚠️ 상위와 하위는 포함 관계가 아니다.
 *    상위는 제품 하나가 하나만 갖는다(p.base). 하위는 여러 개일 수 있다(p.codes).
 *    그래서 「동물성 142건」보다 「ISP 294건」이 크다 — ISP가 든 제품 상당수는
 *    동물성 원료도 함께 신고돼 있어 상위에서는 「혼합」으로 잡힌다.
 */
export type SourceLeaf = { code: string; label: string };
export type SourceGroup = { label?: string; leaves: SourceLeaf[] };
export type SourceBranch = {
  base: string;
  hint?: string;
  note?: string;
  groups: SourceGroup[];
};

export const SOURCE_TREE: SourceBranch[] = [
  {
    base: "동물성",
    hint: "우유에서 나온 단백질이 대부분",
    groups: [
      {
        label: "유청단백질",
        leaves: [
          // ⚠️ 신고 원재료는 대개 「유청단백분말」까지만 적혀 있어 농축·분리가 갈리지 않는다.
          //    갈리지 않는 것을 갈렸다고 적지 않는다 — 이 칸이 그 정직한 값이다.
          { code: "유청", label: "유청 (구분 없음)" },
          { code: "WPI", label: "분리유청단백 (WPI)" },
          { code: "WPC", label: "농축유청단백 (WPC)" },
          { code: "WPH", label: "가수분해유청단백 (WPH)" },
        ],
      },
      {
        label: "우유단백질",
        leaves: [
          { code: "MPI", label: "분리우유단백 (MPI)" },
          { code: "MPC", label: "농축우유단백 (MPC)" },
        ],
      },
      {
        label: "그 밖의 동물성",
        leaves: [
          { code: "카제인", label: "카제인" },
          { code: "산양유", label: "산양유" },
          { code: "초유", label: "초유" },
          { code: "난백", label: "난백" },
          { code: "콜라겐", label: "콜라겐" },
        ],
      },
    ],
  },
  {
    base: "식물성",
    hint: "동물성 원료가 확인되지 않음",
    groups: [
      {
        leaves: [
          { code: "ISP", label: "분리대두단백 (ISP)" },
          { code: "대두단백", label: "대두단백" },
          { code: "완두단백", label: "완두단백" },
          { code: "현미·쌀단백", label: "현미·쌀단백" },
        ],
      },
    ],
  },
  {
    base: "혼합",
    hint: "동물성과 식물성이 함께 확인됨",
    note: "동물성 + 식물성",
    groups: [],
  },
  // 🔴 「원료 불명확」 가지를 뺐다 (2026-08-06).
  //    원재료 신고가 없는 141건은 select_products.py 가, 표기로 계통을 못 정하는 19건은
  //    export_app_data.py 가 각각 수록에서 제외한다. 그래서 이 값을 가진 제품이 0건이다.
  //    ⚠️ 세 곳이 한 덩어리다 — 되돌리려면 두 스크립트와 이 배열을 같이 되돌린다.
  //       가지만 되살리면 아무것도 안 걸리는 빈 필터가 되고,
  //       스크립트만 되돌리면 필터에 없는 계통을 가진 제품이 생긴다.
];

/** 중위 항목은 아래 코드를 한꺼번에 고른다 */
export const CODE_GROUPS: Record<string, string[]> = Object.fromEntries(
  SOURCE_TREE.flatMap((b) =>
    b.groups
      .filter((g) => g.label)
      .map((g) => [g.label as string, g.leaves.map((l) => l.code)]),
  ),
);

/** 트리에서 고른 값 하나를 실제 원료 코드 목록으로 편다 */
export function resolveCodes(value: string): string[] {
  return CODE_GROUPS[value] ?? [value];
}

const baseCounts = new Map<string, number>();
const codeCounts = new Map<string, number>();
for (const p of products) {
  baseCounts.set(p.base, (baseCounts.get(p.base) ?? 0) + 1);
  for (const c of p.codes) codeCounts.set(c, (codeCounts.get(c) ?? 0) + 1);
}

export const baseCount = (base: string) => baseCounts.get(base) ?? 0;

/** 그 원료가 든 제품 수. 중위 항목은 하위 코드의 합집합이라 단순 합이 아니다 */
export function sourceCount(value: string): number {
  const codes = resolveCodes(value);
  if (codes.length === 1) return codeCounts.get(codes[0]) ?? 0;
  return products.filter((p) => p.codes.some((c) => codes.includes(c))).length;
}

/**
 * 1차 — 단백질 원료 계통. 10_작업/scripts/tags.py 가 붙인다.
 * 동물성 · 식물성 · 혼합 셋뿐이다 — 계통을 특정 못한 제품은 수록하지 않는다.
 */
// 계통 목록과 설명은 SOURCE_TREE 안으로 들어갔다 — 트리 한 곳에서만 정의한다.

/** 2차 — 고르는 목적. 근거가 확인된 것만 붙는다 */
export const TAGS = ["고단백", "저열량", "당류 0", "식물성", "락토프리"] as const;

export const TAG_HINT: Record<string, string> = {
  고단백: "1회 섭취량에 단백질 20g 이상 — RTD는 1병, 파우더는 1회분 30g",
  // 파우더에는 붙지 않는다. 30g 가루의 열량은 제품이 아니라 무게가 정해서
  // 394건의 88%가 120kcal 이하다. 갈리지 않는 것으로 판정하지 않는다.
  저열량: "1병에 150kcal 이하 — RTD에만 붙는다",
  "당류 0": "당류 0g 신고",
  식물성: "동물성 원료 없이 식물성만 확인됨",
  락토프리: "유당 무첨가 표시",
};

/**
 * 맛 — 제품명에 적힌 것만 뽑는다 (10_작업/scripts/tags.py).
 *
 * ⚠️ 어휘를 10종으로 고정했다. 팀 검수판 표기가 「곡물맛」과 「곡물」,
 *    「다크초코」와 「초코」로 갈려 있어 그대로 쓰면 필터가 쪼개진다.
 * ⚠️ 한 제품에 여러 개 붙는다 — 「초코바나나맛」은 초코이면서 바나나다.
 *    그래서 아래 건수의 합은 수록 건수보다 크다.
 */
export const FLAVORS = [
  "초코",
  "곡물",
  "과일",
  "커피",
  "딸기",
  "바나나",
  "쿠키앤크림",
  "플레인",
  "녹차",
  "바닐라",
] as const;

export const FLAVOR_HINT: Record<string, string> = {
  곡물: "고소한맛 · 오곡 · 흑임자 · 검은콩 · 고구마 등",
  과일: "망고 · 복숭아 · 자몽 · 청사과 등",
  커피: "커피 · 라떼 · 모카 · 밀크티",
  쿠키앤크림: "쿠키앤크림 · 크런치 · 카스테라 · 티라미수",
  플레인: "무맛 · 오리지널 · 언스위트",
  녹차: "녹차 · 말차 · 얼그레이",
};

const brandCounts = new Map<string, number>();
const flavorCounts = new Map<string, number>();
for (const p of products) {
  if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  for (const f of p.flavors) flavorCounts.set(f, (flavorCounts.get(f) ?? 0) + 1);
}

/** 수록 제품이 있는 브랜드만, 많은 순. 목록에 없는 제품은 여기 안 나온다 */
export const BRANDS: { name: string; count: number }[] = [...brandCounts]
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));

export const flavorCount = (flavor: string) => flavorCounts.get(flavor) ?? 0;

/** 사이드바에 처음부터 펼쳐 두는 브랜드 수. 나머지는 「더보기」 */
export const BRAND_VISIBLE = 12;

/** 표기만으로는 무엇이 들었는지 알 수 없는 원재료명 */
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

/**
 * 100kcal당 단백질 g — 용량이 제각각인 제품을 같은 자로 재기 위한 값.
 *
 * ⚠️ 신고값끼리 앞뒤가 안 맞는 레코드는 순위에서 뺀다.
 *    단백질 1g은 그 자체로 4kcal다. 그러니 신고 열량이 「단백질 × 4」보다
 *    한참 낮으면 둘 중 하나는 오기이며, 어느 쪽이 틀렸는지 우리는 모른다.
 *    실제로 「에디슨160」이 100ml당 단백질 4.2g · 열량 2.0kcal 로 신고돼
 *    100kcal당 210g 이라는 값으로 1위에 올라와 있었다.
 *    고치지 않고 비교에서 뺀다 — 우리가 숫자를 만들어내지는 않는다.
 */
const KCAL_PER_PROTEIN_G = 4;
const REPORT_TOLERANCE = 0.9; // 반올림·식이섬유 계상 차이를 감안한 여유

export function isEnergyConsistent(p: Product): boolean {
  if (!p.prot || !p.kcal) return false;
  return p.kcal >= p.prot * KCAL_PER_PROTEIN_G * REPORT_TOLERANCE;
}

export function density(p: Product): number {
  if (!isEnergyConsistent(p)) return -1;
  return (p.prot! / p.kcal!) * 100;
}

/** 단백질이 전체 열량에서 차지하는 비율 */
export function proteinShare(p: Product): number | null {
  if (p.prot == null || !p.kcal) return null;
  return Math.min(100, Math.round(((p.prot * 4) / p.kcal) * 100));
}

/* ══════════════════════════════════════════════════════════════════════
   같은 카테고리 안에서의 위치
   ══════════════════════════════════════════════════════════════════════

   🔴 「100kcal당 단백질」을 쓰다가 뺐다 (2026-08-06).
      두 카테고리를 한 자로 재려고 만든 파생값이었는데, **재는 것이 단백질이
      아니었다.** RTD 1위가 `테이크핏 아쿠아`(1병 단백질 10g)로 올라와
      1병 60g인 `테이크핏 익스트림`보다 위에 섰다. 물에 가까울수록 높아지는 값이다.

   → **파생값을 버리고 신고값을 그대로 쓴다.** `prot` 하나가 카테고리에 따라
      다른 이름을 갖는다. 우리가 계산한 값이 아니라 신고서에 적힌 값이다.

        파우더  100g당 단백질 g  =  곧 **순도 %**       40 ~ 90
        RTD    100ml당 단백질 g =  **농도**            4.0 ~ 13.3

      파우더의 순도는 VOC 「1스쿱 30g에 24g(80%) vs 1스쿱 50g에 30g(60%)」
      그 자체다. 1회분 무게가 값에서 빠진다.

   근거 — 우리가 지어낸 자가 아니다
     · 프로틴랩(참조 사이트)이 「단백질 밀도 g/100ml」을 쓴다
     · Nutri-Score 2023 음료 단백질 점수도 100ml당이다 (1.2~3.0g 스케일)

   ⚠️ 카테고리를 섞어 재지 않는다. 단위부터 다르다(g/100g vs g/100ml).
   ⚠️ 신고값이 이상한 레코드는 척도에서 뺀다 — 아래 usableProt() 참조.
*/

/**
 * 이 제품의 `prot` 을 비교 척도에 넣어도 되는가.
 *
 * 🔴 `프로틴투오 피치망고`가 100ml당 15g 으로 신고돼 있다. 실제로는 500ml 한 병에
 *    15g 인데 그 15가 100ml 칸에 들어갔다. 원본 신고서를 직접 확인했다 —
 *    우리가 잘못 읽은 게 아니라 신고서가 그렇다.
 *    이 4건을 그냥 두면 RTD 농도 순위 1~4위를 전부 차지한다.
 *
 * ⚠️ 「용량 미확인」 3건은 뺄 이유가 없다. 한 병에 얼마가 담기는지 모를 뿐
 *    100ml당 값 자체는 멀쩡하다. packLabel 앞머리로 둘을 가른다.
 */
function usableProt(p: Product): number | null {
  if (p.prot == null || p.prot <= 0) return null;
  if (p.packLabel.startsWith("1병당 미산출")) return null;
  return p.prot;
}

/** 카테고리별로 「이 값이 곧 무엇인가」 */
const METRIC: Record<string, { label: string; unit: string; hint: string }> = {
  "RTD 음료": {
    label: "100ml당 단백질",
    unit: "g",
    hint: "병 크기가 값에서 빠지므로 용량이 다른 제품끼리도 같은 자로 재집니다.",
  },
  파우더: {
    label: "단백질 순도",
    unit: "%",
    hint: "1회분 무게가 값에서 빠지므로 스쿱 크기가 다른 제품끼리도 같은 자로 재집니다.",
  },
};

/**
 * 오름차순 배열에서 v 의 위치를 「상위 몇 %」로. 1 이 가장 앞이다.
 * dir="high" 는 클수록 앞(단백질), "low" 는 작을수록 앞(열량·당류).
 */
function percentile(sorted: number[], v: number, dir: "high" | "low"): number {
  return Math.max(1, Math.round((rankIn(sorted, v, dir) / sorted.length) * 100));
}

/**
 * 몇 번째인가. 1 이 가장 앞이다. 동점은 같은 등수를 받는다.
 *
 * 🔴 백분위 대신 **등수**를 화면에 적는다. 「상위 40%」·「하위 40%」는 방향을 나타내는
 *    낱말을 하나 더 읽어야 뜻이 잡히는데, 「271건 중 108위」는 그 낱말이 필요 없다.
 *    같은 사실이고 눈이 덜 든다.
 */
function rankIn(sorted: number[], v: number, dir: "high" | "low"): number {
  let ahead = 0;
  if (dir === "high") {
    for (let i = sorted.length - 1; i >= 0 && sorted[i] > v; i--) ahead++;
  } else {
    for (let i = 0; i < sorted.length && sorted[i] < v; i++) ahead++;
  }
  return ahead + 1;
}

function scaleOf(pick: (p: Product) => number | null): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (const p of products) {
    const v = pick(p);
    if (v == null) continue;
    const arr = m.get(p.cat);
    if (arr) arr.push(v);
    else m.set(p.cat, [v]);
  }
  for (const arr of m.values()) arr.sort((a, b) => a - b);
  return m;
}

const protScale = scaleOf(usableProt);
const packScales = {
  prot: scaleOf((p) => p.protPack),
  kcal: scaleOf((p) => p.kcalPack),
  sugar: scaleOf((p) => p.sugarPack),
};

export type Standing = {
  label: string;
  value: number;
  unit: string;
  hint: string;
  /** 같은 카테고리에서 상위 몇 % (1 = 가장 앞). 막대 위치에 쓴다 */
  top: number;
  /** 몇 번째인가 (1 = 가장 앞). 화면 문구에 쓴다 */
  rank: number;
  /** 비교에 쓴 모수 */
  n: number;
};

/** 이 카테고리의 표준 잣대 — 파우더는 순도 %, RTD 는 100ml당 단백질 g */
export function standing(p: Product): Standing | null {
  const v = usableProt(p);
  const meta = METRIC[p.cat];
  const arr = protScale.get(p.cat);
  if (v == null || !meta || !arr?.length) return null;
  return {
    ...meta,
    value: v,
    top: percentile(arr, v, "high"),
    rank: rankIn(arr, v, "high"),
    n: arr.length,
  };
}

export type Axis = {
  label: string;
  value: number;
  unit: string;
  top: number;
  rank: number;
  n: number;
};

/**
 * 1회 섭취량 기준 3축. 표준 잣대가 「진하기」라면 이쪽은 「실제로 몇 g 먹나」다.
 *
 * ⚠️ 열량·당류는 **적을수록 앞**이다. 「당류 상위 20%」라고만 적으면
 *    당이 많다는 뜻인지 적다는 뜻인지 알 수 없어 방향을 이름에 박는다.
 */
export function axes(p: Product): Axis[] {
  const out: Axis[] = [];
  const add = (
    label: string,
    v: number | null,
    unit: string,
    scale: Map<string, number[]>,
    dir: "high" | "low",
  ) => {
    const arr = scale.get(p.cat);
    if (v == null || !arr?.length) return;
    out.push({
      label,
      value: v,
      unit,
      top: percentile(arr, v, dir),
      rank: rankIn(arr, v, dir),
      n: arr.length,
    });
  };
  add("단백질 많은 쪽", p.protPack, "g", packScales.prot, "high");
  /* 🔴 열량은 RTD 에만 붙인다. 파우더 1회분 30g 의 열량은 제품이 아니라
     **가루의 무게**가 정한다 — 25% 108kcal · 중앙 113 · 75% 117 로 폭이 9kcal 다.
     게다가 단백질 자체가 4kcal/g 이라 순도가 높을수록 열량도 오른다.
     「열량 낮은 쪽 하위 27%」가 순도 90% 짜리 WPI 에 붙는다.
     이건 고른 게 아니라 저울을 읽는 값이다 —
     CLAUDE.md 가 「저열량」 태그를 RTD 전용으로 둔 것과 같은 이유다. */
  if (p.cat === "RTD 음료") add("열량 낮은 쪽", p.kcalPack, "kcal", packScales.kcal, "low");
  add("당류 적은 쪽", p.sugarPack, "g", packScales.sugar, "low");
  return out;
}

/**
 * 위치를 사람이 읽는 말로 — **등수**다.
 *
 * ❌ 폐기 — 「상위 N%」/「하위 N%」. 방향을 나타내는 낱말을 하나 더 읽어야 뜻이 잡혔고,
 *    「상위」로만 적었을 때는 가장 낮은 제품이 「271건 중 상위 100%」로 나와
 *    무슨 뜻인지 알 수 없었다 (`네슬레 마일로 드링크`). 뒤집어 적는 규칙을 두어 고쳤지만,
 *    **등수로 적으면 뒤집을 일 자체가 없다.**
 * ⚠️ 「몇 위」가 「좋은 제품」이라는 뜻은 아니다. 그래서 축 이름에 방향을 박아 둔다
 *    (「당류 적은 쪽 12위」). 이름을 빼면 12위가 많다는 뜻인지 적다는 뜻인지 모른다.
 */
export function rankPhrase(r: { rank: number }): string {
  return `${r.rank}위`;
}

export const SORTS = {
  /**
   * 기본 정렬. 인터넷 쇼핑몰에 그 이름으로 올라와 있는 목록이 많은 순이다.
   * 동점이면 이름이 일치한 검색 결과 수, 그다음 단백질 양으로 가른다.
   */
  popular: {
    label: "인기순",
    fn: (a: Product, b: Product) =>
      b.pop - a.pop || b.popMatch - a.popMatch || (b.prot ?? -1) - (a.prot ?? -1),
  },
  protein: {
    label: "단백질 많은순",
    fn: (a: Product, b: Product) => (b.prot ?? -1) - (a.prot ?? -1),
  },
  density: {
    label: "단백질 밀도순",
    fn: (a: Product, b: Product) => density(b) - density(a),
  },
  sugar: {
    label: "당류 적은순",
    fn: (a: Product, b: Product) => (a.sugar ?? 999) - (b.sugar ?? 999),
  },
  kcal: {
    label: "열량 낮은순",
    fn: (a: Product, b: Product) => (a.kcal ?? 9999) - (b.kcal ?? 9999),
  },
  ings: {
    label: "원재료 적은순",
    fn: (a: Product, b: Product) => a.ings.length - b.ings.length,
  },
} as const;

export type SortKey = keyof typeof SORTS;

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function productsWithIngredient(name: string): Product[] {
  return products.filter((p) => p.ings.includes(name));
}

/** 원재료가 배합 순서 몇 번째에 오는지의 분포 */
export function ingredientRankStats(name: string) {
  const ranks = products
    .map((p) => p.ings.indexOf(name) + 1)
    .filter((r) => r > 0)
    .sort((a, b) => a - b);
  if (!ranks.length) return null;
  return {
    count: ranks.length,
    first: ranks.filter((r) => r === 1).length,
    median: ranks[Math.floor(ranks.length / 2)],
  };
}

/** "10g", "250ml(g)" 같은 신고 표기에서 숫자만 뽑는다 */
export function parseServing(serv: string): number | null {
  const m = serv?.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

/**
 * 목록 카드용 — 소수점을 없앤 정수 표기.
 *
 * 🔴 0 과 「반올림해서 0」은 구분해서 적는다.
 *    당류가 정확히 0g 인 제품이 126건이고 「당류 0」 태그가 붙는 조건이다.
 *    0.1~0.4g 짜리 27건을 그냥 0g 으로 적으면 화면에서 그 둘이 같아진다 —
 *    태그가 없는 제품이 「당류 0」처럼 보인다. 그래서 `<1` 로 적는다.
 *    소수점은 없어지고 0 과도 갈린다.
 */

