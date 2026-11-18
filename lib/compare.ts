import type { Product } from "./data";
import { priceOf } from "./cart";
import { topic } from "./josa";
import {
  NUT_AXES,
  nutritionStandings,
  servScale,
  servValue,
  type NutAxisKey,
} from "./nutrition-grades";
import { healthTagsOf } from "./health-tags";

/**
 * 비교 탭의 행 정의 — 「무엇을 나란히 놓을 것인가」를 한 곳에서 정한다 (2026-08-08).
 *
 * 🔴 **승자를 칠하지 않는다** (원칙 7). 차이(▴▾)는 적되 어느 쪽이 좋다고 말하지 않는다 —
 *    단백질이 많은 게 좋은 사람과 칼로리가 낮은 게 좋은 사람이 다르기 때문이다.
 * 🔴 **카테고리가 섞이면 숫자 행을 견주지 않는다.** 1병과 1회분 30g 은 다른 자다.
 *    화면에서 경고를 띄우고 차이 표시를 끈다 — 이 서비스가 처음부터 지켜 온 선이다.
 * ⚠️ 행 순서는 「고를 때 걸리는 순서」다 — 가격·별점이 먼저, 성분이 그다음,
 *    못 먹을 이유(유당)가 마지막. 영양성분표 순서가 아니다.
 */
export type RowKind = "num" | "text" | "grade" | "mark";

/**
 * 🔴 **행을 절로 묶는다** (2026-08-08 · Apple 「모델 비교하기」 실측).
 *
 * 애플 비교표는 절이 **20개가 넘고** 각 절에 왼쪽 행 머리가 붙는다 —
 * `.compare-section` 49개, 첫 절이 **「요약」**이고 그다음이 저장 용량·디스플레이…
 * 우리는 13행을 죽 늘어놓고 있었다. 절이 없으면 「별점」 다음에 「칼로리」가 오고
 * 그다음에 「원료 계통」이 와도 눈이 어디서 끊어 읽어야 할지 모른다.
 *
 * ⚠️ 절 이름은 **고를 때 걸리는 순서**다 — 살 때(가격·별점) → 영양 → 원재료 →
 *    가려 먹는다면. 영양성분표 순서가 아니다.
 */
export const GROUPS = ["살 때", "1회 섭취 영양", "원재료", "가려 먹는다면"] as const;
export type GroupKey = (typeof GROUPS)[number];

export type CompareRow = {
  key: string;
  label: string;
  kind: RowKind;
  group: GroupKey;
  /** 숫자 행의 단위 */
  unit?: string;
  /** 값 — 숫자 행은 number, 나머지는 문자열/불리언 */
  get: (p: Product) => number | string | boolean | null;
  /**
   * 🔴 숫자 옆에 붙는 등급 (2026-08-08 · 팀 지시 「더 보기 명확하게」).
   *    전에는 「단백질 27g」과 「단백질 등급 A」가 **일곱 행 떨어져** 있었다 —
   *    값과 그 값의 위치를 같이 봐야 하는데 눈이 표를 위아래로 오갔다.
   *    행을 반으로 줄이면서 읽는 단위는 오히려 하나가 된다.
   */
  grade?: (p: Product) => "A" | "B" | "C" | "D" | null;
  /**
   * 🔴 **막대가 재는 축** (2026-08-08 · 팀 지적 「뭐가 우위인지 잘 안 보입니다」).
   *
   * 이 값이 있으면 막대 길이를 **분포 점수(score)** 로 그린다 — 0~1 이고 1이
   * 「흔히 반기는 쪽」 끝이다. 축 방향이 이미 들어 있어 **칼로리는 낮을수록 길어진다.**
   *
   * ❌ 전에는 「이 표 안 최댓값 대비」로 그렸다. 그러면 **칼로리 180kcal 이 가장 긴
   *    막대**가 되어 길수록 좋은 것처럼 읽혔다 — 다섯 축 중 넷에서 거꾸로였다.
   * ⚠️ 축이 없는 행(나트륨·원재료 종수·가격)은 **막대를 안 그린다.** 어느 쪽이
   *    반기는 쪽인지 우리가 정한 바 없다 (원칙 7).
   */
  axis?: NutAxisKey;
};

const gradeOf = (p: Product, axis: string) =>
  nutritionStandings(p).find((a) => a.key === axis)?.grade ?? null;

export const COMPARE_ROWS: CompareRow[] = [
  { key: "price", label: "가격", kind: "num", group: "살 때", unit: "원", get: (p) => priceOf(p.id)?.won ?? null },
  {
    key: "rating",
    label: "별점",
    kind: "text",
    group: "살 때",
    /* 별점은 Supabase 에 있어 서버가 모른다 — 열마다 클라이언트 부품이 채운다 */
    get: () => null,
  },
  /* 🔴 **다섯 축은 전부 `servValue` 로 읽는다** (2026-08-08 수정). 전에는
     protPack·kcalPack·sugarPack(이미 1회 환산된 값)과 carb·fat(100ml 원값)을
     **섞어** 쓰고 있었다. 열 머리에 「1병(260ml) 기준」이라 적힌 표에서
     `잇츠프로틴&고칼슘초코` 가 **당류 28g · 탄수화물 11.9g** 으로 떴다 —
     당류는 탄수화물의 부분집합이라 **있을 수 없는 표시**다 (실제 1병 탄수 31.0g).
     같은 제품의 상세는 처음부터 배수를 곱하고 있어 두 화면의 숫자도 달랐다.
     ⚠️ servValue 는 환산 불가(용량 미확인)면 null 을 준다 — 그때는 칸이 「—」가
        되는데, 그게 맞다. 1병당을 모르는 제품에 1병당 숫자를 적을 수는 없다.
     값과 등급을 한 칸에 적는다 — 「27g A」. 등급 전용 행 다섯을 없앤 자리다. */
  { key: "prot", label: "단백질", kind: "num", group: "1회 섭취 영양", unit: "g", get: (p) => servValue(p, "prot"), grade: (p) => gradeOf(p, "prot"), axis: "prot" },
  { key: "kcal", label: "칼로리", kind: "num", group: "1회 섭취 영양", unit: "kcal", get: (p) => servValue(p, "kcal"), grade: (p) => gradeOf(p, "kcal"), axis: "kcal" },
  { key: "sugar", label: "당류", kind: "num", group: "1회 섭취 영양", unit: "g", get: (p) => servValue(p, "sugar"), grade: (p) => gradeOf(p, "sugar"), axis: "sugar" },
  { key: "carb", label: "탄수화물", kind: "num", group: "1회 섭취 영양", unit: "g", get: (p) => servValue(p, "carb"), grade: (p) => gradeOf(p, "carb"), axis: "carb" },
  { key: "fat", label: "지방", kind: "num", group: "1회 섭취 영양", unit: "g", get: (p) => servValue(p, "fat"), grade: (p) => gradeOf(p, "fat"), axis: "fat" },
  /* 나트륨은 우리가 재는 다섯 축에 없다 — 등급을 붙일 근거가 없으니 값만 적는다.
     축이 아니라 servValue 가 없어 배수를 직접 받아 곱한다 (같은 자를 써야 한다) */
  {
    key: "na",
    label: "나트륨",
    kind: "num",
    group: "1회 섭취 영양",
    unit: "mg",
    get: (p) => {
      const f = servScale(p);
      return p.na != null && f != null ? p.na * f : null;
    },
  },

  { key: "base", label: "원료 계통", kind: "text", group: "원재료", get: (p) => p.base },
  { key: "first", label: "배합 1순위", kind: "text", group: "원재료", get: (p) => p.ings[0] ?? null },
  {
    key: "ings",
    label: "원재료 종수",
    kind: "num",
    group: "원재료",
    unit: "종",
    get: (p) => (p.ings.length ? p.ings.length : null),
  },
  {
    key: "lactose",
    label: "유당불내증 OK",
    kind: "mark",
    group: "가려 먹는다면",
    get: (p) => healthTagsOf(p).some((h) => h.key === "lactose"),
  },
  { key: "plant", label: "식물성", kind: "mark", group: "가려 먹는다면", get: (p) => p.base === "식물성" },
];

/* ══════════════════════════════════════════════════════════════════════
   「여기가 갈립니다」 — 표 위의 차이 요약 (2026-08-08 · 비교 UI 실측 반영).

   실측한 세 곳이 전부 표 앞에 **말**을 세운다 —
     Apple      비교표 첫 절이 스펙이 아니라 **「요약」**이다 (`.compare-section` 49개 중 6번째)
     Rtings     "which should you get" 한 문단이 점수표보다 위에 있다
     Versus     "why is X better than Y" 불릿이 화면의 절반이다

   🔴 **그런데 우리는 「better」를 못 쓴다** (원칙 7). 그래서 옮겨 온 것은 **자리**지
      문장 종류가 아니다 — 「어느 쪽이 낫다」가 아니라 **「어디서 값이 갈리는가」**를 적는다.
      차이의 방향(많다·적다)은 사실이고, 그게 좋은지는 목적마다 다르다.

   ⚠️ **카테고리가 섞이면 만들지 않는다.** 1병과 1회분 30g 을 빼면 안 된다.
   ⚠️ 축 순위는 **분포 안에서의 이동폭(score)** 으로 잰다 — g 과 kcal 은 단위가 달라
      원값 차이로 줄 세우면 늘 칼로리가 이긴다. score 는 오각형이 이미 쓰는 값이다.
   ══════════════════════════════════════════════════════════════════════ */

/** 큰 쪽을 가리키는 낱말 — 칼로리만 「높다」고 하고 나머지는 「많다」고 한다 */
const MORE: Record<NutAxisKey, string> = {
  prot: "많습니다",
  kcal: "높습니다",
  sugar: "많습니다",
  carb: "많습니다",
  fat: "많습니다",
};

export type DiffAxis = {
  key: NutAxisKey;
  label: string;
  unit: string;
  /** 값이 가장 큰 열 · 가장 작은 열의 0-based 자리 */
  hi: number;
  lo: number;
  hiVal: number;
  loVal: number;
  /** 두 개를 견줄 때 쓰는 문장 조각 — 「②가 49.4kcal 낮습니다」 */
  phrase: string;
};

export type DiffSummary = {
  /** 갈리는 축 — 이동폭 큰 순 */
  axes: DiffAxis[];
  /** 값이 완전히 같은 축의 이름들 */
  same: string[];
  n: number;
};

const AXIS_UNIT: Record<NutAxisKey, string> = {
  prot: "g",
  kcal: "kcal",
  sugar: "g",
  carb: "g",
  fat: "g",
};

/**
 * 고른 제품들이 **어느 축에서 갈리는가**. 카테고리가 섞였거나 둘 미만이면 null.
 * 🔴 승패를 정하지 않는다 — 큰 쪽·작은 쪽의 자리와 차이값만 준다.
 */
export function diffOf(ps: Product[]): DiffSummary | null {
  if (ps.length < 2) return null;
  if (new Set(ps.map((p) => p.cat)).size > 1) return null;

  const stands = ps.map((p) => nutritionStandings(p));
  const axes: (DiffAxis & { spread: number })[] = [];
  const same: string[] = [];

  for (const a of NUT_AXES) {
    const vals = stands.map((s) => s.find((x) => x.key === a.key)?.value ?? null);
    if (vals.some((v) => v == null)) continue;
    const nums = vals as number[];
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max === min) {
      same.push(a.label);
      continue;
    }
    const hi = nums.indexOf(max);
    const lo = nums.indexOf(min);

    /* 분포 안에서 얼마나 움직였나. 모수가 얕아 등급이 없는 카테고리는 score 가
       전부 0 이라 이동폭도 0 이 된다 — 그때는 값의 상대 폭으로 물러선다 */
    const scores = stands.map((s) => s.find((x) => x.key === a.key)?.score ?? 0);
    const byScore = Math.max(...scores) - Math.min(...scores);
    const spread = byScore > 0 ? byScore : (max - min) / (max || 1);

    const u = AXIS_UNIT[a.key];
    /* 두 개면 「②가 1.6g 많습니다」, 셋 이상이면 「②0g ~ ③6.5g」로 **양끝을 다 적는다**.
       🔴 「가장 적은 쪽 ②」라고만 적지 않는다 — 어느 끝을 부르느냐가 곧 방향이고,
          그건 우리가 정할 일이 아니다 (원칙 7). 양끝을 다 적으면 방향이 없다.
       ⚠️ 숫자는 표와 **같은 반올림**을 쓴다. 표가 「105 kcal」인데 문장이
          「104.5kcal」이면 읽는 사람이 어느 쪽을 믿을지 알 수 없다.
       ⚠️ 조사는 lib/josa.ts — 「단백질**은**」·「칼로리**는**」이 갈린다.
          하드코딩으로 한 번 틀렸던 자리다 (매칭 화면 「토와 금」). */
    const phrase =
      ps.length === 2
        ? `${a.label}${topic(a.label)} ${CIRCLE[hi]}가 ${fmtNum(max - min, u)} ${MORE[a.key]}`
        : `${a.label} ${CIRCLE[lo]}${fmtNum(min, u)} ~ ${CIRCLE[hi]}${fmtNum(max, u)}`;

    axes.push({
      key: a.key,
      label: a.label,
      unit: AXIS_UNIT[a.key],
      hi,
      lo,
      hiVal: max,
      loVal: min,
      phrase,
      spread,
    });
  }

  if (!axes.length && !same.length) return null;
  axes.sort((x, y) => y.spread - x.spread);
  /* spread 는 줄 세우는 데만 쓰는 내부 값이라 화면으로 안 내보낸다 */
  return { axes: axes.map((a) => ({ ...a, spread: undefined })) as DiffAxis[], same, n: ps.length };
}

/** 열 번호 — 차이 문장과 열 머리가 같은 기호를 쓴다 */
export const CIRCLE = ["①", "②", "③", "④"];

/** 두 값이 같은가 — 「같은 항목 숨기기」가 쓴다 */
export function allSame(vals: (number | string | boolean | null)[]) {
  if (vals.length < 2) return false;
  const [a, ...rest] = vals;
  return rest.every((v) => v === a);
}

/** 숫자 행의 기준 대비 차이. 기준이 없거나 같으면 null */
export function deltaOf(v: number | null, base: number | null) {
  if (v == null || base == null || v === base) return null;
  return v - base;
}

/**
 * ⚠️ 반올림 규칙을 **제품 상세와 같게** 맞춘다 (NutritionSummary 의 `round`) —
 *    100 이상은 정수, 그 아래는 소수 한 자리. 두 화면이 같은 값을 다르게 적으면
 *    (`210.6mg` vs `211mg`) 어느 쪽이 맞는지 읽는 사람이 알 수 없다.
 * ⚠️ **`.0` 을 떼어낸다.** 환산이 부동소수라 22 가 22.000000000000004 로 나오는데,
 *    그대로 두면 한 행에 「22 g」과 「22.0 g」이 나란히 서서 정밀도가 다른 값처럼
 *    보인다 (실제로 4열 표에서 그렇게 떴다).
 */
export const fmtNum = (v: number, unit?: string) => {
  if (unit === "원") return `${Math.round(v).toLocaleString()}원`;
  const n = v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, "");
  return `${n}${unit ? ` ${unit}` : ""}`;
};

/* 🔴 `lib/format.ts` 로 옮겼다 — 클라이언트 부품이 이 상수 하나 때문에 이 파일을
   부르면 products.json 이 통째로 번들에 실린다. 서버 쪽 기존 import 는 안 깨지게
   여기서 다시 내보낸다 (그쪽은 어차피 이 파일 전체를 쓴다). */
export { MAX_COMPARE } from "./format";
