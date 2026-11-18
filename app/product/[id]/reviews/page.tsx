import Link from "next/link";
import { notFound } from "next/navigation";
import AllReviews from "@/components/AllReviews";
import { catLabel, findProduct, products } from "@/lib/data";

/**
 * 전체 리뷰 — 화해의 「전체 리뷰보기」가 가는 별도 페이지 (2026-08-08 · 팀 지시).
 *
 * 🔴 **상세에서 탭으로 접지 않고 페이지를 나눈다.** 5,151건짜리 제품이 있어 상세 안에
 *    다 넣으면 화면이 안 끝나고, 주소가 있어야 리뷰만 따로 공유·북마크가 된다.
 *    화해도 같은 구조다 (상세는 2~3건 + 「전체 리뷰보기 ›」).
 *
 * ⚠️ 껍데기(제품명·돌아가기)는 서버에서 정적으로 그리고, 목록만 클라이언트가 채운다.
 *    리뷰가 Supabase 에 있어 빌드 때는 알 수 없다.
 */
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = findProduct(decodeURIComponent(id));
  return { title: p ? `${p.name} 리뷰 — 프로틴더` : "리뷰 — 프로틴더" };
}

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = findProduct(decodeURIComponent(id));
  if (!p) notFound();

  return (
    <div className="container-page px-4 lg:px-24 py-5">
      <nav className="flex gap-1.5 text-[12px] text-muted">
        <Link href="/products" className="hover:text-brand-ink">
          제품검색
        </Link>
        <span>›</span>
        <Link href={`/product/${p.id}`} className="hover:text-brand-ink">
          {p.name}
        </Link>
        <span>›</span>
        <span>리뷰</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-keep text-[24px] font-bold leading-[32px] text-title [overflow-wrap:anywhere]">
            {p.name}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            {catLabel(p.cat)}
            {p.size && ` · 총 ${p.size}`}
          </p>
        </div>
        <Link
          href={`/product/${p.id}`}
          className="focus-ring shrink-0 rounded-md border border-line-hover px-3.5 py-2 text-[13px] font-semibold text-body transition-colors hover:border-brand-strong hover:text-brand-ink"
        >
          제품 정보로
        </Link>
      </div>

      <AllReviews productId={p.id} />

      <p className="mt-8 text-[11.5px] leading-[17px] text-faint">
        리뷰는 로그인 없이 남긴 것이라 작성자를 확인하지 않습니다. 한 번 남기면 지우거나
        고칠 수 없습니다.
      </p>
    </div>
  );
}
