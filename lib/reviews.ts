/**
 * 리뷰 — 화해의 본체를 우리 자리에 놓는 것.
 *
 * 🔴 **우리가 지어내지 않는 유일한 주관 정보**다. 이 서비스의 다른 모든 숫자는
 *    신고값이거나 거기서 센 것이고, 「맛있다」는 우리가 말할 수 없다. 사람이 남긴
 *    것만 싣고, 하나도 없으면 없다고 적는다 — 예시 리뷰를 채워 넣지 않는다 (원칙 1).
 *
 * 🔴 supabase-js 를 안 쓴다. REST fetch 두 번이 전부라 의존성을 늘릴 이유가 없다
 *    (MatchCounter 와 같은 방식).
 * 🔴 실패는 조용히 삼킨다 — 표가 없거나 env 가 비었거나 네트워크가 죽어도
 *    **리뷰 칸만 안 뜨고 화면은 완결된다.** 시연 안정성 원칙(필수 화면은 외부 요청 0)이
 *    지켜지는 이유가 이것이다. 리뷰는 부가 정보다.
 *
 * 표: public.reviews (product_id text · rating 1~5 · body ≤140 · created_at)
 *     RLS on · anon 은 insert/select 만. delete/update 정책이 없어 **지우거나
 *     고칠 수 없다** — 익명 입력이라 그쪽이 안전하다.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const reviewsEnabled = Boolean(URL_ && KEY);

export type Review = {
  id: number;
  rating: number;
  body: string | null;
  created_at: string;
};

const headers = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}` });

/** 이 제품의 리뷰 — 최근 것부터. 실패하면 null (「아직 없음」과 구분한다) */
export async function fetchReviews(productId: string): Promise<Review[] | null> {
  if (!reviewsEnabled) return null;
  try {
    const q = new URLSearchParams({
      select: "id,rating,body,created_at",
      product_id: `eq.${productId}`,
      order: "created_at.desc",
      limit: "20",
    });
    const res = await fetch(`${URL_}/rest/v1/reviews?${q}`, { headers: headers() });
    if (!res.ok) return null;
    return (await res.json()) as Review[];
  } catch {
    return null;
  }
}

/**
 * 🔴 **전체 개수·평균은 따로 받는다** (2026-08-08).
 *
 * 위 fetchReviews 는 **최근 20건**만 가져온다. 그런데 화면 머리의 「★4.3 · N개」를
 * 그 배열 길이로 세고 있어서, 리뷰가 20건을 넘는 순간 **몇 건이 있든 전부 「20개」**로
 * 찍히고 평균도 최근 20건의 평균이 된다. 시연용 리뷰를 넣기 전에는 리뷰가 0~1건이라
 * 드러나지 않던 자리다.
 *
 * PostgREST 집계 함수는 이 프로젝트에서 막혀 있다 (`PGRST123: Use of aggregate
 * functions is not allowed`). 그래서 `public.review_stats` 뷰를 두고 한 번에 읽는다.
 *
 * ⚠️ 뷰가 없으면 **null 을 돌려주고 화면은 옛 방식(목록 길이)으로 물러선다** —
 *    표가 없을 때 리뷰 칸이 통째로 안 뜨는 것과 같은 규칙이다. 뷰를 만들면
 *    재배포 없이 저절로 정확해진다.
 */
export type ReviewStats = {
  n: number; avg: number;
  /** 별점별 개수 — 화해식 분포 막대가 쓴다 (2026-08-08) */
  r5: number; r4: number; r3: number; r2: number; r1: number;
};

const EMPTY: ReviewStats = { n: 0, avg: 0, r5: 0, r4: 0, r3: 0, r2: 0, r1: 0 };

export async function fetchStats(productId: string): Promise<ReviewStats | null> {
  if (!reviewsEnabled) return null;
  /* 🔴 별점별 개수(r5..r1)는 뷰를 한 번 더 고쳐야 생긴다. 아직 옛 뷰(n,avg)면
     첫 요청이 400 이 나는데, 그때 **개수·평균만이라도** 받아 온다 —
     분포 막대만 안 그리고 별점·개수는 뜬다. 뷰를 고치면 저절로 막대가 생긴다. */
  for (const sel of ["n,avg,r5,r4,r3,r2,r1", "n,avg"]) {
    try {
      const q = new URLSearchParams({ select: sel, product_id: `eq.${productId}` });
      const res = await fetch(`${URL_}/rest/v1/review_stats?${q}`, { headers: headers() });
      if (!res.ok) continue;
      const rows = (await res.json()) as Partial<ReviewStats>[];
      if (!rows[0]) return EMPTY;
      return { ...EMPTY, ...rows[0] } as ReviewStats;
    } catch {
      /* 다음 형태로 재시도 */
    }
  }
  return null;
}

/**
 * 🔴 **별점별 개수를 직접 센다 — 뷰가 없어도 된다** (2026-08-08).
 *
 * 분포 막대를 그리려면 1~5점이 각각 몇 개인지 알아야 하는데, PostgREST 는 이 프로젝트에서
 * 집계 함수가 막혀 있다(`PGRST123`). 뷰에 컬럼을 더하는 방법도 있지만 대시보드에서
 * 사람이 SQL 을 돌려야 한다 — 그 대신 **`count=exact` 를 별점마다 한 번씩, 다섯 번**
 * 부른다. `limit=0` 이라 본문이 0바이트고 응답 헤더의 Content-Range 만 읽는다.
 *
 * 여기서 n 과 avg 도 같이 나온다 (합과 가중합). 뷰를 아예 안 거치므로
 * **상세·리뷰 페이지는 뷰 상태와 무관하게 정확하다.**
 * ⚠️ 목록 카드는 여전히 뷰를 쓴다 — 제품 42개에 요청 210번을 보낼 수는 없다.
 */
export async function fetchHistogram(productId: string): Promise<ReviewStats | null> {
  if (!reviewsEnabled) return null;
  try {
    const counts = await Promise.all(
      [1, 2, 3, 4, 5].map(async (star) => {
        const q = `select=id&product_id=eq.${encodeURIComponent(productId)}&rating=eq.${star}&limit=0`;
        const res = await fetch(`${URL_}/rest/v1/reviews?${q}`, {
          headers: { ...headers(), Prefer: "count=exact" },
        });
        if (!res.ok) return 0;
        // "*/1234" 또는 "0-0/1234"
        const cr = res.headers.get("content-range") ?? "";
        return Number(cr.split("/")[1] ?? 0) || 0;
      }),
    );
    const [r1, r2, r3, r4, r5] = counts;
    const n = r1 + r2 + r3 + r4 + r5;
    if (n === 0) return EMPTY;
    const avg = Math.round(((r1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5) / n) * 10) / 10;
    return { n, avg, r1, r2, r3, r4, r5 };
  } catch {
    return null;
  }
}

/**
 * 전체 리뷰 페이지용 — 쪽 단위로 받는다 (2026-08-08).
 * ⚠️ 5,151건짜리 제품이 있어 한 번에 다 받으면 안 된다. 「더 보기」로 이어 붙인다.
 */
export async function fetchReviewPage(
  productId: string,
  offset: number,
  limit = 30,
  /** 있으면 그 별점만 — 「1점만 보기」가 실제로 눌리는 필터다 */
  star?: number,
): Promise<Review[] | null> {
  if (!reviewsEnabled) return null;
  try {
    const q = new URLSearchParams({
      select: "id,rating,body,created_at",
      product_id: `eq.${productId}`,
      order: "created_at.desc",
      offset: String(offset),
      limit: String(limit),
    });
    if (star) q.set("rating", `eq.${star}`);
    const res = await fetch(`${URL_}/rest/v1/reviews?${q}`, { headers: headers() });
    if (!res.ok) return null;
    return (await res.json()) as Review[];
  } catch {
    return null;
  }
}

/** 남기기. 성공하면 true */
export async function postReview(
  productId: string,
  rating: number,
  body: string,
): Promise<boolean> {
  if (!reviewsEnabled) return false;
  try {
    const res = await fetch(`${URL_}/rest/v1/reviews`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        product_id: productId,
        rating,
        // ⚠️ 빈 문자열이 아니라 null 로 넣는다 — 「안 적었다」와 「빈 줄을 적었다」는 다르다
        body: body.trim() ? body.trim().slice(0, 140) : null,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 평균과 개수. ⚠️ 반올림은 소수 한 자리까지만 — 별점은 원래 거친 값이다 */
export function summarize(list: Review[]): { avg: number; n: number } {
  if (!list.length) return { avg: 0, n: 0 };
  const sum = list.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((sum / list.length) * 10) / 10, n: list.length };
}

/** 「3일 전」 — 시각을 정확히 적을 이유가 없고, 초 단위는 익명 글에서 되레 불편하다 */
export function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}일 전` : `${Math.floor(d / 30)}달 전`;
}
