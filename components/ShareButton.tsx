"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

/**
 * 친구에게 공유 (2026-08-07 · 팀 요청).
 *
 * 🔴 **런타임 외부 요청이 0 이다.** SDK 를 안 붙인다 — 카카오·페이스북 공유 버튼은
 *    각자 스크립트를 불러오고 앱 키를 요구하는데, 이 화면의 설계 제약은
 *    「필수 화면은 외부 요청 0」이다. 브라우저가 이미 갖고 있는 것만 쓴다.
 *
 *    ① navigator.share  — 모바일·최신 데스크톱. 카카오톡·메시지·에어드롭이
 *                         **OS 공유 시트에 그대로 뜬다.** 우리가 채널을 고르지 않는다
 *    ② navigator.clipboard — 없으면 주소 복사로 내려간다
 *    ③ 둘 다 없으면 버튼을 아예 안 그린다 (아래 ready 참조)
 *
 * ⚠️ **`navigator.share` 는 서버에서 못 읽는다.** 서버 렌더링 때 그리고 클라이언트에서
 *    지우면 하이드레이션이 어긋난다 — 그래서 `ready` 가 false 인 첫 렌더에서는
 *    아무것도 안 그리고, 마운트 뒤에 채운다. 찜 배지가 개수를 마운트 후 채우는 것과 같다.
 * ⚠️ **`navigator.share` 는 사용자 제스처 안에서만 된다.** onClick 안에서 바로 부른다 —
 *    await 를 앞에 끼우면 제스처가 끊겨 NotAllowedError 가 난다.
 * ⚠️ 사용자가 공유 시트를 그냥 닫으면 AbortError 가 난다. **오류가 아니다** — 삼킨다.
 */
export default function ShareButton({ name, summary }: { name: string; summary?: string }) {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState<"" | "복사됨" | "실패">("");

  // 마운트 1회 표시. navigator.share 는 서버에 없어 첫 렌더는 반드시 「없음」이어야
  // 하이드레이션이 안 어긋난다 — useState 초기값으로 옮길 수 없는 자리다
  // (Reviews·LikesBadge 와 같은 사유로 억제한다).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 사유
  useEffect(() => setReady(true), []);

  if (!ready) return null;

  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const canCopy = typeof navigator !== "undefined" && !!navigator.clipboard;
  if (!canShare && !canCopy) return null;

  async function onClick() {
    const url = window.location.href;
    // 공유 시트에 뜨는 문구. 성분 판정을 적지 않는다 — 제품명과 한 줄 요약까지다
    const text = summary ? `${name} — ${summary}` : name;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — 프로틴더`, text, url });
        return;
      } catch {
        /* 사용자가 닫았거나(AbortError) 거부됐다. 아래 복사로 내려간다 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone("복사됨");
    } catch {
      setDone("실패");
    }
    setTimeout(() => setDone(""), 2000);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      /* 찜·구매와 같은 줄에 서지만 **이 줄에서 유일하게 테두리 버튼**이다.
         구매(파랑 채움)와 찜(분홍 채움)이 이미 채움이라 셋 다 채우면 무엇을
         눌러야 할지가 사라진다 — 공유는 부차적 행동이다 */
      className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line-hover bg-white px-3.5 py-2 text-[13px] font-semibold text-body transition-colors hover:border-brand-strong hover:text-brand-ink"
    >
      <Icon name="share" size={14} />
      {done || (canShare ? "친구에게 공유" : "주소 복사")}
    </button>
  );
}
