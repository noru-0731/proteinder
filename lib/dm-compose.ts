import { catLabel, type Product } from "./data";
import { healthTagsOf } from "./health-tags";
import { copula, topic } from "./josa";
import { servValue } from "./nutrition-grades";
import { similarTo } from "./similar";
import { summaryOf } from "./summary";
import type { DmMsg, DmSeed } from "./dm";

/**
 * 쪽지 문장 짓기 — **서버 전용.** 제품 상세(서버 컴포넌트)에서만 부른다.
 *
 * 🔴 **`lib/dm.ts` 에서 갈라 냈다** (2026-08-08 · 번들 실측에서 잡음).
 *    한 파일에 두었더니 클라이언트 부품(`DmSeed`·`Messages`)이 `lib/dm` 을 부르면서
 *    여기 있는 `similarTo` → `data.ts` → **products.json 이 통째로 딸려갔다** —
 *    `.next/static/chunks` 에 778KB 짜리가 생기고 제품 687개가 들어 있었다.
 *    `data.ts`·`nutrition-grades.ts` 가 모듈 최상위에서 분포를 계산해 두므로
 *    트리셰이킹이 못 걷어낸다.
 *    ⚠️ **이 파일을 클라이언트 컴포넌트에서 부르지 말 것.** 찜콩이 `snapOf` 로
 *       스냅샷만 넘기는 것과 같은 규칙이다.
 *
 * 🔴 **말투는 지어내되 값은 못 지어낸다** (원칙 1). 문장 재료는 전부 이미 있는 것이다 —
 *    `summaryOf`(한 줄 요약) · `servValue`(1회 섭취 환산) · `healthTagsOf` · `similarTo`.
 *    화면 다른 곳이 말하지 않는 사실을 쪽지가 새로 말하는 일은 없다.
 * 🔴 **제품이 자기를 좋다고 말하지 않는다** (원칙 7). 「저는 단백질이 15g 들어 있어요」는
 *    신고값 진술이고, 「저는 몸에 좋아요」는 우리가 못 하는 말이다.
 *    ⚠️ 광고 문안처럼 쓰고 싶어지는 자리다. 재료 함수 밖의 형용사를 붙이지 말 것.
 */


const g = (v: number | null, unit: string) =>
  v == null ? null : `${v >= 100 ? Math.round(v) : Number(v.toFixed(1))}${unit}`;

/**
 * 제품 하나를 대화로 옮긴다. **제품 상세(서버 컴포넌트)에서만 부른다.**
 *
 * 순서는 소개 → 성분 한 줄 → 원재료 → (해당되면) 가려 먹는 사람용 한 줄 → 추천.
 * ⚠️ 값이 없으면 그 줄을 통째로 안 만든다. 「모름」을 「없음」으로 적지 않는다.
 */
export function dmSeedOf(p: Product): DmSeed {
  const msgs: DmMsg[] = [];

  const prot = g(servValue(p, "prot"), "g");
  const kcal = g(servValue(p, "kcal"), "kcal");

  /* ① 소개 — 이름과 1회 섭취 기준 단백질. 이 서비스에서 「가격」에 해당하는 값이다 */
  msgs.push({
    key: "hello",
    text: prot
      ? `안녕하세요, ${p.name}입니다. ${p.packLabel} 기준으로 단백질이 ${prot} 들어 있어요${kcal ? `. 열량은 ${kcal}이고요` : ""}.`
      : `안녕하세요, ${p.name}입니다. 1회 섭취량 환산이 성립하지 않아 단백질을 1회 기준으로는 못 알려드려요.`,
  });

  /* ② 성분 한 줄 — 제품 상세가 쓰는 그 문장 그대로다. 두 화면이 어긋날 수 없다 */
  const sum = summaryOf(p);
  if (sum) msgs.push({ key: "summary", text: sum });

  /* ③ 원재료 — 배합 순번이 이 서비스가 보여주려는 것이다 */
  if (p.ings.length)
    msgs.push({
      key: "ings",
      /* ⚠️ 「두유이에요」로 한 번 틀렸다 — 받침에 따라 이에요/예요가 갈린다.
         한글이 아닌 이름(`WPI`)은 조사가 빈 문자열이라 「입니다」로 받는다 */
      text: `신고된 원재료는 ${p.ings.length}종이고, 배합 순서 첫 번째는 ${p.ings[0]}${copula(p.ings[0]) || "입니다"}. 함량 비율은 신고서에 없어서 순서까지만 말씀드릴 수 있어요.`,
    });

  /* ④ 가려 먹는 사람에게 걸리는 것 — 조건 칩과 같은 판정을 쓴다 */
  const tags = healthTagsOf(p)
    .map((t) => t.label)
    .slice(0, 2);
  if (tags.length)
    msgs.push({
      key: "tags",
      text: `조건으로는 ${tags.join(" · ")}에 걸려요.`,
    });

  /* ⑤ 🔴 이름이 내세운 원료가 신고 목록에 없는 15건 — 가장 중요한 사실이라 꼭 말한다 */
  if (p.claim && p.claimRank == null)
    msgs.push({
      key: "claim",
      text: `한 가지 미리 말씀드리면, 제 이름에 있는 ${p.claim}${topic(p.claim)} 신고 원재료 목록에서 확인되지 않아요.`,
    });

  /* ⑥ 추천 — 「맞춤」의 알맹이. 상세의 「비슷한 제품」과 **같은 함수**라 두 화면이 같은 말을 한다 */
  const recs = similarTo(p, 3).map((s) => ({
    id: s.id,
    name: s.name,
    img: s.img ?? null,
    why: `${catLabel(s.cat)} · ${s.packLabel} 기준 성분이 가까움`,
  }));
  if (recs.length)
    msgs.push({
      key: "recs",
      text: `저와 1회 섭취 기준 다섯 축이 가까운 제품도 있어요. 같이 놓고 보실래요?`,
    });

  return {
    id: p.id,
    name: p.name,
    img: p.img ?? null,
    cat: catLabel(p.cat),
    basis: p.packLabel,
    msgs,
    recs,
  };
}
