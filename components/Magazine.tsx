import Link from "next/link";
import type { Article } from "@/lib/magazine";

/**
 * 매거진 부품 — 카드 하나와 강조 문법 하나.
 *
 * 🔴 **`**굵게**` 만 지원한다.** 기사 본문은 `lib/magazine.ts` 가 조립하는 문자열이라
 *    JSX 를 못 담는데, 그렇다고 마크다운 라이브러리를 넣으면 런타임 의존성이 는다
 *    (시연 안정성이 설계 제약이다). 우리가 실제로 쓰는 강조는 한 종류뿐이라
 *    `split` 하나로 끝난다.
 * ⚠️ `dangerouslySetInnerHTML` 을 쓰지 않는다 — 기사 문자열에 제품명이 섞여 들어가고
 *    제품명은 신고값이라 우리가 쓴 글이 아니다.
 */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((chunk, i) =>
        i % 2 === 1 ? (
          <b key={i} className="font-semibold text-ink">
            {chunk}
          </b>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </>
  );
}

/**
 * 기사 카드 — 뉴닉 홈의 아티클 카드 자리.
 *
 * 🔴 **사진이 없다.** 뉴닉 카드는 썸네일이 절반을 차지하는데, 우리 기사는 제품
 *    하나가 주인공이 아니라 626건을 가로지르는 이야기라 **대표 사진을 고르면
 *    그 제품 기사처럼 읽힌다.** 대신 이모지 한 자와 태그 둘로 성격을 준다.
 * ⚠️ 제목이 곧 요약이라(뉴닉 문법) 카드에서 3줄까지 준다. 잘라 버리면 문장이
 *    끝나지 않아 뜻이 반대로 읽힐 수 있다.
 */
export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link
      href={`/magazine/${a.slug}`}
      className="pcard focus-ring flex h-full flex-col rounded-[10px] border border-line-strong bg-card p-4"
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="text-[15px] leading-none">
          {a.emoji}
        </span>
        {a.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-flame-wash px-2 py-0.5 text-[11px] font-semibold text-flame-deep"
          >
            {t}
          </span>
        ))}
      </span>
      <span className="kr mt-2.5 block text-[15px] leading-[1.45] font-semibold text-ink">
        {a.headline}
      </span>
      <span className="kr clamp-3 mt-1.5 block text-[12.5px] leading-[1.65] text-ink-dim">
        {a.description}
      </span>
      <span className="mt-auto pt-3 text-[12px] font-semibold text-flame-deep">읽어보기 →</span>
    </Link>
  );
}

/**
 * 카드 여러 장 — 홈 절과 `/magazine` 목록, 상세의 「다른 이야기」가 같이 쓴다.
 *
 * ⚠️ `items-stretch` 가 필요하다. 제목이 두 줄인 카드와 세 줄인 카드가 섞여 있어
 *    grid 기본값(stretch)이 아니면 「읽어보기」 줄의 밑변이 어긋난다 —
 *    `ArticleCard` 의 `h-full` + `mt-auto` 가 그 전제 위에서 동작한다.
 */
export function MagazineGrid({ items, cols = 4 }: { items: Article[]; cols?: 3 | 4 }) {
  return (
    <div
      className={`grid items-stretch gap-3 px-5 sm:grid-cols-2 ${
        cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {items.map((a) => (
        <ArticleCard key={a.slug} a={a} />
      ))}
    </div>
  );
}
