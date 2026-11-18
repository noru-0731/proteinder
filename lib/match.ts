import { products, type Product } from "./products";
import { CATEGORIES, categoryOfProduct } from "./categories";
import { conj } from "./josa";

/* ══════════════════════════════════════════════════════════════════════
   재미 매칭 — 생년월일 + MBTI 로 「운명의 프로틴」.

   프로틴더라는 이름의 틴더 약속을 회수하는 자리다. 벤치마크는 이음(ieum.one) —
   입력은 가볍게, 결과는 짧은 문장, 2인 궁합이 전파 동선.

   🔴 놀이다. 「재미로 보는 매칭 · 성분·건강 적합성과 무관」을 결과에 고정으로 적는다.
      궁합을 숫자 점수로 만들지 않는다 — 이 서비스의 숫자는 전부 출처가 있어야 하므로
      재미 쪽은 문장으로만 말한다.
   🔴 결정적이다 — 같은 입력은 항상 같은 제품. hash(생일|MBTI) 로 뽑는다.
      「운명」 서사가 성립하고, URL 이 곧 결과라 저장 없이 공유된다.

   🔴 **표본이 아니라 수록 전체에서 뽑되, 사진과 원재료가 있는 것만** 후보로 둔다.
      표본 60건으로 좁혔더니 80조합에 고유 30종이라 **두 사람이 같은 제품을 받는
      일이 잦았다** — 「운명」 서사가 그 자리에서 무너진다. 매칭은 견주는 일이
      아니라 뽑는 일이라 검색과 같은 이유로 표본 밖까지 본다.
   ⚠️ 사진·원재료 게이트는 남긴다. 운명이라고 내놓은 제품의 상세가 빈 화면이면
      안 된다 — 좁히는 이유가 「좋은 제품」이 아니라 「보여줄 것이 있는 제품」이다.

   매칭은 점수제다 — AND 로 걸면 16 MBTI × 5 오행 = 80조합에서 빈 풀이 생긴다.
     E/I   바로 먹는 것 vs 타 먹는 가루      ← 하드 필터
     S/N   정석 맛 vs 모험 맛
     T/F   고단백 태그 vs 브랜드 있음
     J/P   대용량 vs 소용량
     오행   연도 천간 → 목화토금수 → 맛 계열

   오행은 60갑자 산술 그대로다 — (연도−4)%10 천간, 갑을=목 병정=화 무기=토
   경신=금 임계=수. ⚠️ 입춘 경계를 무시하고 양력 연도로 계산한다 — 재미 라벨이라
   단순화를 화면에 명기하고 쓴다.
   ══════════════════════════════════════════════════════════════════════ */

export const MBTIS = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;

export type Element = "목" | "화" | "토" | "금" | "수";

const ELEMENTS: Record<Element, { hanja: string; flavors: string[]; line: string }> = {
  목: { hanja: "木", flavors: ["녹차"], line: "나무 기운 — 푸른 녹차 계열" },
  화: { hanja: "火", flavors: ["초코", "커피"], line: "불 기운 — 진한 초코·커피 계열" },
  토: { hanja: "土", flavors: ["곡물", "바나나"], line: "땅 기운 — 구수한 곡물·바나나 계열" },
  금: { hanja: "金", flavors: ["플레인", "바닐라"], line: "쇠 기운 — 군더더기 없는 플레인·바닐라 계열" },
  수: { hanja: "水", flavors: ["과일", "딸기"], line: "물 기운 — 상큼한 과일·딸기 계열" },
};

const STEM_TO_ELEMENT: Element[] = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];

export function elementOf(birth: string): (typeof ELEMENTS)[Element] & { name: Element } {
  const year = Number(birth.slice(0, 4));
  const name = STEM_TO_ELEMENT[(((year - 4) % 10) + 10) % 10];
  return { name, ...ELEMENTS[name] };
}

/** 맛 10종을 정석/모험으로 가른다 — 재미 매핑이다. 데이터 어휘 그대로만 쓴다 */
const CLASSIC = new Set(["초코", "곡물", "플레인", "바나나"]);
const ADVENTUROUS = new Set(["쿠키앤크림", "과일", "딸기", "녹차", "바닐라", "커피"]);

function sizeNum(size: string): number | null {
  const m = size.match(/([\d.]+)\s*(ml|g|kg|l)/i);
  if (!m) return null;
  const v = Number(m[1]);
  const u = m[2].toLowerCase();
  return u === "kg" || u === "l" ? v * 1000 : v;
}

function isBig(p: Product): boolean {
  const n = sizeNum(p.size);
  if (n == null) return false;
  return p.cat === "파우더" ? n >= 900 : n >= 300;
}

/**
 * 🔴 E/I 는 제형 그룹으로 가른다 — 카테고리 이름이 아니라.
 *    카테고리가 일곱으로 늘어도 「바로 먹는 것 / 타 먹는 가루」 두 갈래는 그대로다.
 * ⚠️ 표본 밖 제품도 후보라 `categoryOfProduct`(표본 색인)로는 못 찾는다.
 *    데이터의 `cat` 값에서 직접 그룹을 읽는다.
 */
const GROUP_BY_CAT = new Map(
  CATEGORIES.filter((c) => c.data).map((c) => [c.data as string, c.group]),
);
const isMix = (p: Product) => GROUP_BY_CAT.get(p.cat) === "mix";

export function parseInput(birth?: string, mbti?: string): { birth: string; mbti: string } | null {
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return null;
  const year = Number(birth.slice(0, 4));
  if (year < 1900 || year > 2026) return null;
  const m = (mbti ?? "").toUpperCase();
  if (!(MBTIS as readonly string[]).includes(m)) return null;
  return { birth, mbti: m };
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export type MatchResult = {
  pick: Product;
  /** 🔴 뽑힌 제품이 **실제로 만족한 축**의 문장만. 안 맞는 축을 맞다고 적지 않는다 */
  reasons: string[];
  runnerUps: Product[];
  element: ReturnType<typeof elementOf>;
};

export function matchOne(birth: string, mbti: string): MatchResult | null {
  const el = elementOf(birth);
  const [ei, sn, tf, jp] = mbti.split("") as [string, string, string, string];

  /* E 는 뚜껑만 열면 되는 것(마시는 것·먹는 것), I 는 타 먹는 가루 */
  const wantMix = ei === "I";
  const catLine = wantMix
    ? "I — 집에서 천천히 타 먹는 가루"
    : "E — 뚜껑만 열면 바로 먹는 완제품";
  const pool = products.filter(
    (p) => isMix(p) === wantMix && p.img != null && p.ings.length > 0,
  );
  if (!pool.length) return null;

  const axes: { ok: (p: Product) => boolean; line: string }[] = [
    sn === "S"
      ? { ok: (p) => p.flavors.some((f) => CLASSIC.has(f)), line: "S — 검증된 정석 맛" }
      : { ok: (p) => p.flavors.some((f) => ADVENTUROUS.has(f)), line: "N — 새로운 맛에 손이 갑니다" },
    tf === "T"
      ? { ok: (p) => p.tags.includes("고단백"), line: "T — 숫자로 골랐습니다, 고단백" }
      : { ok: (p) => Boolean(p.brand), line: "F — 이름을 아는 브랜드" },
    jp === "J"
      ? { ok: (p) => isBig(p), line: "J — 루틴을 책임질 듬직한 용량" }
      : { ok: (p) => !isBig(p), line: "P — 가볍게 시작하는 용량" },
    {
      ok: (p) => p.flavors.some((f) => el.flavors.includes(f)),
      line: `${el.name}(${el.hanja}) — ${el.line}`,
    },
  ];

  let best: Product[] = [];
  let bestScore = -1;
  for (const p of pool) {
    let score = 0;
    for (const a of axes) if (a.ok(p)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = [p];
    } else if (score === bestScore) best.push(p);
  }
  /* 순서를 고정해야 해시가 결정적이다 */
  best.sort((a, b) => (a.id < b.id ? -1 : 1));

  const i = hash(`${birth}|${mbti}`) % best.length;
  const pick = best[i];
  const runnerUps = [1, 2, 3]
    .map((k) => best[(i + k) % best.length])
    .filter((p) => p.id !== pick.id);

  return {
    pick,
    reasons: [catLine, ...axes.filter((a) => a.ok(pick)).map((a) => a.line)],
    runnerUps,
    element: el,
  };
}

/** 2인 궁합 — 오행 상생(相生)·상극(相剋). 목→화→토→금→수→목이 상생 고리다 */
const FEEDS: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CLASHES: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export function synergyOf(a: Element, b: Element): string {
  /* ⚠️ 조사는 josa.ts — 「토와 금」을 하드코딩 「과」로 한 번 틀렸던 자리다 */
  const pair = `${a}${conj(a)} ${b}`;
  if (a === b) return `같은 ${a} 기운 — 취향이 닮은 사이`;
  if (FEEDS[a] === b || FEEDS[b] === a) return `${pair} — 서로 북돋는 상생의 사이`;
  if (CLASHES[a] === b || CLASHES[b] === a)
    return `${pair} — 밀고 당기는 상극, 그래서 안 질리는 사이`;
  return `${pair} — 서로 다른 결이 어울리는 사이`;
}

/** 이 제품이 랭킹 표본에도 들어 있는가 — 화면에서 갈라 적을 때 쓴다 */
export const inSample = (p: Product) => categoryOfProduct(p) != null;
