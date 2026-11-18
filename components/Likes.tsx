"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import Link from "next/link";
import { LIKES_EVENT, type LikeSnap, isLiked, readLikes, removeLike, toggleLike } from "@/lib/likes";
/* ⚠️ 잎 모듈에서 — `@/lib/compare` 는 products.json 을 문다 (lib/format.ts 주석) */
import { MAX_COMPARE } from "@/lib/format";

/**
 * 찜콩 — 이 앱의 유일한 클라이언트 섬 셋이다.
 *
 * 🔴 첫 렌더는 서버와 같아야 한다 — 하트는 꺼진 채, 배지는 숫자 없이 그린다.
 *    마운트 뒤에 localStorage 를 읽어 채운다. 하이드레이션 불일치가 없고,
 *    JS 가 죽어도 화면 자체는 뜬다(하트가 안 켜질 뿐).
 * 🔴 문구는 「찜됨」이 아니라 **「찜콩」**이다 — 팀이 정한 낱말이라 고치지 않는다.
 */

/** 마운트 뒤에 한 번 읽고, 다른 하트가 바꾸면 따라 갱신한다 */
function useLikes<T>(read: () => T, initial: T): T {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    const sync = () => setV(read());
    sync();
    window.addEventListener(LIKES_EVENT, sync);
    /* 다른 탭에서 바꾼 것도 받는다 */
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LIKES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read 는 매 렌더 새 함수라 넣으면 무한 루프다
  }, []);
  return v;
}

export function LikeButton({ snap }: { snap: LikeSnap }) {
  const on = useLikes(() => isLiked(snap.id), false);
  return (
    <button
      type="button"
      onClick={() => toggleLike(snap)}
      aria-pressed={on}
      className={`focus-ring flex items-center gap-1.5 rounded-[8px] border px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
        // 🔴 --red 가 아니라 --flame-deep 이다. 하트는 오류가 아니라 브랜드 행동이고,
        //    옛 #ff5555 는 흰 글자 3.14:1 로 AA 미달이었다 (#eb0052 는 4.51:1).
        on ? "border-flame-deep bg-flame-deep text-white" : "border-line-strong bg-card text-ink-sub"
      }`}
    >
      <Heart filled={on} />
      {on ? "찜콩" : "찜하기"}
    </button>
  );
}

/* ❌ `LikesBadge` 를 여기서 뺐다 (2026-08-08) — 헤더 세 칸이 같은 일(마운트 뒤
   localStorage 읽기)을 파일 셋에 나눠 갖고 있었고, 그래서 모양도 각자 갖고 있었다.
   `components/HeaderActions.tsx` 한 곳으로 합쳤다. 이 파일은 하트 버튼과 목록만 맡는다. */

export function LikesList() {
  /* 🔴 null = 아직 안 읽음. 빈 배열로 시작하면 찜이 있는 사람에게도
     「찜한 제품이 없습니다」가 한 프레임 스쳐 지나간다 */
  const likes = useLikes<LikeSnap[] | null>(() => readLikes(), null);

  if (likes === null)
    return <p className="px-5 py-16 text-center text-[13px] text-ink-dim">불러오는 중입니다</p>;

  if (!likes.length)
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">찜한 제품이 없습니다</p>
        <p className="kr mx-auto mt-2 max-w-[420px] text-[13px] leading-[1.7] text-ink-dim">
          제품 상세에서 하트를 누르면 여기에 모입니다. 이 브라우저에만 저장되고
          서버로는 아무것도 보내지 않습니다.
        </p>
        <Link
          href="/rank"
          className="focus-ring mt-6 inline-block rounded text-[13px] font-semibold text-flame-deep"
        >
          랭킹 보러 가기 ›
        </Link>
      </div>
    );

  return (
    <>
      {/* 🔴 **찜콩에서 비교로 가는 다리** (2026-08-08 · 다나와 실측 반영).
          다나와는 검색 결과 **행마다 비교 체크박스**(실측 161개)를 두고 하단
          `.box__compare` 트레이에 쌓는다 — 「비교는 목적지가 아니라 훑는 중에
          쌓이는 것」이다. 우리는 그 쌓는 자리를 **찜콩이 이미 맡고 있는데**,
          여기서 비교로 나가는 길이 **한 줄도 없었다.** 쌓아 두고 견줄 수가 없었다.
          ⚠️ 트레이를 따로 만들지 않았다. 헤더에 찜콩·장바구니가 이미 있어
             세 번째 계수기가 붙으면 무엇에 담는 건지 모르게 된다 —
             다나와에 찜 기능이 없어서 트레이가 필요했던 것이지 트레이가 답이 아니다.
          ⚠️ 둘 미만이면 안 띄운다. 하나짜리 비교는 비교가 아니다.
          ⚠️ 넷을 넘으면 앞의 넷만 간다 — 표가 최대 4열이라 그렇다고 적어 둔다. */}
      {likes.length >= 2 && (
        <div className="mx-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-bg px-4 py-3">
          <p className="kr text-[12.5px] leading-[1.6] text-ink-sub">
            담긴 {likes.length}개를 한 표에 놓고 같은 자로 견줍니다
            {likes.length > MAX_COMPARE && (
              <span className="text-ink-dim"> (앞의 {MAX_COMPARE}개)</span>
            )}
          </p>
          <Link
            href={`/compare?ids=${likes.slice(0, MAX_COMPARE).map((s) => s.id).join(",")}`}
            className="focus-ring shrink-0 rounded-[8px] bg-flame-deep px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-flame"
          >
            비교하기
          </Link>
        </div>
      )}
      <div className="grid gap-x-6 px-5 pb-8 sm:grid-cols-2 lg:grid-cols-3">
        {likes.map((s) => (
        <div key={s.id} className="flex items-center gap-2.5 border-b border-line py-3">
          <Link href={`/product/${s.id}`} className="focus-ring flex min-w-0 flex-1 gap-2.5 rounded">
            <span className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[6px] border border-line bg-card">
              {s.img && (
                // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
                <img src={s.img} alt="" width={52} height={52} className="h-full w-full object-contain" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[11.5px] ${s.topIsBrand ? "text-flame-deep" : "text-ink-dim"}`}
              >
                {s.top}
              </span>
              <span className="kr clamp-2 block text-[13.5px] leading-[1.35] font-semibold text-ink">
                {s.name}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-dim">{s.nut}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => removeLike(s.id)}
            aria-label={`${s.name} 찜 해제`}
            className="focus-ring shrink-0 rounded p-1.5 text-flame"
          >
            <Heart filled />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return <Icon name="heart" size={16} filled={filled} />;
}
