"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { readOrders } from "@/lib/orders";

/** 한 판에 찍는 칸 수 */
const SLOTS = 10;

/**
 * 스탬프 카드 — 장바구니 아래 (2026-08-08 · 팀 지시).
 *
 * 🔴 **그림 파일이 아니라 화면이 그린다.** 사진으로 넣으면 ① 찍힌 개수가 안 바뀌고
 *    ② 다크·확대에서 흐려지고 ③ 시그니처색을 바꿀 때 같이 안 따라온다.
 *    같은 이유로 오각형·분포 곡선도 SVG 로 그린다 — 이 앱에 이미 있는 방식이다.
 *
 * 🔴 찍힌 개수는 **실제 주문 수**다 (`ptd.orders`). 지어낸 숫자를 보여주지 않는다 —
 *    결제를 한 번 하면 이 화면에 한 칸이 실제로 찍힌다.
 * ⚠️ 열 판을 넘어가면 처음부터 다시 센다 (`% SLOTS`). 11번째 주문에 열한 칸을
 *    그릴 수는 없다.
 * ⚠️ 첫 렌더는 서버와 같아야 하므로 **빈 판**으로 그리고 마운트 뒤에 채운다.
 *    헤더 배지(`HeaderActions`)와 같은 규칙이다.
 */
export default function StampCard() {
  const [n, setN] = useState(0);

  useEffect(() => {
    const sync = () => setN(readOrders().length);
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const done = n % SLOTS === 0 && n > 0 ? SLOTS : n % SLOTS;
  const left = SLOTS - done;

  return (
    <section className="mt-6 rounded-2xl bg-flame-wash px-5 py-6 text-center">
      <p className="text-[17px] font-bold text-ink">결제하면 스탬프를 찍어드려요!</p>

      {/* 5칸 두 줄. 한 줄 열 칸은 넓은 화면에서 판이 아니라 자처럼 보인다 */}
      <ul className="mx-auto mt-5 grid max-w-[360px] grid-cols-5 gap-2.5">
        {Array.from({ length: SLOTS }, (_, i) => {
          const on = i < done;
          return (
            <li
              key={i}
              /* 마지막 칸은 선물 자리 — 비어 있어도 시그니처색 테두리로 표시한다 */
              /* ⚠️ 칸은 64px 이다 (360 − 간격 40 ÷ 5). 안에 든 것을 13px 로 두면
                 큰 원 가운데 점처럼 보인다 — 글자·아이콘을 칸에 맞춰 키운다 */
              className={`grid aspect-square place-items-center rounded-full text-[15px] font-bold tabular-nums ${
                on
                  ? "bg-flame text-white"
                  : i === SLOTS - 1
                    ? "border-2 border-dashed border-flame-bar text-flame-deep"
                    : "border-2 border-dashed border-line-strong text-ink-dim"
              }`}
            >
              {on ? (
                <Icon name="heart" filled size={24} />
              ) : i === SLOTS - 1 ? (
                <Icon name="medal" size={28} />
              ) : (
                i + 1
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-[14px] font-semibold text-flame-deep">
        10개를 모으면 특별한 선물을 드립니다!
      </p>
      <p className="mt-1 text-[12.5px] text-ink-sub tabular-nums">
        {done === 0
          ? `아직 빈 판입니다 · ${SLOTS}칸 남음`
          : left === 0
            ? "열 칸을 다 채웠습니다"
            : `${done}칸 찍었습니다 · ${left}칸 남음`}
      </p>
    </section>
  );
}
