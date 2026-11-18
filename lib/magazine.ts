import { catLabel, products, type Product } from "./data";
import { REFINED_CLAIMS } from "./grades";
import { groupIngredients, sweetenerKindOf } from "./ingredient-groups";

/* ══════════════════════════════════════════════════════════════════════
   매거진 — 뉴닉(newneek.co) 문법으로 쓴 데이터 아티클 여섯 편.

   2026-08-08 · 팀 지시 「뉴닉 식으로 · 추천안(B)으로」

   ── 뉴닉에서 가져온 것 (내부 API 실측 · robots.txt 가 ClaudeBot 을 허용한다)
     제목      한 문장이 곧 요약이다. 헤드라인이 아니라 리드고, 끝에 이모지 하나.
              「홈플러스 67개 점포가 가오픈에 들어갔어요. 🛒」 — 숫자를 제목에 박는다
     본문      리드 문단 → 질문형 소제목 → 본문 → 소제목 → 본문
     어투      본문·제목은 존댓말 「~어요」, **소제목만 반말 질문**. 이 대비가 뉴닉이다
     태그      정확히 둘 — 대분류 + 소분류
     각주      「이 아티클은 뉴닉 편집 매뉴얼을 학습한 AI가 작성했어요」를 본문에 적는다

   ── 가져오지 않은 것
     이모지 남발  뉴닉은 소제목마다 이모지를 단다. 우리 화면은 화해 계열이라 절제한다 —
                제목 끝 하나만 쓴다
     추측·전망   「~할 전망이에요」는 기사의 말이다. 우리는 신고서에 적힌 것만 적는다

   🔴 **숫자를 손으로 적지 않는다.** 제목의 「82건」도 이 파일이 센 값이다.
      수록이 바뀌면 제목이 같이 바뀐다 — 기사와 그 아래 제품 목록이 어긋날 수가 없다.
      (`editorial.ts` 가 제품 하나에서 지키는 규칙을, 여기서는 제품군을 가로질러 지킨다.)

   🔴 **판정하지 않는다** (원칙 7). 여섯 편 전부 「신고서가 무엇을 적고 무엇을 안 적는가」
      까지다. 「그래서 나쁜 제품」이라 잇는 문장이 하나도 없어야 한다.

   🔴 **기사 끝이 제품 목록으로 떨어진다.** 뉴닉은 기사가 기사로 끝나지만 우리는
      기사가 곧 필터다 — 읽고 나면 그 15건이 그대로 눈앞에 있다.

   ⚠️ **모수는 수록 626건이지 랭킹 표본 210건이 아니다.** `pool()`/`ALL_SAMPLE` 은
      카테고리마다 30개로 자른 표본이라, 그걸로 세면 「82건」이라 적고 12건만 뜬다.
      매거진은 신고서 이야기라 수록 전체를 본다 — 그래서 목록도 `/rank` 로 넘기지 않고
      기사가 직접 그린다.
   ⚠️ **쿠팡 150건은 원재료가 23건뿐이다.** 원재료 이야기의 실질 모수는 식약처 476건이라,
      원재료를 세는 기사는 **「신고 원재료가 있는 N건 가운데」**라고 모수를 밝혀 적는다.
   ══════════════════════════════════════════════════════════════════════ */

/** 목록에 늘어놓는 최대 수. 🔴 자를 때는 「N건 가운데 M건」이라 화면에 적는다 */
const LIST_MAX = 12;

export type ArticleList = {
  title: string;
  /** 무엇을 무슨 순서로 늘어놨는지. 화면에 그대로 적는다 */
  note: string;
  items: Product[];
  /** 자르기 전 전체 건수 */
  total: number;
};

export type Section = {
  /** 질문형 소제목 — 반말이다 (뉴닉 문법) */
  q: string;
  body: string;
};

export type Article = {
  slug: string;
  emoji: string;
  /** 대분류 · 소분류 두 개 */
  tags: [string, string];
  /** 카드와 상세가 같이 쓰는 제목. 한 문장이 곧 요약이다 */
  headline: string;
  /** 카드 본문 두 문장 */
  description: string;
  /** 리드 문단 */
  lead: string;
  sections: Section[];
  lists: ArticleList[];
};

/* ── 세는 도구 ────────────────────────────────────────────────────── */

const has = (p: Product, code: string) => p.codes.includes(code);
/** 노출 많은 순 — 「많이 찾는」과 같은 잣대다. 판매량이 아니다 */
const byPop = (a: Product, b: Product) => b.pop - a.pop || a.name.localeCompare(b.name, "ko");

function list(title: string, note: string, items: Product[], sort = byPop): ArticleList {
  const sorted = [...items].sort(sort);
  return { title, note, items: sorted.slice(0, LIST_MAX), total: sorted.length };
}

/** 원재료가 신고된 제품만 — 원재료 이야기의 실질 모수 */
const WITH_INGS = products.filter((p) => p.ings.length > 0);
const RTD = products.filter((p) => p.cat === "RTD 음료");

/* ── ① 정제수 ─────────────────────────────────────────────────────── */

const water = RTD.filter((p) => p.top === "정제수");

/* ── ② 유청 정제 등급 ─────────────────────────────────────────────── */

const wpi = products.filter((p) => has(p, "WPI"));
const whey = products.filter(
  (p) => has(p, "유청") || has(p, "WPI") || has(p, "WPC") || has(p, "WPH"),
);
/** 정제 등급의 근거가 **신고 원재료**인 것. 나머지는 제품명·판매처 제목에서 왔다 */
const wheyByLabel = whey.filter((p) => p.srcEvidence === "원재료");
/* ⚠️ 제목의 「0건」을 손으로 적지 않는다. 유청 계열 전체에는 신고 원재료 근거가
   몇 건 있지만(`wheyByLabel`) **WPI 만 놓고 보면 0건**이라, 두 값이 서로 다르다.
   신고가 한 건이라도 늘면 제목이 거짓말이 되므로 여기서 세어 넣는다. */
const wpiByLabel = wpi.filter((p) => p.srcEvidence === "원재료");
const wpiByName = wpi.filter((p) => p.srcEvidence === "제품명");

/* ── ③ 이름이 내세운 원료가 목록에 없음 ────────────────────────────── */

/* ⚠️ 정제 등급 클레임(WPI·아이솔레이트류)은 뺀다 — 신고 서식이 정제 등급을 원래
   안 적어서 글자가 없는 것이지 불일치가 아니다. 넣으면 ② 기사와 정면으로 어긋난다. */
const mismatch = products.filter(
  (p) => !!p.claim && p.claimRank == null && !REFINED_CLAIMS.has(p.claim),
);
const mismatchClaims = [...new Set(mismatch.map((p) => p.claim))];

/* ── ④ 원재료 종수 ────────────────────────────────────────────────── */

const counts = WITH_INGS.map((p) => p.ings.length).sort((a, b) => a - b);
const median = counts[Math.floor(counts.length / 2)];
const maxIngs = Math.max(...counts);
const minIngs = Math.min(...counts);
const most = WITH_INGS.filter((p) => p.ings.length === maxIngs)[0];
const fewest = WITH_INGS.filter((p) => p.ings.length === minIngs)[0];

/* ── ⑤ 당류 0g ────────────────────────────────────────────────────── */

/* 🔴 `sugar === 0` 이다 (`FIT_CHIPS.sugar0` 과 같은 조건). 0.1~0.4g 은 들어오지 않는다 —
   화면이 그 둘을 「0g」과 「<1g」으로 갈라 적고 있어서다. */
const sugar0 = products.filter((p) => p.sugar === 0);
const sweetOf = (p: Product) =>
  groupIngredients(p.ings).find((g) => g.key === "sweetener")?.items ?? [];
const sugar0Sweet = sugar0.filter((p) => sweetOf(p).length > 0);
const sugar0Both = sugar0Sweet.filter((p) => {
  const s = sweetOf(p);
  return (
    s.some((i) => sweetenerKindOf(i.name) === "hi") &&
    s.some((i) => sweetenerKindOf(i.name) === "bulk")
  );
});
/** 당류 0g 인데 감미료도 확인되지 않는 제품 — 「그럼 뭐지」의 답은 우리에게 없다 */
const sugar0Quiet = sugar0.filter((p) => p.ings.length > 0 && sweetOf(p).length === 0);

/* ── ⑥ 공개도 ─────────────────────────────────────────────────────── */

const opaque = WITH_INGS.filter((p) => p.opaque);
const open = WITH_INGS.filter((p) => !p.opaque);

/* ── 기사 여섯 편 ─────────────────────────────────────────────────── */

export const ARTICLES: Article[] = [
  {
    slug: "water-first",
    emoji: "💧",
    tags: ["원재료", "배합 순서"],
    headline: `프로틴 드링크 ${RTD.length}건 가운데 ${water.length}건은 배합 1순위가 정제수예요`,
    description: `원재료는 많이 든 순서대로 적습니다. 프로틴 드링크에서 맨 앞에 가장 많이 오는 이름은 단백질 원료가 아니라 정제수였어요. ${RTD.length}건 중 ${water.length}건입니다.`,
    lead: `식약처 신고 서식은 원재료를 **많이 든 순서대로** 적게 합니다. 그래서 맨 앞에 적힌 이름 하나만 봐도 그 제품이 주로 무엇으로 채워져 있는지 알 수 있는데요. 수록된 프로틴 드링크 ${RTD.length}건의 1순위를 세어 보니, 가장 흔한 이름은 정제수였습니다 — ${water.length}건, ${Math.round((water.length / RTD.length) * 100)}%입니다.`,
    sections: [
      {
        q: "그럼 물을 파는 거야?",
        body: "그런 뜻이 아닙니다. 마시는 완제품 음료는 물에 타서 파는 형태라 정제수가 1순위인 것이 이상한 일이 아닙니다. 같은 이유로 물에 타 먹는 파우더에는 정제수가 아예 안 들어갑니다. 배합 순서는 **무게 순이지 단백질 기여 순이 아니라는 것**이 이 숫자가 보여 주는 전부입니다.",
      },
      {
        q: "그럼 뭘 봐야 해?",
        body: "1순위 다음부터입니다. 단백질 원료가 2순위에 있는지 7순위에 있는지가 갈리고, 그 사이에 당류나 감미료가 끼어 있는지도 갈립니다. 제품 상세의 원재료 칸이 신고된 순번을 그대로 붙여 보여 줍니다.",
      },
      {
        q: "함량은 안 나와?",
        body: "**함량 비율은 신고서에 없습니다.** 우리가 아는 것은 순서까지고, 1순위가 2순위의 몇 배인지는 공개되지 않습니다. 그래서 이 기사도 「정제수가 많이 들었다」가 아니라 「정제수가 맨 앞에 적혀 있다」까지만 적습니다.",
      },
    ],
    lists: [
      list(
        "정제수가 1순위인 프로틴 드링크",
        `${water.length}건 가운데 쇼핑몰 노출이 많은 순서입니다.`,
        water,
      ),
    ],
  },

  {
    slug: "wpi-evidence",
    emoji: "🔬",
    tags: ["단백질 원료", "정제 등급"],
    headline: `WPI라고 확인된 제품은 ${wpi.length}건인데, 신고 원재료에 그렇게 적혀 있는 건 ${wpiByLabel.length}건이에요`,
    description: `신고 서식에는 유청단백의 정제 등급을 적는 칸이 없습니다. 유청 계열 ${whey.length}건 가운데 원재료에 「분리」·「농축」이 적힌 건 ${wheyByLabel.length}건뿐이고, 나머지는 제품명이나 판매처 제목에서 확인한 것입니다.`,
    lead: `WPI와 WPC는 둘 다 유청단백입니다. WPI 쪽이 유당과 지방을 더 걸러낸 것이라 유당이 불편한 사람에게는 갈리는 차이인데요. **신고 원재료에는 이 구분이 거의 적혀 있지 않습니다.** 수록된 유청 계열 ${whey.length}건 가운데 원재료 이름에 「분리유청단백」·「농축유청단백」처럼 등급이 박힌 것은 ${wheyByLabel.length}건뿐이고, 나머지는 전부 「유청단백분말」입니다.`,
    sections: [
      {
        /* ⚠️ 소제목에도 숫자가 들어간다 — 여기만 손으로 적으면 수록이 바뀔 때
           제목의 건수와 소제목의 건수가 서로 다른 말을 한다 */
        q: `그럼 WPI ${wpi.length}건은 어떻게 안 거야?`,
        body: `신고서 밖에서 확인했습니다. ${wpiByName.length}건은 **제품명에 WPI가 박혀 있고**, 나머지는 같은 브랜드 판매처 제목에서 확인했습니다. 어느 쪽으로 확인했는지는 제품 상세에 근거 등급으로 그대로 적어 둡니다 — 숨기지 않는 대신, 신고 원재료로 확인한 것과 같은 값으로 취급하지도 않습니다.`,
      },
      {
        q: "「유청단백분말」을 WPC로 보면 안 돼?",
        body: "안 됩니다. 한 번 그렇게 했다가 **「삼대오백 WPI 웨이프로틴」이 WPC로 뒤집혔습니다.** 신고서에 농축·분리 구분이 없다는 것은 「농축이다」가 아니라 「적혀 있지 않다」는 뜻입니다. 그래서 확인되지 않은 것은 「유청 (구분 없음)」으로 둡니다.",
      },
      {
        q: "더 정제된 게 좋은 거야?",
        body: "**순서가 곧 서열은 아닙니다.** WPC는 유당과 지방이 함께 남아 있고, WPI는 그 둘을 걸러낸 것입니다. 유당이 불편하면 WPI 쪽이 편하다는 뜻이지, 그 자체로 더 나은 원료라는 뜻이 아닙니다. 원재료 사전에 원료마다 무엇이 남고 무엇이 빠지는지 적어 뒀습니다.",
      },
    ],
    lists: [
      list(
        "WPI로 확인된 제품",
        `${wpi.length}건 가운데 노출이 많은 순서입니다. 무엇으로 확인했는지는 제품 상세에 적혀 있습니다.`,
        wpi,
      ),
      ...(wheyByLabel.length
        ? [
            list(
              "신고 원재료에 정제 등급이 적힌 제품",
              `유청 계열 ${whey.length}건 가운데 ${wheyByLabel.length}건뿐입니다.`,
              wheyByLabel,
            ),
          ]
        : []),
    ],
  },

  {
    slug: "name-vs-label",
    emoji: "🐐",
    tags: ["원재료", "제품명"],
    headline: `제품명이 내세운 원료가 신고 목록에 없는 제품이 ${mismatch.length}건 있어요`,
    description: `이름에 「산양유」·「초유」가 붙어 있는데 신고 원재료에서는 그 이름을 찾을 수 없는 제품들입니다. 안 들었다는 뜻이 아니라, 우리가 신고서로 확인하지 못했다는 뜻입니다.`,
    lead: `제품명은 그 제품이 무엇을 내세우는지 보여 줍니다. 그런데 이름이 앞세운 원료를 신고 원재료 목록에서 찾을 수 없는 제품이 ${mismatch.length}건 있습니다. 이름에 걸린 낱말은 ${mismatchClaims.join(" · ")}입니다.`,
    sections: [
      {
        q: "그럼 안 들어간 거야?",
        body: "**그렇게 말할 수 없습니다.** 「단백질(고시형)」이나 「두류가공품」처럼 안을 알 수 없는 표기 안에 들어 있을 수 있고, 신고 서식이 모든 원료를 낱낱이 적게 하지도 않습니다. 우리가 할 수 있는 진술은 **「신고된 원재료 목록에서 그 이름이 확인되지 않는다」**까지입니다.",
      },
      {
        q: "왜 굳이 표시해?",
        body: "이름만 보고 고르면 확인할 방법이 없어서입니다. 종합 등급이 A이고 겉으로 멀쩡해 보이는 제품도 여기 걸립니다 — 등급은 영양성분으로 매기는 것이라 원재료 목록과는 다른 이야기를 합니다. 두 가지가 서로를 안 가려 주도록 상세 화면의 한 줄 요약 맨 앞에 이 사실을 올려 둡니다.",
      },
      {
        q: "WPI 같은 것도 여기 들어가?",
        body: "**뺐습니다.** 「WPI」·「아이솔레이트」처럼 정제 등급을 내세운 이름은 신고 서식이 그 등급을 원래 안 적어서 글자가 없는 것이지, 이름과 목록이 어긋난 것이 아닙니다. 넣었다면 앞의 기사와 정면으로 어긋납니다.",
      },
    ],
    lists: [
      list(
        "이름이 내세운 원료가 목록에 없는 제품",
        `${mismatch.length}건 전부입니다.`,
        mismatch,
      ),
    ],
  },

  {
    slug: "how-many-ingredients",
    emoji: "📋",
    tags: ["원재료", "가짓수"],
    headline: `원재료가 ${maxIngs}종인 제품과 ${minIngs}종인 제품이 같은 선반에 있어요`,
    description: `신고 원재료가 있는 ${WITH_INGS.length}건의 중앙값은 ${median}종입니다. 가장 많은 제품은 ${maxIngs}종, 가장 적은 제품은 ${minIngs}종으로 ${Math.round(maxIngs / minIngs)}배 벌어집니다.`,
    lead: `원재료 목록의 길이는 제품마다 크게 다릅니다. 신고 원재료가 있는 ${WITH_INGS.length}건을 세어 보니 중앙값이 ${median}종이었는데, 가장 긴 「${most.name}」은 ${maxIngs}종이고 가장 짧은 「${fewest.name}」은 ${minIngs}종입니다.`,
    sections: [
      {
        q: "적은 게 좋은 거야?",
        body: "**그렇게 정하지 않습니다.** 가짓수가 적으면 무엇이 들었는지 읽기 쉽지만, 비타민과 미네랄을 채워 넣은 제품은 그것만으로 스무 종이 넘습니다. 식사 대용으로 만든 제품과 단백질만 채운 제품을 같은 자로 재면 둘 다 잘못 읽게 됩니다.",
      },
      {
        q: "그럼 이 숫자는 뭐에 쓰라고?",
        body: "**목록을 읽을 각오의 크기**입니다. 마흔 종이 넘는 목록을 그대로 늘어놓으면 정보가 아니라 소음이라, 제품 상세는 원재료를 단백질 원료·당류·감미료 세 칸으로 간추려 보여 줍니다. 나머지는 접어 두되 배합 순번은 버리지 않습니다.",
      },
    ],
    lists: [
      list(
        "원재료가 가장 많은 제품",
        `${WITH_INGS.length}건 가운데 종수가 많은 순서입니다.`,
        WITH_INGS,
        (a, b) => b.ings.length - a.ings.length || byPop(a, b),
      ),
      list(
        "원재료가 가장 적은 제품",
        `같은 ${WITH_INGS.length}건 가운데 종수가 적은 순서입니다.`,
        WITH_INGS,
        (a, b) => a.ings.length - b.ings.length || byPop(a, b),
      ),
    ],
  },

  {
    slug: "sugar-zero",
    emoji: "🍬",
    tags: ["영양성분", "감미료"],
    headline: `신고 당류가 0g인 제품 ${sugar0.length}건은 무엇으로 단맛을 낼까요`,
    description: `당류 0g은 단맛이 없다는 뜻이 아닙니다. ${sugar0.length}건 가운데 ${sugar0Sweet.length}건에서 감미료가 확인됐고, 그중 ${sugar0Both.length}건은 성질이 다른 두 갈래를 함께 씁니다.`,
    lead: `신고 당류가 정확히 0g인 제품이 ${sugar0.length}건 있습니다. **단맛이 없다는 뜻이 아닙니다** — 이 가운데 ${sugar0Sweet.length}건은 신고 원재료에서 감미료가 확인됩니다. 당류 대신 감미료로 단맛을 내면 신고 당류 칸은 0g이 됩니다.`,
    sections: [
      {
        q: "감미료도 다 같은 거 아니야?",
        body: `크게 두 갈래로 갈립니다. **고감미도 감미료**는 설탕보다 수백 배 달아 아주 조금 넣고, **당알코올·희소당**은 설탕과 비슷한 양을 넣습니다. 넣는 양이 다르다는 것이 실질적인 차이인데요. ${sugar0Both.length}건은 이 둘을 함께 씁니다 — 고감미도로 단맛을 내고 당알코올로 부피를 채우는 조합입니다.`,
      },
      {
        q: "몸에 괜찮은 거야?",
        body: "**우리가 판정하지 않습니다.** 안전성 평가는 식약처가 하는 일이고, 우리 화면은 **법으로 표시하게 돼 있는 문구만** 인용합니다 — 당알코올의 「과량 섭취 시 설사를 일으킬 수 있음」, 아스파탐의 「페닐알라닌 함유」가 그것입니다. 경고가 없는 감미료에는 아무것도 적지 않습니다.",
      },
      ...(sugar0Quiet.length
        ? [
            {
              q: "감미료도 안 보이는 제품은?",
              body: `${sugar0Quiet.length}건은 당류도 0g이고 신고 원재료에서 감미료도 확인되지 않습니다. 원래 단맛이 거의 없는 제품일 수도 있고, 뭉뚱그린 표기 안에 들어 있을 수도 있습니다. **어느 쪽인지 신고서로는 알 수 없어 그대로 둡니다.**`,
            },
          ]
        : []),
    ],
    lists: [
      list(
        "당류 0g이고 감미료가 확인된 제품",
        `${sugar0Sweet.length}건 가운데 노출이 많은 순서입니다.`,
        sugar0Sweet,
      ),
    ],
  },

  {
    slug: "how-open",
    emoji: "🔍",
    tags: ["원재료", "공개도"],
    headline: `원재료를 끝까지 밝힌 제품은 ${open.length}건, 뭉뚱그린 표기가 섞인 건 ${opaque.length}건이에요`,
    description: `「두류가공품」처럼 안을 알 수 없는 이름이 하나라도 섞이면 그 제품은 목록을 다 읽어도 무엇이 들었는지 알 수 없습니다. 제품이 아니라 신고서에 매기는 구분입니다.`,
    lead: `원재료 목록에는 안을 알 수 없는 이름이 섞여 있곤 합니다. 「두류가공품」·「유함유가공품」·「혼합제제」 같은 것인데요. 이런 표기가 하나라도 있으면 목록을 끝까지 읽어도 무엇이 들었는지 알 수 없습니다. 신고 원재료가 있는 ${WITH_INGS.length}건 가운데 이런 표기가 섞인 제품이 ${opaque.length}건입니다.`,
    sections: [
      {
        q: "숨긴 거야?",
        body: "**그렇게 읽지 않습니다.** 신고 서식이 이런 표기를 허용하고, 원료를 사다 쓰면 그 안의 조성을 제조사도 다 적지 못합니다. 그래서 이것은 제품의 흠이 아니라 **신고서에 매기는 구분**입니다 — 「나쁜 제품」이 아니라 「우리가 말할 수 있는 것이 적은 제품」입니다.",
      },
      {
        q: "그럼 뭐가 달라지는데?",
        body: `우리가 붙일 수 있는 판정이 달라집니다. 예를 들어 유당불내증 조건은 **우유에서 온 원료가 하나도 없는 제품**에만 붙이는데, 뭉뚱그린 표기가 하나라도 있으면 그 안에 분유가 있을 수 있어 붙이지 않습니다. 조건을 좁게 잡는 대신 틀리지 않게 두는 쪽을 택했습니다.`,
      },
      {
        q: "전부 공개된 제품만 볼 수 있어?",
        body: "있습니다. 랭킹의 조건별 탭에 「원료 전부 공개」가 있습니다. 뭉뚱그린 표기가 하나도 없이 신고된 제품만 모아 놓은 목록입니다.",
      },
    ],
    lists: [
      list(
        "뭉뚱그린 표기가 섞인 제품",
        `${opaque.length}건 가운데 노출이 많은 순서입니다.`,
        opaque,
      ),
    ],
  },
];

export const ARTICLE_BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

export function articleOf(slug: string | undefined): Article | null {
  return (slug && ARTICLE_BY_SLUG.get(slug)) || null;
}

/** 이 기사를 뺀 나머지 — 상세 맨 아래 「다른 이야기」 */
export function otherArticles(slug: string, n = 3): Article[] {
  const i = ARTICLES.findIndex((a) => a.slug === slug);
  if (i < 0) return ARTICLES.slice(0, n);
  return [...ARTICLES.slice(i + 1), ...ARTICLES.slice(0, i)].slice(0, n);
}

/** 매거진이 다루는 모수 — 절 아래 한 줄에 그대로 적는다 */
export const SCOPE = {
  total: products.length,
  withIngredients: WITH_INGS.length,
  categories: [...new Set(products.map((p) => catLabel(p.cat)))].length,
};

/* ❌ 코너 이름을 상수(`MAGAZINE`)로 묶으려다 걷어냈다 — 홈 절이 「프로틴더 매거진」으로 다시 짜이면서다.
   `/magazine` 눈썹줄도 「프로틴더 매거진」이라 **누른 글자와 도착한 쪽의 글자가 이미
   같다.** 묶을 것이 없는데 「두 곳이 같이 쓴다」는 주석과 함께 남겨 두면 다음 사람이
   그 말을 믿고 여기만 고친다. */
