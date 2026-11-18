import type { Metadata } from "next";
import Icon from "@/components/Icon";
import Link from "next/link";
import HeaderActions from "@/components/HeaderActions";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

/* 🔴 탭 이름 (2026-08-08 · 팀 지시) — 「프로틴더 — 단백질 제품 원재료·영양성분 비교」는
   브라우저 탭에서 「프로틴더 — 단백질 제」까지만 보이고 잘렸다. 짧게 간다.
   ⚠️ `template` 이 없으므로 하위 쪽은 각자 `title` 을 그대로 쓴다
      (제품 상세 「{제품명} — 프로틴더」 등). 여기는 홈 제목이다. */
/* 🔴 링크 미리보기 (2026-08-08 · 팀 지시 「카카오톡 썸네일이 셀렉스로 뜬다」).
   og 태그가 하나도 없어서 크롤러가 **페이지 안 제품 사진을 아무거나** 집어 갔다 —
   남의 제품 사진이 우리 서비스 대표 이미지로 돌아다니던 자리다.

   `public/og.png` 1200×630 — 마크 + 글자 로고 + 태그라인. 굽는 스크립트는
   scratchpad 의 `og.mjs` 이고, 런타임에 만들지 않는다(정적 PNG 한 장).
   ⚠️ **`metadataBase` 가 없으면 안 된다.** 없으면 og:image 가 `/og.png` 상대경로로
      나가고 카카오·슬랙은 절대 URL 만 받는다. 콘솔 경고만 뜨고 조용히 실패한다.
   ⚠️ 카카오는 `description` 이 아니라 **`og:description`** 을 읽는다. 그게 없어서
      「여기를 눌러 링크를 확인하세요」라는 카카오 기본 문구가 나오고 있었다.
   ⚠️ 카카오톡은 썸네일을 오래 캐시한다 — 바꾼 뒤에도 옛 사진이 뜨면
      카카오 개발자 도구의 캐시 초기화가 필요하다. 새 대화방에서는 바로 새 것이 뜬다. */
const DESC =
  "성분표를 봐도 이게 괜찮은 건지 모르겠다면. 식약처에 신고된 원재료 배합 순서와 영양성분을 그대로 놓고 견줍니다.";

export const metadata: Metadata = {
  metadataBase: new URL("https://proteinder-v2.vercel.app"),
  title: "Proteinder - 프로틴더",
  description: DESC,
  openGraph: {
    type: "website",
    siteName: "프로틴더",
    locale: "ko_KR",
    url: "/",
    title: "프로틴더 — 첫눈에 끌려도, 성분은 보고 만나자",
    description: DESC,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "프로틴더" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "프로틴더 — 첫눈에 끌려도, 성분은 보고 만나자",
    description: DESC,
    images: ["/og.png"],
  },
};

/**
 * 셸 — 화해(hwahae.co.kr) 골격을 데스크톱 폭으로 넓힌 것이다.
 *
 *   app2   600px 한 컬럼 · 왼쪽 빈 자리에 앱 설치 안내
 *   app3   1200px 한 컬럼 · 안내를 헤더 안으로
 *
 * 🔴 골격은 그대로다 — 회색 배경 위에 흰 컬럼 하나, 절 사이를 회색 띠로 나눔,
 *    사이드바 없음. 넓힌 것은 폭과 리스트 열 수(2 → 3)뿐이다.
 * 🔴 왼쪽 고정 안내를 지웠다. 600px 컬럼일 때 남던 자리가 1200 에서는 없다 —
 *    2040px 뷰포트가 있어야 뜨는 요소를 남겨 둘 이유가 없어 헤더로 옮겼다.
 */
/* 🔴 헤더 탭은 `components/HeaderNav.tsx` 로 옮겼다 (2026-08-08 · 팀 지시
   「선택한 탭에 밑줄 · 스치면 시그니처색」). 「지금 어디인가」를 알아야 해서
   그 부품만 클라이언트다 — 레이아웃에서 `headers()` 로 경로를 읽으면 **모든 쪽이
   동적 렌더링으로 내려간다** (상세 626쪽 SSG 를 한 번 날렸던 함정).
   목록·「사전이 여기 있어야 하는 이유」·어워드 삭제 기록도 전부 그 파일에 있다. */

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="antialiased">
      <head>
        {/* 자체 호스팅 글꼴 — public/font/ 에 Pretendard v1.3.9 동적 서브셋 92장.
            런타임 외부 요청을 0 으로 두는 것이 시연 안정성의 설계 제약이다.
            ⚠️ 이 CSS 가 선언하는 이름은 「Pretendard Variable」이다 — globals.css 의
               font-family 첫 자리와 문자열이 정확히 같아야 한다. */}
        {/* eslint-disable-next-line @next/next/no-css-tags -- 자체 호스팅 글꼴은 의도된 수동 링크 */}
        <link rel="stylesheet" href="/font/pretendard.css" />
      </head>
      <body className="min-h-screen">
        <div className="mx-auto min-h-screen w-full max-w-[1200px] bg-card">
          <header className="sticky top-0 z-20 bg-card">
            {/* ⚠️ `flex-wrap` — 우측 상자에 장바구니가 늘면서 390px 에서 로그인이
                화면 밖으로 17px 밀려 나갔다. 줄바꿈을 허용하면 좁은 화면에서
                검색이 아랫줄로 내려가고 아무것도 잘리지 않는다.
                검색은 `order-last basis-full` 로 모바일에서만 아랫줄이 된다. */}
            {/* ⚠️ pb-1 → pb-2.5 (2026-08-08 · 팀 지시 「탭이 검색바·로고와 너무 가깝다」).
                탭 쪽 pt-4 와 합쳐 12px → 26px 이 된다 — 헤더 첫 줄과 탭 줄이
                다른 층이라는 것이 여백으로 보여야 한다. */}
            {/* ⚠️ 가로 간격은 좁은 화면에서 한 단 줄인다 (gap-x-3 → sm 부터 6). 모바일은
                검색이 아랫줄(basis-full)이라 이 간격이 **로고와 오른쪽 세 칸 사이**로만
                간다 — 24px 이면 390px 에서 세 칸이 화면 밖으로 밀린다 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pt-4 pb-2.5 sm:gap-x-6">
              <Link
                href="/"
                /* 🔴 마크와 글자 사이 gap-3(12px) → gap-1.5(6px) (2026-08-08 · 팀 지시
                   「너무 멀다 · 붙여 주세요」). 둘이 한 덩어리로 읽혀야 로고다 */
                className="focus-ring flex shrink-0 items-center gap-1.5 rounded"
                aria-label="프로틴더 홈"
              >
                {/* 🔴 심벌 마크 (2026-08-08 · 팀 지시 「로고 옆에 붙여서」).
                    글자 로고는 마스크로 칠한 단색이라 그러데이션이 없다 — 마크가
                    브랜드 색(불꽃 그러데이션)을 실제로 보여 주는 유일한 자리다.
                    ⚠️ 배경이 흰색인 원본이라 원형으로 자른다. 헤더가 흰 바탕이라 티가 안 난다.
                    ⚠️ next/image 를 안 쓴다 — 고정 크기 한 장이라 최적화할 것이 없고,
                       레이아웃은 모든 쪽에 들어가므로 요청을 하나라도 줄인다. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- 위 사유 */}
                <img
                  src="/mark.png"
                  srcSet="/mark.png 1x, /mark@2x.png 2x"
                  alt=""
                  aria-hidden
                  /* 🔴 32px → 38px (팀 지시 「글씨 높이에 맞추거나 좀 크게」).
                     글자 로고가 30px 인데 마크는 원형으로 잘려 안쪽 그림이 더 작게
                     읽혔다 — 파일의 흰 여백도 4%→1.5% 로 줄여 다시 구웠다 */
                  width={38}
                  height={38}
                  className="block size-[38px] shrink-0 rounded-full"
                />
                {/* 🔴 로고를 시그니처 색으로 칠했다 (2026-08-07 밤 · 팀 지시).
                    원본은 검은 글자 투명 PNG 라 색을 못 바꾼다 — **마스크로 쓰고
                    배경색을 얹는다.** 글자 모양은 그대로고 색만 --flame 이 된다.
                    ⚠️ `alt` 를 못 다는 대신 sr-only 로 이름을 남긴다 (마스크는 img 가 아니다).
                    ⚠️ 크기 24px → 30px (팀 지시 「조금 키워서」). */}
                <span
                  role="img"
                  aria-label="프로틴더"
                  className="block h-[30px] w-[118px] bg-flame"
                  style={{
                    WebkitMaskImage: "url(/logo.png)",
                    maskImage: "url(/logo.png)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "left center",
                    maskPosition: "left center",
                  }}
                />
                {/* ❌ 로고 옆 회색 태그라인을 지웠다 (2026-08-07 밤 · 팀 지시).
                    같은 문장이 푸터에 그대로 있어 잃는 것이 없고, 헤더 첫 줄이
                    로고·검색·찜콩 셋으로 정리된다. */}
              </Link>

              {/* 검색 — GET 폼이라 JS 가 없다.
                  ⚠️ 폭 520 → 720 (팀 지시 「검색바는 좀 길게」). 헤더가 1200px 이고
                     로고·찜콩이 양끝을 잡고 있어 가운데가 그만큼 비어 있었다. */}
              <form action="/search" className="order-last min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-0">
                <div className="mx-auto flex max-w-[720px] items-center gap-2 rounded-[8px] bg-track px-4 py-2.5">
                  <input
                    type="search"
                    name="q"
                    placeholder="궁금한 제품을 검색해 보세요"
                    aria-label="제품 검색"
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-dim"
                  />
                  <button type="submit" aria-label="검색" className="focus-ring shrink-0 rounded text-ink-sub">
                    <Icon name="search" size={18} />
                  </button>
                </div>
              </form>
            </div>

            {/* 🔴 탭 줄과 찜콩·장바구니·로그인이 **같은 줄**이다 (2026-08-08 · 팀 지시
                「검색바가 아니라 헤더 탭과 같은 라인으로」). 윗줄은 로고·검색 둘만
                남아 검색바가 헤더 가운데를 그대로 쓴다.

                ⚠️ **`items-end` 여야 한다.** 탭 밑줄은 `.tab::after` 가 링크 제 바닥에
                   그린다 — 가운데 정렬로 두면 줄이 세 칸 높이만큼 커지면서 밑줄이
                   경계선에서 떠 공중에 뜬다. 바닥을 맞춰야 밑줄이 경계선 위에 앉는다.
                ⚠️ 세 칸은 `pb` 로 살짝 띄운다. 바닥에 붙이면 라벨이 경계선에 닿는다.

                탭 목록·밑줄·hover 는 HeaderNav 안에 있다 — 「지금 어디인가」를 알아야
                해서 그 부품만 클라이언트다 (HeaderNav 주석의 SSG 함정 참조).
                ⚠️ 탭이 여섯이라 좁은 화면에서 넘친다 — `rail`(가로 스크롤)은 그 안에 있다. */}
            <div className="flex items-end gap-4 border-b border-line px-5 pt-4">
              <HeaderNav />
              <HeaderActions />
            </div>
          </header>

          <main>{children}</main>

          <footer className="mt-3 border-t border-line px-5 py-9 text-center">
            {/* 팀명은 발표자료 표지와 같은 글자여야 한다 (2026-08-08 · 팀 지시) */}
            <p className="text-[13px] font-semibold text-ink">Team 긴박한 김박한</p>
            <p className="mt-1 text-[12px] text-ink-dim">김동훈 · 박수현 · 한서영</p>
            <p className="mt-4 text-[12px] text-ink-dim">식약처 공공데이터 기반</p>
            <p className="kr mx-auto mt-4 max-w-[520px] text-[11.5px] leading-[1.7] text-ink-dim">
              원재료 순번은 신고된 배합 순서이며 함량 비율은 공개되지 않습니다. 이 서비스는
              식품의 안전성·효능을 평가하지 않으며, 목록의 순서는 수록 제품 안에서의 위치입니다.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
