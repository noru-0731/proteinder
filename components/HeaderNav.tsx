"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 헤더 탭 — 지금 어느 탭인지 밑줄로, 스치면 시그니처색이 지나간다
 * (2026-08-08 · 팀 지시).
 *
 * 🔴 **이 화면에서 유일하게 클라이언트여야 하는 이유는 「지금 어디인가」다.**
 *    서버 레이아웃은 경로를 모른다 — App Router 에서 레이아웃이 경로를 알려면
 *    `headers()` 를 읽어야 하는데, 그 순간 **모든 쪽이 동적 렌더링으로 내려간다.**
 *    `?tab=review` 로 상세 626쪽 SSG 를 날렸던 것과 똑같은 함정이라 `usePathname()`
 *    을 쓰는 작은 클라이언트 부품으로 가른다.
 *    ⚠️ 헤더에는 이미 찜콩·장바구니·로그인 배지가 클라이언트다 — 새로 늘어나는
 *       성격의 비용이 아니다. 링크 자체는 JS 가 죽어도 그냥 동작한다.
 *
 * 🔴 밑줄과 hover 는 CSS 가 그린다 (`globals.css` 의 `.tab`). 여기서는 **어느 것이
 *    켜졌는지만** `aria-current` 로 넘긴다 — 스크린리더에도 같은 사실이 간다.
 *
 * ⚠️ 「홈」은 정확히 일치할 때만 켠다. `startsWith("/")` 로 보면 모든 쪽에서 켜진다.
 * ⚠️ 나머지는 하위 경로까지 켠다 — `/ingredients/WPI` 에서도 「사전」이,
 *    `/magazine/water-first` 에서도 「매거진」이 켜져 있어야 한다.
 */
const TABS = [
  { href: "/", label: "홈" },
  { href: "/rank", label: "랭킹" },
  { href: "/compare", label: "비교" },
  { href: "/magazine", label: "매거진" },
  { href: "/ingredients", label: "사전" },
  { href: "/faq", label: "자주 묻는 질문" },
];

export default function HeaderNav() {
  const path = usePathname() ?? "/";

  return (
    /* 🔴 윗줄(로고·검색)과의 간격 12px → 26px · 글자 15.5 → 17px
       (2026-08-08 · 팀 지시 「검색바·로고와 너무 가깝고 작다」).
       탭은 이 앱의 1차 이동 수단이라 헤더 우측 배지(13px)보다 커야 위계가 선다.

       ⚠️ **경계선·좌우 여백·윗여백은 이제 `layout.tsx` 의 바깥 줄이 준다** —
          찜콩·장바구니·로그인이 같은 줄에 서면서(2026-08-08) 경계선이 그 셋
          밑으로도 이어져야 하기 때문이다. 여기 남는 것은 탭 사이 간격뿐이다.
       ⚠️ `min-w-0 flex-1` — 이게 없으면 `rail` 의 가로 스크롤이 안 산다.
          탭이 줄어들 곳이 없어 세 칸을 화면 밖으로 밀어낸다. */
    <nav className="rail rail-fade min-w-0 flex-1 gap-7">
      {TABS.map((t) => {
        const on = t.href === "/" ? path === "/" : path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className="tab focus-ring rounded-t text-[17px] font-semibold whitespace-nowrap"
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
