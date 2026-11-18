/**
 * 목록 카드용 별점 — **한 화면에 한 요청**으로 모은다 (2026-08-08 · 화해 개편).
 *
 * 🔴 카드는 서버에서 정적으로 그려지는데 별점은 Supabase 에 있다. 카드마다 fetch 하면
 *    한 화면에 14~30 요청이 나간다. 그래서 각 카드가 `getStats(id)` 를 부르면 여기서
 *    **마이크로태스크 한 틱 동안 id 를 모아 두었다가 한 번에** 부른다
 *    (`review_stats?product_id=in.(a,b,c)`).
 *
 * ⚠️ 시연 안정성 원칙(필수 화면 외부 요청 0)의 예외다 — 매칭 카운터·리뷰와 같은 자리로,
 *    **실패하면 별점만 안 뜨고 카드는 그대로 완결된다.** 영양값·등급은 정적 JSON 이라
 *    네트워크가 죽어도 목록이 비지 않는다.
 * ⚠️ URL 길이 때문에 한 묶음 80개로 자른다 (id 가 20자 안팎이라 80개면 ~1.8KB).
 * ⚠️ 모듈 수준 캐시라 페이지를 옮겨도 이미 받은 것은 다시 안 부른다.
 */
/** 카드가 쓰는 것만 — 분포는 상세에서 fetchHistogram 이 따로 센다 */
export type Stats = { n: number; avg: number };

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const ratingsEnabled = Boolean(URL_ && KEY);

const cache = new Map<string, Stats | null>();
const waiting = new Map<string, ((s: Stats | null) => void)[]>();
let queued = false;

const CHUNK = 80;

async function flush() {
  queued = false;
  const ids = [...waiting.keys()];
  if (ids.length === 0) return;

  for (let i = 0; i < ids.length; i += CHUNK) {
    const part = ids.slice(i, i + CHUNK);
    let rows: (Stats & { product_id: string })[] = [];
    try {
      /* PostgREST 의 in 필터. 값에 콤마·괄호가 없어야 해서 큰따옴표로 감싼다 */
      const list = part.map((id) => `"${id}"`).join(",");
      /* 🔴 카드는 **개수와 평균만** 쓴다 — 별점별 분포는 안 그린다.
         전에는 r5..r1 까지 물어보다 뷰에 그 컬럼이 없어 400 이 나고 한 번 더 부르고
         있었다 (콘솔 에러 1건의 정체). 카드가 안 쓰는 값을 물을 이유가 없다.
         분포가 필요한 상세·리뷰 페이지는 fetchHistogram 이 직접 센다. */
      const res = await fetch(
        `${URL_}/rest/v1/review_stats?select=product_id,n,avg&product_id=in.(${list})`,
        { headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` } },
      );
      if (res.ok) rows = await res.json();
    } catch {
      /* 조용히 삼킨다 — 별점만 안 뜬다 */
    }
    const found = new Map(rows.map((r) => [r.product_id, r]));
    for (const id of part) {
      /* 🔴 리뷰가 하나도 없는 제품은 뷰에 행이 아예 없다. null 로 캐시해
         「아직 없음」으로 그린다 — 다시 부르지 않기 위해서도 캐시가 필요하다 */
      const s = found.get(id) ?? null;
      cache.set(id, s);
      waiting.get(id)?.forEach((fn) => fn(s));
      waiting.delete(id);
    }
  }
}

export function getStats(id: string): Promise<Stats | null> {
  if (!ratingsEnabled) return Promise.resolve(null);
  if (cache.has(id)) return Promise.resolve(cache.get(id)!);
  return new Promise((resolve) => {
    const arr = waiting.get(id);
    if (arr) arr.push(resolve);
    else waiting.set(id, [resolve]);
    if (!queued) {
      queued = true;
      /* 같은 틱에 마운트된 카드들을 전부 모은다 */
      queueMicrotask(() => setTimeout(flush, 0));
    }
  });
}
