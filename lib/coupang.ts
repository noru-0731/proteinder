import raw from "@/data/coupang.json";
import labels from "@/data/labels.json";
import type { Product } from "./data";

/* ══════════════════════════════════════════════════════════════════════
   쿠팡 랭킹 TOP 30 — 다섯 카테고리의 **목록이자 순서**.

   🔴 방향이 반대다 (2026-08-07 밤 · 팀 지시 「쿠팡 데이터를 우리 데이터보다
      양질로 취급한다」).

        전     식약처 수록이 목록이고, 순서는 우리가 센 쇼핑몰 노출 수였다
        후     쿠팡 랭킹이 목록이고 순서다. 식약처 신고는 **거기에 붙는 영양·원재료**다

   🔴 이 순위는 판매량이 **아니다.** 원본 안내 시트가 그렇게 적는다 —
      「쿠팡 랭킹은 판매·선호·가격·배송·검색 정확도 등을 반영해 수시 변동」.
      우리 진술은 「2026-08-07 로그아웃 상태 공개 검색에서 이 순서로 보였다」까지다.
      광고·추천 캐러셀·곰곰(PB)은 팀이 수집 단계에서 뺐다.

   ⚠️ 조인 키가 없다. 쿠팡 제목에 품목보고번호도 food_cd 도 없어 **이름으로** 이었고,
      확신할 때만 얹었다 (150건 중 90건). 나머지 60건은 영양이 비어 있고,
      대부분 「5종 세트」·「혼합 구성」이라 단일 신고가 애초에 없는 것들이다.
      **채우지 않는다** — 미확보라고 적는다.

   🔴 **표시사항 직접 입력** (2026-08-08 · 팀이 제품 뒷면을 촬영해 판독).
      공공 데이터에 없는 것은 만들어내지 않지만, **팀이 실물 라벨을 읽은 것은
      신고값과 같은 자격의 1차 자료**다. `data/labels.json` 에 근거 문구
      (품목보고번호·표시 중량·표시 열량)와 함께 적고 여기서 덮는다.
      ⚠️ 덮는 것이지 섞지 않는다 — 한 제품의 값은 한 출처에서만 온다.
   ══════════════════════════════════════════════════════════════════════ */

export type CoupangExtra = {
  /** 그 카테고리 안에서의 쿠팡 노출 순위 (1~30) */
  cpRank: number;
  /** 쿠팡에 뜬 제목 그대로 — 우리가 다듬은 이름과 다를 수 있어 근거로 남긴다 */
  cpTitle: string;
  cpQuery: string;
  cpUrl: string;
  /** 영양을 어디서 얹었나. null 이면 미확보 */
  sikFrom: "수록" | "신고" | null;
  sikScore: number | null;
};

export type CoupangProduct = Product & CoupangExtra;

/** 쿠팡 행은 Product 의 절반만 가진다 — 나머지는 「없음」으로 채워 형을 맞춘다 */
function fill(r: Record<string, unknown>): CoupangProduct {
  return {
    rpt: "",
    type: "",
    serv: "",
    na: null,
    satfat: null,
    fiber: null,
    srcEvidence: "",
    pack: "",
    /* 🔴 pop 은 0 이다. 우리가 센 쇼핑몰 노출 수인데, 이 제품들의 순서는
       쿠팡 랭킹이 정한다 — 두 잣대를 섞지 않는다 */
    pop: 0,
    popMatch: 0,
    tags: [],
    top: "",
    src: "",
    srcRank: null,
    claim: "",
    claimSrc: "",
    claimRank: null,
    date: "",
    imgScore: 0,
    ...(r as object),
  } as unknown as CoupangProduct;
}

const LABELS = labels as unknown as Record<string, Record<string, unknown>>;

export const coupangProducts: CoupangProduct[] = (raw as Record<string, unknown>[]).map((r) => {
  const over = LABELS[r.id as string];
  /* `_` 로 시작하는 키는 근거 메모라 제품 값에 섞지 않는다 */
  const clean = over
    ? Object.fromEntries(Object.entries(over).filter(([k]) => !k.startsWith("_")))
    : null;
  return fill(clean ? { ...r, ...clean } : r);
});

/** 쿠팡이 목록을 정하는 카테고리 (products.json 의 cat 값과 같은 글자) */
export const COUPANG_CATS = ["닭가슴살", "단백질바", "두유", "그릭요거트", "과자류"];

const byCat = new Map<string, CoupangProduct[]>();
for (const p of coupangProducts) {
  const arr = byCat.get(p.cat);
  if (arr) arr.push(p);
  else byCat.set(p.cat, [p]);
}
for (const arr of byCat.values()) arr.sort((a, b) => a.cpRank - b.cpRank);

export function coupangOf(cat: string): CoupangProduct[] {
  return byCat.get(cat) ?? [];
}

const ids = new Set(coupangProducts.map((p) => p.id));
export const isCoupang = (id: string) => ids.has(id);

/** 스냅샷 시점 — 화면에 항상 같이 적는다. 랭킹은 수시로 바뀐다 */
export const SNAPSHOT = "2026-08-07";
