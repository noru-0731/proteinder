import { catLabel, type Product } from "./data";
import { lactoseClear } from "./filters";
import { REFINED_CLAIMS } from "./grades";
import { subject, topic } from "./josa";
import { nutritionStandings } from "./nutrition-grades";

/**
 * 「이 제품을 고르는 이유」 두 열 — 드링크메모의 `#recommendation-guide` 자리
 * (2026-08-08 · 팀 지시).
 *
 * 🔴 **「좋다 / 나쁘다」가 아니라 「무엇을 우선하는 사람에게 어떤가」다** (원칙 7).
 *    조건 줄은 늘 사람 쪽에서 시작한다 — 「단백질을 우선한다면」·「열량을 줄이려면」.
 *    근거 줄은 신고값과 분포 위치만 적는다.
 *
 * 🔴 **한쪽이 비면 그 열을 안 띄운다.** 드링크메모는 늘 2열이라 채울 말이 없을 때
 *    억지 문장이 들어갔고, 실제로 아벨라워 카드 안에 글렌피딕 결론이 섞여 있었다.
 *    (실측: `마이밀 뉴프로틴 오리지널`은 다섯 축이 D·C·D·C·D 라 왼쪽 열이 0항목이다.)
 *
 * ⚠️ 재료는 전부 이 화면이 이미 쓰는 것이다 — 오각형 등급(`nutritionStandings`) ·
 *    유당불내증 판정(`lactoseClear`) · 계통(`base`) · 이름 클레임(`claim`).
 *    새 판정을 만들지 않는다.
 * ⚠️ 열당 세 항목까지. 다섯 축이 전부 A 인 제품이 있어 그대로 두면 한 열이 길어진다.
 */

export type FitItem = {
  key: string;
  /** 굵은 조건 한 줄 — 사람 쪽에서 시작한다 */
  cond: string;
  /** 근거 한 줄 — 신고값과 분포 위치 */
  why: string;
};

export type Fit = { yes: FitItem[]; no: FitItem[] };

const MAX_PER_COL = 3;

/** 축마다 「이걸 우선한다면」에 해당하는 말 */
const WANT: Record<string, string> = {
  prot: "단백질을 우선한다면",
  kcal: "열량을 줄이려면",
  sugar: "단맛 원료를 피하려면",
  carb: "탄수화물을 줄이려면",
  fat: "지방을 피하고 싶다면",
};

/** A(반기는 쪽) / D(그 반대) 일 때 근거 줄에 쓰는 방향 낱말 */
const SIDE: Record<string, [good: string, bad: string]> = {
  prot: ["많은 쪽", "적은 쪽"],
  kcal: ["낮은 쪽", "높은 쪽"],
  sugar: ["적은 쪽", "많은 쪽"],
  carb: ["적은 쪽", "많은 쪽"],
  fat: ["적은 쪽", "많은 쪽"],
};

const UNIT: Record<string, string> = {
  prot: "g",
  kcal: "kcal",
  sugar: "g",
  carb: "g",
  fat: "g",
};

const whole = (v: number) => Math.round(v).toLocaleString("ko-KR");

/** ⚠️ 이름이 `filters.ts` 의 `fitOf`(조건 칩 찾기)와 겹치지 않게 둔다 — 다른 일이다 */
export function fitReasonsOf(p: Product): Fit | null {
  const yes: FitItem[] = [];
  const no: FitItem[] = [];
  const cat = catLabel(p.cat);

  for (const a of nutritionStandings(p)) {
    if (a.value == null || (a.grade !== "A" && a.grade !== "D")) continue;
    const good = a.grade === "A";
    const side = SIDE[a.key][good ? 0 : 1];
    (good ? yes : no).push({
      key: a.key,
      cond: WANT[a.key],
      why: `${p.packLabel} ${whole(a.value)}${UNIT[a.key]} — 수록 ${cat} ${a.n}건에서 ${side}입니다.`,
    });
  }

  /* 🔴 유당은 「신고서에 없다」까지만 적는다. 「안 들었다」가 아니다 —
     유당은 유청단백분말 **안에** 있고 신고서는 그 안의 조성을 적지 않는다. */
  if (lactoseClear(p))
    yes.push({
      key: "lactose",
      cond: "유당이 불편하다면",
      why: "신고 원재료에 우유에서 온 것이 없고, 우유가 숨을 수 있는 뭉뚱그린 표기도 없습니다.",
    });

  if (p.base === "식물성")
    yes.push({
      key: "plant",
      cond: "식물성으로 고르려면",
      why: "확인된 단백질 계통이 식물성입니다 — 동물성 원료가 확인되지 않았다는 뜻까지입니다.",
    });

  /* 이름이 내세운 원료가 신고 목록에 없는 경우 (산양유 사례).
     제품이 나쁘다는 말이 아니라 **신고서로 확인되지 않는다**까지가 우리 진술이다. */
  if (p.claim && p.claimRank == null && !REFINED_CLAIMS.has(p.claim))
    no.push({
      key: "claim",
      cond: `${p.claim}${topic(p.claim)} 보고 고르려면`,
      why: `제품명이 내세운 ${p.claim}${subject(p.claim)} 신고 원재료 목록에서 확인되지 않습니다.`,
    });

  if (!yes.length && !no.length) return null;
  return { yes: yes.slice(0, MAX_PER_COL), no: no.slice(0, MAX_PER_COL) };
}
