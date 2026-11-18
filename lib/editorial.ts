import { catLabel, type Product } from "./data";
import { conj, subject, topic } from "./josa";
import { nutritionStandings } from "./nutrition-grades";
import { REFINED_CLAIMS } from "./grades";
import { groupIngredients, sweetenerKindOf } from "./ingredient-groups";
import { sourcesOf } from "./source-notes";

/**
 * 「프로틴더 에디터」 두 문단 — 드링크메모의 `#editor-intro` 자리 (2026-08-08 · 팀 지시).
 *
 * 🔴 **말투만 사람이고, 값은 전부 화면이 이미 말한 것이다.**
 *    드링크메모는 에디터 한 사람이 247건을 손으로 썼다. 우리는 631건이라 그럴 수 없다.
 *    그래서 문장을 규칙으로 조립하되 **새 숫자를 하나도 만들지 않는다** —
 *    등급은 오각형이 쓰는 `nutritionStandings` 를 그대로 받고, 원재료는 원재료 카드가
 *    쓰는 `groupIngredients` 를 그대로 받는다. 두 화면이 어긋날 수가 없다.
 *
 * 🔴 **별점·점수를 매기지 않는다.** 드링크메모가 무너진 지점은 「에디터가 썼다」가
 *    아니라 **가공 인물 넷에게 별점을 매겨 schema.org Review 로 내보낸 것**이다.
 *    사람 목소리는 빌리되 그 값은 안 빌린다.
 * 🔴 **좋다/나쁘다를 쓰지 않는다** (원칙 7). 축은 「많은 쪽 / 적은 쪽」이라는
 *    위치 진술로만 적고, 등급 글자를 괄호로 병기해 오각형과 어휘를 맞춘다.
 *
 * ⚠️ 문단은 각각 없을 수 있다. 등급이 하나도 없는 제품(모수 얕은 카테고리)은 1문단이
 *    짧아지고, 원재료가 비면 2문단이 통째로 빠진다 — **빈 문단을 지어내지 않는다.**
 */

export type Editorial = {
  /** 이게 무슨 제품인가 — 1회 기준 값과 축 위치 */
  nutrition: string | null;
  /** 원재료에서 눈에 띄는 것 */
  ingredients: string | null;
};

/** 축이 「반기는 쪽」에 있을 때 쓰는 말 · 그 반대쪽 말 */
const SIDE: Record<string, [good: string, bad: string]> = {
  단백질: ["많은 쪽", "적은 쪽"],
  칼로리: ["낮은 쪽", "높은 쪽"],
  당류: ["적은 쪽", "많은 쪽"],
  탄수화물: ["적은 쪽", "많은 쪽"],
  지방: ["적은 쪽", "많은 쪽"],
};

/** 소수점이 붙으면 문장이 지저분해진다 — 화면 여섯 칸과 같은 반올림 */
const whole = (v: number) => Math.round(v).toLocaleString("ko-KR");

/** 「A와 B」·「A·B·C」 — 셋 이상은 가운뎃점으로 잇는다 */
function join(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  if (words.length === 2) return `${words[0]}${conj(words[0])} ${words[1]}`;
  return `${words.slice(0, -1).join("·")}${conj(words[words.length - 2])} ${words.at(-1)}`;
}

/* ── 1문단 — 이게 무슨 제품인가 ─────────────────────────────── */

function nutritionPara(p: Product): string | null {
  const st = nutritionStandings(p);
  const prot = st.find((a) => a.key === "prot");
  if (!prot || prot.value == null) return null;

  const cat = catLabel(p.cat);
  const lead = `${p.packLabel}에 단백질 ${whole(prot.value)}g입니다.`;

  /* 🔴 등급이 안 붙는 카테고리가 있다 — 쿠팡판 다섯은 축별 모수가 25 미만이라
     `nutritionStandings` 가 grade 를 비운다. 그때는 값만 말하고 끝낸다.
     「중간입니다」라고 적으면 재 보지도 않고 판정한 것이 된다. */
  const graded = st.filter((a) => a.grade != null);
  if (graded.length === 0)
    return `${lead} 수록 ${cat} 가운데 견줄 만큼 신고가 모이지 않아, 이 제품은 값만 적습니다.`;

  const good = graded.filter((a) => a.grade === "A").map((a) => a.label);
  const bad = graded.filter((a) => a.grade === "D").map((a) => a.label);
  const n = graded[0].n;

  const parts: string[] = [];
  if (good.length) {
    const sides = good.map((l) => SIDE[l][0]);
    // 다섯 축의 「반기는 쪽」이 다 달라(많은/낮은/적은) 한 낱말로 못 묶는다
    const same = new Set(sides).size === 1;
    parts.push(
      same
        ? `수록 ${cat} ${n}건에서 ${join(good)}${subject(good.at(-1)!)} ${sides[0]}(A)입니다.`
        : `수록 ${cat} ${n}건에서 ${good
            .map((l, i) => `${l}${subject(l)} ${sides[i]}`)
            .join(", ")}(A)입니다.`,
    );
  }
  if (bad.length) {
    const sides = bad.map((l) => SIDE[l][1]);
    const same = new Set(sides).size === 1;
    const head = good.length ? "대신 " : `수록 ${cat} ${n}건에서 `;
    parts.push(
      same
        ? `${head}${join(bad)}${topic(bad.at(-1)!)} ${sides[0]}(D)에 섭니다.`
        : `${head}${bad.map((l, i) => `${l}${topic(l)} ${sides[i]}`).join(", ")}(D)에 섭니다.`,
    );
  }
  /* 양 끝이 하나도 없는 제품 — 억지로 할 말을 만들지 않는다 (summary.ts 와 같은 규칙) */
  if (parts.length === 0)
    parts.push(`다섯 축이 모두 수록 ${cat} ${n}건의 가운데 범위에 있습니다.`);

  return [lead, ...parts].join(" ");
}

/* ── 2문단 — 원재료에서 눈에 띄는 것 ────────────────────────── */

function ingredientPara(p: Product): string | null {
  if (!p.ings.length) return null;

  const groups = groupIngredients(p.ings);
  const sentences: string[] = [];

  sentences.push(`신고 원재료 ${p.ings.length}종 가운데 맨 앞이 ${p.top}입니다.`);

  /* 단백질 원료 — 정제 코드가 있으면 이름을, 없으면 「확인되지 않는다」까지만.
     ⚠️ 「단백질 원료가 확인 안 됨」과 「정제 정도가 확인 안 됨」은 다른 말이다
        (source-notes 주석). 계통(base)이 있으면 후자다. */
  const sources = sourcesOf(p.codes);
  if (sources.length) {
    sentences.push(
      `확인된 단백질 원료는 ${join(sources.map((s) => s.label))}입니다.`,
    );
  } else if (p.base && p.base !== "원료 불명확") {
    sentences.push(
      `단백질 계통은 ${p.base}으로 확인되지만, 정제 정도는 신고서에 적혀 있지 않습니다.`,
    );
  } else {
    sentences.push("신고 표기만으로는 단백질 원료를 특정하지 못했습니다.");
  }

  /* 감미료 — 갈래(고감미도 / 당알코올·희소당)까지. 배수·안전성은 안 적는다 */
  const sweet = groups.find((g) => g.key === "sweetener")?.items ?? [];
  if (sweet.length) {
    const hi = sweet.filter((s) => sweetenerKindOf(s.name) === "hi").map((s) => s.name);
    const bulk = sweet.filter((s) => sweetenerKindOf(s.name) === "bulk").map((s) => s.name);
    if (hi.length && bulk.length)
      sentences.push(
        `단맛은 고감미도 감미료 ${join(hi)}${conj(hi.at(-1)!)} 당알코올·희소당 ${join(bulk)}${subject(bulk.at(-1)!)} 함께 냅니다.`,
      );
    else if (hi.length)
      sentences.push(`단맛은 고감미도 감미료 ${join(hi)}${subject(hi.at(-1)!)} 냅니다.`);
    else if (bulk.length)
      sentences.push(`단맛은 당알코올·희소당 ${join(bulk)}${subject(bulk.at(-1)!)} 냅니다.`);
  }

  /* 당류 — 신고값은 그대로, 배합 1순위면 그 사실만 나란히 놓는다.
     🔴 「그래서 당류가 높다」고 잇지 않는다 — 함량 비율은 신고서에 없다.
        순위와 신고값을 나란히 두면 읽는 사람이 알아서 잇는다 (ingredient-groups 규칙) */
  const sugarFirst = groups.find((g) => g.key === "sugar")?.items.some((i) => i.rank === 1);
  if (sugarFirst) sentences.push("배합 1순위가 당류입니다.");
  if (p.sugarPack != null)
    sentences.push(`신고 당류는 ${whole(p.sugarPack)}g입니다.`);

  /* 이름이 내세운 원료가 목록에 없는 경우 — 요약과 같은 사실이지만 여기서도 말한다.
     ⚠️ 정제 등급 클레임(WPI 등)은 신고 서식이 원래 안 적는 것이라 제외 */
  if (p.claim && p.claimRank == null && !REFINED_CLAIMS.has(p.claim))
    sentences.push(
      `다만 제품명이 내세운 ${p.claim}${topic(p.claim)} 이 목록에 없습니다.`,
    );

  return sentences.join(" ");
}

export function editorialOf(p: Product): Editorial | null {
  const nutrition = nutritionPara(p);
  const ingredients = ingredientPara(p);
  if (!nutrition && !ingredients) return null;
  return { nutrition, ingredients };
}
