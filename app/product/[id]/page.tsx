import Link from "next/link";
import Icon from "@/components/Icon";
import { notFound } from "next/navigation";
import NutritionSummary from "@/components/NutritionSummary";
import ProductCard from "@/components/ProductCard";
import IngredientGroups from "@/components/IngredientGroups";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import DmSeed from "@/components/DmSeed";
import { dmSeedOf } from "@/lib/dm-compose";
import CartButton from "@/components/CartButton";
import { priceOf } from "@/lib/cart";
import { similarTo } from "@/lib/similar";
import Reviews from "@/components/Reviews";
import ReviewDigest from "@/components/ReviewDigest";
import ProductTabs from "@/components/ProductTabs";
import CardRating from "@/components/CardRating";
import ProteinCalc from "@/components/ProteinCalc";
import Editorial from "@/components/Editorial";
import FitFor from "@/components/FitFor";
import { snapOf } from "@/lib/likes";
import { catLabel, findProduct, products } from "@/lib/data";
import { summaryOf } from "@/lib/summary";
/* 오른쪽 컬럼이 비는지 미리 알기 위해 — 아래 `hasProse` 주석 참조 */
import { editorialOf } from "@/lib/editorial";
import { editorNotesOf } from "@/lib/editor-notes";
import { fitReasonsOf } from "@/lib/fit";

/** 데이터가 정적 JSON 이라 661쪽 전부 빌드 때 뽑는다 — 시연 중 서버 렌더링이 없다 */
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

/** 탭 제목이 전 제품 「프로틴더」 하나였다 — 탭을 여럿 열면 구분이 안 됐다 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = findProduct(decodeURIComponent(id));
  if (!p) return { title: "프로틴더" };
  return {
    title: `${p.name} — 프로틴더`,
    description: `${catLabel(p.cat)}${p.size ? ` · 총 ${p.size}` : ""} · 신고 원재료 배합 순서와 영양성분`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  /* 🔴 탭을 `searchParams` 로 읽지 않는다 (2026-08-08 수정).
     `?tab=review` 로 만들었더니 **이 라우트가 통째로 동적 렌더링으로 내려갔다** —
     빌드 로그에서 `● /product/[id]` (SSG 626쪽) 가 `ƒ` 로 바뀐다. searchParams 를
     한 번이라도 읽으면 Next 가 그 쪽을 요청 시 렌더로 돌린다.
     「시연 중 서버 렌더링이 없다」가 이 앱의 설계 제약이라 되돌렸다.
     대신 **CSS `:target`** 으로 가른다 — 해시는 서버로 안 가서 SSG 가 유지되고,
     `/product/x#review` 로 주소 공유도 그대로 된다 (globals.css `.ptabs`). */
  const p = findProduct(decodeURIComponent(id));
  if (!p) notFound();

  const summary = summaryOf(p);
  const price = priceOf(p.id);

  /* 🔴 잣대가 두 번 바뀌었다 — 단백질 한 축 → 1회 기준 다섯 축 거리 →
     **같은 카테고리 랭킹 순서** (2026-08-08 · 팀 지시 · `lib/similar.ts` 주석에 전문).
     이 칸에서 하는 일이 비교 상대 고르기라, 랭킹 순서를 그대로 물려주면
     이 화면에 새 잣대가 하나 줄고 랭킹 탭과 어휘도 어긋나지 않는다. */
  const similar = similarTo(p, 6);

  /* 🔴 오른쪽 컬럼이 비는지를 **미리** 안다. 두 컴포넌트가 안에서 null 을 돌려주므로
     페이지는 그 사실을 모른 채 빈 칸을 그리고 있었다. 조립 함수는 순수하니 여기서
     한 번 더 불러 배치를 정한다 (렌더에서 또 부르지만 계산이 가볍다). */
  const hasProse =
    editorialOf(p) !== null || fitReasonsOf(p) !== null || editorNotesOf(p.id) !== null;

  /* 원재료 카드 — 자리를 두 군데서 쓰므로 변수로 뽑는다 (전폭 / 오른쪽 컬럼) */
  const ingsCard = (
    <Section
      id="sec-ings"
      title={
        <span className="flex flex-wrap items-center gap-2">
          원재료
          {/* 계통(동물성/식물성/혼합) 칩 — 원료 이야기는 이 카드 한 곳에서만 한다 */}
          <Link
            href={`/products?base=${encodeURIComponent(p.base)}`}
            className={`focus-ring rounded-md px-2 py-0.5 text-[12px] font-semibold transition-colors ${
              p.base === "원료 불명확"
                ? "bg-thumb text-faint hover:text-muted"
                : "bg-track text-ink-sub hover:bg-line-strong hover:text-ink"
            }`}
          >
            {p.base}
          </Link>
        </span>
      }
      note={p.ings.length > 0 ? `배합 순서 · 총 ${p.ings.length}종` : "신고 자료 미확보"}
    >
      <IngredientGroups p={p} />
    </Section>
  );

  /* ❌ `noData` 분기 폐기 (2026-08-08 · 팀 지시).
     원재료 미신고면 「비슷한 제품」을 오른쪽 컬럼 **안으로** 올려 공백을 메우고 있었다.
     그 결과 원재료가 짧은 제품에서 이 구획이 위로 치고 올라와 **제품마다 자리가
     달라졌다** — 자리가 흔들리는 쪽이 공백보다 나쁘다. 이제 언제나 전폭·맨 아래다.
     공백은 계산기를 왼쪽 컬럼으로 내려 줄였다. */

  const similarBlock =
    similar.length > 0 ? (
      <section id="sec-similar" className="card rounded-2xl p-6">
        <h2 className="text-[18px] font-bold text-title leading-[27px]">
          비교해 볼 제품
        </h2>
        {/* ⚠️ 문구가 잣대를 그대로 적어야 한다 — 잣대를 랭킹 순서로 바꿨는데 여기만
            「영양성분이 가까운」으로 남으면 화면이 거짓말을 한다 (lib/similar.ts) */}
        <p className="mt-1 text-[14px] text-muted">
          {catLabel(p.cat)} 랭킹에 함께 오른 제품입니다 — 랭킹 순서 그대로 놓았습니다.
        </p>
        {/* 카드를 작게 (2026-08-06 밤 · 팀 결정) — 전폭이라 6개를 6열로 */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {similar.map((s) => (
            /* 🔴 1:1 대조 진입 (STEP 3). ProductCard 가 통째로 <Link> 라 버튼을
               안에 못 넣는다 — 형제로 띄워 얹는다 (중첩 <a> 는 HTML 위반) */
            <div key={s.id} className="relative">
              <ProductCard p={s} />
              <Link
                /* 🔴 `?a=&b=` → `?ids=` (2026-08-08 버그 수정). ver1 상세를 옮겨 올 때
                   링크만 따라오고 비교 쪽 파라미터는 `ids=` 로 바뀌어 있어서, **이
                   버튼이 비교 탭의 빈 화면으로 가고 있었다** — 비교로 들어오는 가장
                   흔한 길이다. 비교 쪽도 옛 문법을 계속 받는다 (이미 나간 주소 보호). */
                href={`/compare?ids=${encodeURIComponent(p.id)},${encodeURIComponent(s.id)}`}
                /* 🔴 흰 버튼 「대조」 → 시그니처색 채움 「비교」 (2026-08-08 · 팀 지시
                   「바로 비교기능」). 이 칸에서 하려는 일이 비교인데 버튼이 카드 위에
                   희미하게 얹혀 있어 누를 것으로 안 읽혔다.
                   ⚠️ 낱말도 「비교」로 통일한다 — 도착하는 탭 이름이 비교다.
                   ~lg 는 가로형 카드라 우상단이 용량 글자 자리다 — 모바일은 우하단에 둔다 */
                className="focus-ring absolute bottom-1.5 right-1.5 z-10 rounded-md bg-flame-deep px-2.5 py-1 text-[11.5px] font-bold text-white shadow-sm transition-colors hover:bg-flame lg:bottom-auto lg:top-1.5"
              >
                비교
              </Link>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  /* 🔴 SectionTabs 를 걷어냈다. 구획이 「원재료」 하나로 줄어 탭이 자기 자신만
     가리키게 됐다. 「이름과 배합 순서」는 구획을 없애고 원재료 안 한 줄로 내렸다 —
     RTD 271건 중 해당 제품이 1건뿐이라(파우더는 58건) 구획 하나를 차지할 값이 아니다.
     탭이 사라지면서 이 화면에서 클라이언트 컴포넌트도 같이 없어졌다. */

  return (
    <div className="container-page px-4 py-5 lg:px-24">
      {/* ══ 히어로 — 사진 + 이름. 탭 **위**라 어느 탭에서도 제품이 보인다 ══

          🔴 **사진을 여기로 올렸다** (2026-08-08 · 팀 지시 「이름 창에 빈 공간이 너무 많다」).
             제목 블록만 전폭으로 두니 오른쪽 45%가 통째로 비어 띠처럼 보였다 —
             글이 왼쪽에만 있는데 상자만 화면 끝까지 간 것이 원인이다.
             사진이 왼쪽 400px 을 채우면 그 띠가 사라지고, 화해·드링크메모의
             「제품 영역(사진+이름) → 탭 → 내용」 골격과도 같아진다.
          ⚠️ 모바일 순서는 **이름 먼저**다 — 무엇인지 모른 채 사진부터 보게 두지 않는다.
             그래서 DOM 은 이름 → 사진이고, lg 부터 grid 로 자리를 바꾼다. */}
      <div className="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-x-10">
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <nav className="text-[12px] text-muted flex gap-1.5">
          <Link href="/products" className="hover:text-ink">
            제품검색
            </Link>
            <span>›</span>
            <Link
              href={`/products?cat=${encodeURIComponent(p.cat)}`}
              className="hover:text-ink"
            >
              {catLabel(p.cat)}
            </Link>
            {/* type 은 C002 미수록 141건에서 빈 문자열 — 구분자만 남기지 않는다 */}
            {p.type && (
              <>
                <span>›</span>
                <span>{p.type}</span>
              </>
            )}
          </nav>

          {/* 브랜드는 제품명 앞머리에서 뽑은 값이다 — 신고 제조사가 아니다.
              제조사 칸에는 「(주)삼양패키징광혜원공장」처럼 위탁생산 공장명이 들어 있다. */}
          {p.brand && (
            <Link
              href={`/products?brand=${encodeURIComponent(p.brand)}`}
              className="focus-ring mt-2 inline-block text-[13px] font-semibold text-ink-sub hover:underline"
            >
              {p.brand}
            </Link>
          )}
          {/* break-keep — 낱말 한가운데가 갈리면 안 된다. 붙여 쓴 이름 120건이
              칸을 넘칠 때만 끊기도록 overflow-wrap 을 같이 둔다 (카드와 같은 규칙) */}
          <h1 className="mt-1 break-keep text-[30px] font-bold text-title leading-[40px] [overflow-wrap:anywhere]">
            {p.name}
          </h1>
          {/* 🔴 1회 제공량(servSize)은 적지 않는다. RTD 는 100ml당으로 신고하면서
              이 칸에 200ml 을 관행적으로 적어 두고, 파우더는 절반이 미신고이며
              가루 무게가 아니라 물을 탄 완성 음료 부피가 적힌 것도 섞여 있다.
              기준은 아래 영양정보 카드 한 곳에서만 말한다. */}
          <p className="mt-1.5 text-[15px] text-muted">
            {catLabel(p.cat)}
            {p.size && ` · 총 ${p.size}`}
          </p>

          {/* 🔴 별점 — 화해는 제품 제목 바로 밑에 `★ 4.61 (84,782)` 한 줄이다.
              누르면 리뷰 탭으로 간다 (2026-08-08 · 팀 지시 "별점 눌렀을 때의 별도 탭"). */}
          {/* 별점을 누르면 리뷰 탭으로 — 쿼리가 아니라 해시다 (SSG 유지 · ProductTabs 주석) */}
          {/* 별점을 누르면 리뷰 탭으로 — **같은 쪽 해시라 절대경로를 쓰지 않는다.**
              `/product/x#review` 로 적으면 next/link 경로가 되어 `:target` 이 안 걸린다
              (CardRating 주석) */}
          <CardRating id={p.id} big href="#review" className="mt-2" />

          {/* 🔴 가격 — 우리가 실제로 수집한 것만 적고 출처를 함께 적는다 (원칙 1·2).
              쿠팡 403 · 네이버 쇼핑 API 없음이라 올리브영이 유일한 소스였고,
              210건 중 잡힌 것에만 뜬다. 없는 제품은 이 줄이 아예 안 생긴다. */}
          {price && (
            <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[24px] font-bold tabular-nums text-title">
                {price.won.toLocaleString()}
                <span className="text-[15px] font-semibold">원</span>
              </span>
              <span className="text-[11.5px] text-faint">
                {price.src ?? "올리브영"} {price.at} 기준
                {price.pack
                  ? ` · ${price.pack}개 ${price.raw?.toLocaleString()}원을 낱개로 나눈 값${price.guess ? " (개수 추정)" : ""}`
                  : ""}
              </span>
            </p>
          )}

          {/* 🔴 한 줄 요약 — 「결론적으로 이 제품은 무엇인가」 (팀 요청).
              화면이 이미 말한 사실(태그·당류 양끝·유당·콜라겐)만 조합한다 — lib/summary.ts 주석.
              제품명 바로 아래로 올리고 상자를 입혔다 (2026-08-07 · 태그와 버튼 사이에
              맨글자로 끼어 있어 「애매한 위치에 밋밋하다」는 지적). 파랑 왼줄은 강조지
              방향(좋음/나쁨)이 아니다 — 배경은 중립 회색을 쓴다 */}
          {summary && (
            <p className="mt-3.5 break-keep rounded-lg border-l-[3px] border-line-strong bg-thumb px-3.5 py-2.5 text-[13.5px] leading-[21px] text-body">
              <b className="font-bold text-ink">요약</b> — {summary}
            </p>
          )}

          {/* ❌ **태그 줄 전면 삭제** (2026-08-08 · 팀 지시 「태그는 그냥 전체 삭제
              — 2차든 3차든」). 여기 있던 것: 구경 태그 4종(장단 뚜렷·원재료 단출·
              단맛 원료 없음·숨은 강자) · 맛 칩.

              🔴 잣대는 안 지웠다. `lib/explore-tags.ts` 와 `p.flavors` 는 그대로 있고
                 맛은 검색 필터(`?flavor=`)가 계속 쓴다 — **지운 것은 표시지 데이터가
                 아니다.** 8/7 「상·하위 20% 배지 삭제」와 같은 처리다.
              ⚠️ 태그 줄이 통째로 사라져 제목 아래가 요약 → 버튼으로 바로 이어진다. */}

          {/* 구매 동선 — 가격 데이터가 전부 막혀 있어(쿠팡·SSG 403 · 네이버 쇼핑 API 종료)
              값을 싣지 않고 검색 링크만 연다. 링크라 런타임 외부 요청도 0이다.
              🔴 채움 버튼이다 (2026-08-07 · 「흰 박스라 시인성이 떨어진다」).
              이 화면의 행동 버튼은 이 줄뿐이라 파랑 채움을 줘도 다른 요소와 안 싸운다 */}
          {/* 🔴 **버튼을 두 줄로 나눴다** (2026-08-08 · 팀 지시 「버튼 재분배」).
              전에는 다섯이 한 `flex-wrap` 줄에 섞여 있었다 — 찜·공유(보조)와
              담기·구매검색(주 행동)이 같은 줄에서 폭에 따라 아무렇게나 접혔고,
              「담기」가 「장바구니」로 바뀌면 그 접힘이 통째로 달라졌다.

                윗줄  담기 · 네이버쇼핑 · 쿠팡     ← 채운 버튼 = 사는 일
                아랫줄 찜 · 공유                  ← 테두리 버튼 = 남기는 일

              ⚠️ 순서를 뒤집었다. 전에는 찜·공유가 **먼저** 와서 주 행동이 뒤로
                 밀려 있었다. 채움/테두리로 위계를 주면서 자리도 맞춘다. */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* 🔴 담기 — 가격을 아는 제품에만 뜬다 (2026-08-08 · 심사위원 피드백).
                없는 가격을 지어내 담게 하지 않는다. 가격을 모르는 제품은 아래
                검색 링크가 그대로 남아 기존 동선이 끊기지 않는다. */}
            {price && (
              <CartButton
                line={{ id: p.id, name: p.name, img: p.img ?? null, won: price.won, title: price.title }}
              />
            )}
            {[
              {
                label: "네이버쇼핑에서 찾기",
                href: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(p.name)}`,
              },
              {
                label: "쿠팡에서 찾기",
                href: `https://www.coupang.com/np/search?q=${encodeURIComponent(p.name)}`,
              },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-1.5 rounded-md bg-brand-strong px-3.5 py-2 text-[13px] font-semibold text-on-brand transition-colors hover:bg-brand-deep"
              >
                {s.label}
                <Icon name="external-link" size={11} className="opacity-70" />
              </a>
            ))}
          </div>

          {/* 보조 줄 — 테두리 버튼 둘. 주 행동과 섞이지 않게 줄을 갈랐다 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* 찜 — 로그인 없이 이 브라우저에만 저장 (lib/likes.ts) */}
            {/* 🔴 보이지 않는 부품 — 이 제품이 쪽지를 보낸다 (2026-08-08 · 틴더 정체성).
                문장은 서버(`dmSeedOf`)가 짓고 여기서는 넘기기만 한다 —
                조립 함수가 products.json 을 물고 있어 클라이언트에서 부르면
                0.5MB 가 번들에 실린다 (찜콩 `snapOf` 와 같은 규칙). */}
            <DmSeed seed={dmSeedOf(p)} />
            <LikeButton snap={snapOf(p)} variant="detail" />
            {/* 친구에게 공유 (2026-08-07 · 팀 요청) — OS 공유 시트. SDK 0 · 외부 요청 0 */}
            <ShareButton name={p.name} summary={summary ?? undefined} />
          </div>
        </div>

        {/* 사진 — 모바일에서는 이름 다음 · 데스크톱 왼쪽 400px */}
        <div className="mt-5 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-thumb p-6 lg:col-start-1 lg:row-start-1 lg:mt-0">
          {p.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.img} alt={p.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[13px] text-faint">{p.type}</span>
          )}
        </div>
      </div>

      {/* 🔴 탭 — 화해의 [상품정보] [리뷰/성분] (2026-08-08 · 팀 지시).
          **JS 가 0 이다.** 해시 앵커 + CSS `:target` 이라 하이드레이션을 안 기다리고,
          탭마다 주소가 달라(`#review`) 리뷰 탭을 그대로 공유할 수 있다.
          ⚠️ 두 패널이 **둘 다 DOM 에 있다.** 리뷰 컴포넌트는 탭이 접혀 있어도 마운트돼
             Supabase 를 부르는데, 탭이 생기기 전에도 그랬으니 되돌아간 것뿐이다
             (리뷰는 부가 정보 · 실패해도 화면은 완결 — lib/reviews.ts). */}
      <div className="ptabs">
        {/* 🔴 **뛰어가는 자리는 여기다** (2026-08-08 · 「별점을 누르면 이상한 곳으로
            간다」의 수정). 전에는 아래 리뷰 패널 자신이 `#review` 였는데, 그 패널은
            켜지기 전까지 `display:none` 이라 **좌표가 (0,0)** 이었다 (실측) — 눌러도
            제품 맨 위로 튀었다. 늘 자리를 갖는 0높이 앵커를 탭 막대 **위**에 두어
            누르면 탭 막대가 화면 맨 위에 걸리게 했다.
            ⚠️ `.ptabs` 의 직계 자식이어야 한다 — CSS 가 `> #review` 로 묻는다. */}
        <span id="review" className="ptab-anchor" aria-hidden />

        <ProductTabs id={p.id} />

        <div id="review-panel" className="flex flex-col gap-6 pt-6">
          {/* 화해의 「AI가 분석한 리뷰」 자리 — 우리는 실제 리뷰 본문을 센다 */}
          <ReviewDigest productId={p.id} />
          <Reviews productId={p.id} />
        </div>

        <div id="info-panel" className="pt-6">
      {/* 🔴 **간격은 카드가 아니라 컬럼이 갖는다** (2026-08-08 · 팀 지시
          「탭들이 들쭉날쭉하다 · 길이나 자리가 균일하지 않다」).
          카드마다 `mt-6` 이 박혀 있어 어떤 카드가 뜨고 안 뜨는지에 따라 첫 카드
          위쪽 간격이 달라졌다 — 두 컬럼의 시작 높이가 제품마다 어긋나던 원인이다.
          컴포넌트에서 `mt-6` 을 걷어내고 여기 `gap-6` 하나로 모았다.
       ⚠️ `items-start` 를 준다. 기본값(stretch)이면 짧은 컬럼의 마지막 카드가
          늘어나 빈 흰 상자가 된다. */}
      <div className="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-x-10">
        {/* 왼쪽 — 재는 것들. 길이가 제품과 무관하게 거의 일정하다 */}
        <div className="flex w-full flex-col gap-6">
          <NutritionSummary p={p} />
          {/* 🔴 계산기를 왼쪽으로 내렸다. 오른쪽(에디터·고르는 이유·원재료)은 제품마다
              길이가 크게 다른데 왼쪽은 영양정보 하나뿐이라 밑변이 늘 어긋났다 */}
          <ProteinCalc protPack={p.protPack} packLabel={p.packLabel} />
        </div>

        {/* 오른쪽 — 읽는 것들.
            🔴 에디터·고르는 이유가 **둘 다 안 뜨는 제품**(쿠팡 카테고리 등)에서는
               이 컬럼이 통째로 빈다. 그때만 원재료를 여기로 올려 두 컬럼을 채운다.
               ⚠️ 옛 코드는 이 판단을 `p.ings.length === 0` 으로 했다 — 조건이 틀렸다.
                  원재료가 짧은 것과 오른쪽이 빈 것은 다른 사실이고, 그래서
                  「황성주 박사 국산콩」에서 비슷한 제품이 위로 치고 올라왔다. */}
        <div className="mt-6 flex min-w-0 flex-col gap-6 lg:mt-0">
          <Editorial p={p} />
          <FitFor p={p} />
          {!hasProse && ingsCard}
        </div>
      </div>

      {/* ── 전폭 밴드 ──
          🔴 **원재료는 전폭이다** (2026-08-08 · 팀 지시 「빈 공간이 너무 많다」).
             오른쪽 컬럼에 있던 때는 왼쪽(영양정보+계산기)이 절반 높이라 아래가 텅 비었다.
             네 칸이 가로로 넉넉해지는 것은 8/6에 이미 확인한 배치고, 그때 오른쪽으로
             옮긴 이유(「전폭이면 우측이 빈다」)는 에디터·고르는 이유가 그 자리를
             채우면서 사라졌다.
          🔴 **비슷한 제품은 언제나 전폭이고 맨 아래다** — 자리가 흔들리는 쪽이
             공백보다 나쁘다 (위 `noData` 폐기 주석). */}
      <div className="mt-6 flex flex-col gap-6">
        {hasProse && ingsCard}
        {similarBlock}
      </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  /** 계통 칩처럼 제목 옆에 붙는 것이 있어 노드도 받는다 */
  title: React.ReactNode;
  note?: string;
  children: React.ReactNode;
}) {
  /* ⚠️ `mt-6` 을 여기 두지 않는다 (2026-08-08). 원재료 카드가 오른쪽 컬럼의 첫
     카드가 될 때 그 24px 이 남아 **왼쪽 컬럼보다 24px 아래에서 시작**했다.
     간격은 카드가 아니라 컬럼(`gap-6`)이 갖는다. */
  return (
    <section id={id} className="card rounded-2xl p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-[18px] font-bold text-title leading-[27px]">{title}</h2>
        {note && <span className="text-[12px] text-muted">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/* Mini · NoteBox 는 「같은 카테고리에서의 위치」와 「읽을 때 주의할 점」에만 쓰던
   컴포넌트라 두 구획을 걷어내면서 같이 지웠다. */
