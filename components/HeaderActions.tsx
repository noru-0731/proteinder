"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { LIKES_EVENT, readLikes } from "@/lib/likes";
import { CART_EVENT, readCart } from "@/lib/cart";
import { DM_EVENT, readDm, unreadCount } from "@/lib/dm";
import { AUTH_EVENT, authEnabled, readSession, type Session } from "@/lib/auth";

/**
 * 헤더 오른쪽 세 칸 — 찜콩 · 장바구니 · 로그인.
 *
 * 🔴 **테두리 상자를 걷어냈다** (2026-08-08 · 팀 지시 「너무 이질적이다」).
 *    전에는 `border` + `divide-x` 로 셋을 묶은 분절 상자였는데, 이 앱 어디에도
 *    그런 물건이 없다 — 이 화면의 어휘는 **알약(rounded-full 테두리) · 탭(밑줄) ·
 *    카드(흰 면)** 셋뿐이고, 분절 상자는 OS 툴바에서 온 넷째 어휘였다.
 *    바로 옆 검색바가 **테두리 없는 채움 상자**라 「테두리 있는 상자 ↔ 채움 상자」가
 *    나란히 놓인 것도 이질감의 절반이었다. 헤더에서 상자는 검색바 하나면 된다.
 *
 * 🔴 대신 **아이콘 위 · 11px 라벨 아래**로 세웠다. 이 앱은 장바구니·주문·리뷰가
 *    붙으며 쇼핑몰 골격이 됐고, 그 골격의 헤더 오른쪽은 어디나 이 모양이다 —
 *    새로 지어낸 형식이 아니라 이 도메인의 통용 형식이라 「이 화면 것」으로 읽힌다.
 *
 * 🔴 클라이언트 섬 셋(LikesBadge·CartBadge·AuthBadge)을 **하나로 합쳤다.**
 *    셋 다 「마운트 뒤 localStorage 를 읽는다」는 같은 일을 하고 있었고, 모양이
 *    갈라진 것도 파일이 셋이라 각자 여백을 갖고 있었기 때문이다.
 *
 * ⚠️ 첫 렌더는 서버와 같아야 한다 — 개수 배지 없이, 로그아웃 상태로 그린다.
 *    마운트 뒤에 채운다. 하이드레이션이 어긋나지 않고 JS 가 죽어도 링크는 동작한다.
 * ⚠️ 로그인 뒤에는 라벨이 아이디가 되고 **로그아웃 버튼은 헤더에서 뺐다** —
 *    /login 이 로그인돼 있으면 「홈으로 · 로그아웃」을 그린다. 헤더 한 칸이
 *    로그인 여부에 따라 두 칸이 되던 것이 줄 높이를 흔들던 자리다.
 */
export default function HeaderActions() {
  const [likes, setLikes] = useState(0);
  const [cart, setCart] = useState(0);
  const [dm, setDm] = useState(0);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sync = () => {
      setLikes(readLikes().length);
      setCart(readCart().reduce((s, l) => s + l.qty, 0));
      setDm(unreadCount(readDm()));
      setSession(readSession());
    };
    sync();
    /* 다른 탭에서 바꾼 것(storage)까지 같은 손으로 받는다 */
    const events = [LIKES_EVENT, CART_EVENT, DM_EVENT, AUTH_EVENT, "storage"];
    events.forEach((e) => window.addEventListener(e, sync));
    return () => events.forEach((e) => window.removeEventListener(e, sync));
  }, []);

  return (
    /* 🔴 `pb-2` — 이 줄의 바닥은 헤더 경계선이다 (2026-08-08 · 탭 줄로 내려온 뒤).
       바닥에 붙이면 라벨이 선에 닿는다. 10px 띄우면 세 칸의 시각 중심이
       탭 글자 중심과 거의 맞는다 (실측 23px vs 24.5px). */
    <div className="ml-auto flex shrink-0 items-center gap-0.5 pb-2 sm:gap-1">
      {/* 🔴 쪽지 (2026-08-08 · 팀 지시 「틴더 정체성」) — 열어 본 제품이 보낸 대화.
          찜콩 왼쪽이다. 찜콩·장바구니는 **내가 담는 것**이고 쪽지는 **오는 것**이라,
          오는 쪽이 앞에 서야 배지가 켜졌을 때 먼저 눈에 들어온다. */}
      <Action href="/messages" icon="message" label="쪽지" name="쪽지" n={dm} />
      <Action href="/likes" icon="heart" label="찜콩" name="찜콩" n={likes} />
      <Action href="/cart" icon="shopping-bag" label="장바구니" name="장바구니" n={cart} />
      {authEnabled && (
        <Action
          href="/login"
          icon="user"
          label={session?.id ?? "로그인"}
          name={session ? `${session.id} 님 · 내 계정` : "로그인"}
          on={Boolean(session)}
        />
      )}
    </div>
  );
}

function Action({
  href,
  icon,
  label,
  name,
  n = 0,
  on = false,
}: {
  href: string;
  icon: IconName;
  /** 아이콘 밑에 적히는 말. 로그인 뒤에는 아이디가 온다 */
  label: string;
  /** 스크린리더가 읽는 말 — 개수와 상태까지 문장으로 */
  name: string;
  n?: number;
  on?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={n > 0 ? `${name} ${n}개` : name}
      /* 🔴 **아이콘 위·라벨 아래(세로)에서 한 줄(가로)로 눕혔다** (2026-08-08 ·
         탭 줄로 내려오면서). 세로 두 단은 48px 이라 탭 줄(37px)보다 높아
         줄 높이를 이 세 칸이 정하게 된다 — 그러면 탭 밑줄과 경계선 사이가 벌어진다.
         가로로 누우면 26px 이라 줄 높이를 탭이 그대로 정한다.
         ⚠️ 좁은 화면에서는 **라벨을 감춘다**(`sm:` 이상만). 탭이 여섯인데 세 칸이
            라벨까지 달고 서면 390px 에서 탭이 150px 밖에 못 쓴다. 아이콘만 남기면
            280px 이 남는다 — 링크 이름(`aria-label`)은 그대로라 읽히는 말은 안 준다.
         ⚠️ 아이디는 3~20자라 「찜콩」과 같은 칸에 안 들어간다. 넘치면 라벨만 잘린다 */
      className={`focus-ring flex items-center gap-2.5 rounded-[10px] px-1.5 py-1 transition-colors hover:bg-bg sm:px-2 ${
        on ? "text-flame-deep" : "text-ink-sub hover:text-ink"
      }`}
    >
      <span className="relative block">
        <Icon name={icon} size={20} />
        {/* 개수 — 아이콘 어깨의 작은 원. 흰 글자 4.51:1 ✅ (--flame-deep)
            ⚠️ `aria-hidden` — 링크 이름이 이미 「찜콩 3개」라 두 번 읽히면 안 된다
            ⚠️ 오른쪽으로 6px 넘어간다. 라벨과의 간격이 10px 이라 안 겹친다 */}
        {n > 0 && (
          <span
            aria-hidden
            className="absolute -top-2 -right-1.5 min-w-[16px] rounded-full bg-flame-deep px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums"
          >
            {n > 99 ? "99+" : n}
          </span>
        )}
      </span>
      <span className="hidden max-w-[92px] truncate text-[13px] leading-none font-semibold sm:block">
        {label}
      </span>
    </Link>
  );
}
