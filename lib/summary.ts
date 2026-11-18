import { catLabel, type Product } from "./data";
import { REFINED_CLAIMS, edgesOf, sugarTier } from "./grades";
import { healthTagsOf } from "./health-tags";
import { topic } from "./josa";
import { sourcesOf } from "./source-notes";

/**
 * 한 줄 요약 — 「결론적으로 이 제품은 무엇인가」 (2026-08-06 밤 · 팀 요청).
 *
 * 🔴 **보수적으로.** 화면의 태그·카드가 이미 말한 사실만 조합한다. 새 판정을 만들지
 *    않는다 — 재료는 넷뿐이다: 축 위치(상·하위 20%) · 당류 양끝(sugarTier) ·
 *    유당불내증 태그 · 콜라겐 쓰임.
 * 🔴 효능·건강 판정은 쓰지 않는다. 「좋습니다」가 아니라 **「살펴볼 만합니다」까지**다
 *    (원칙 7). 축 문장은 위치 진술("~쪽입니다")을 그대로 쓴다.
 * 🔴 당류는 edgesOf 가 아니라 sugarTier 에서 받는다 (2026-08-07 수정).
 *    당류가 3단계(0g/많음)로 넘어가면서 edgesOf 가 당류 배지를 내지 않는데
 *    이 파일이 그걸 계속 edges 에서 찾아 — 「당류 많음」 배지가 붙은 제품의
 *    요약이 당류를 한 마디도 못 하고 있었다. 배지와 요약이 어긋나던 자리다.
 * ⚠️ 중간 제품은 중간이라고 적는다 — 억지로 할 말을 만들지 않는다.
 * ⚠️ 환산 미산출 13건은 비교 축이 없어 요약하지 않는다 (null).
 */

const CLAUSE: Record<string, string> = {
  "prot-high": "1회 단백질이 많은 쪽",
  "prot-low": "1회 단백질이 적은 쪽",
  // 당류는 배지(sugarTier)와 같은 두 갈래만 — 「적은 쪽」은 배지에 없는 말이라 안 쓴다
  "sugar-high": "당류가 많은 쪽",
  "sugar-zero": "신고 당류가 0g",
  "kcal-high": "열량이 높은 쪽",
  "kcal-low": "열량이 낮은 쪽",
  // share 하위는 edgesOf 가 내지 않는다 (단백질 하위와 64% 중복 — grades.ts)
  "share-high": "열량 대부분이 단백질인 쪽",
};

/** 문장에 넣는 축 순서. 셋 이상이면 늘어져서 앞의 둘만 쓴다 */
const ORDER = ["prot", "sugar", "kcal", "share"];

export function summaryOf(p: Product): string | null {
  if (p.protPack == null) return null;

  const edges = edgesOf(p);
  const keys: string[] = [];
  for (const k of ORDER) {
    if (k === "sugar") {
      const t = sugarTier(p);
      if (t) keys.push(`sugar-${t}`);
      continue;
    }
    const e = edges.find((x) => x.key === k);
    if (e) keys.push(`${e.key}-${e.high ? "high" : "low"}`);
  }
  const clauses = keys
    .slice(0, 2)
    .map((k) => CLAUSE[k])
    .filter(Boolean);

  const head =
    clauses.length > 0
      ? `수록 ${catLabel(p.cat)} 가운데 ${clauses.join("이고, ")}입니다.`
      : p.sugarPack == null
        ? `1회 단백질이 수록 ${catLabel(p.cat)}의 중간 범위에 있습니다.`
        : `단백질·당류 모두 수록 ${catLabel(p.cat)}의 중간 범위에 있습니다.`;

  const tails: string[] = [];

  /* 🔴 이름 원료가 신고 목록에 없는 15건 (2026-08-07 · 산양유 사례) — 종합 A·식물성으로
     멀쩡해 보이는 제품의 가장 중요한 사실이라 요약 맨 앞에 세운다.
     ⚠️ 정제 등급 클레임(WPI 등)은 신고 관행이라 제외 — grades.ts REFINED_CLAIMS 주석 */
  if (p.claim && p.claimRank == null && !REFINED_CLAIMS.has(p.claim))
    tails.push(
      `단, 제품명이 내세운 ${p.claim}${topic(p.claim)} 신고 원재료 목록에 없습니다.`,
    );

  if (healthTagsOf(p).some((h) => h.key === "lactose"))
    tails.push("우유에서 온 원재료가 신고서에 없어, 유당을 피하려는 경우 살펴볼 만합니다.");

  // 콜라겐이 유일한 단백질원인 9건 — 이름은 「단백질」이지만 쓰임이 다르다는 사실
  const sources = sourcesOf(p.codes);
  if (sources.length === 1 && sources[0].code === "콜라겐")
    tails.push("확인된 단백질원이 콜라겐뿐이라, 근육을 위한 보충과는 쓰임이 다릅니다.");

  return [head, ...tails].join(" ");
}
