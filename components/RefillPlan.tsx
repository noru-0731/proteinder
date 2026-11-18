"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import {
  fmtDate,
  planOf,
  readRefills,
  removeRefill,
  saveRefill,
  servingsPerPack,
  todayStr,
} from "@/lib/refill";

/**
 * 「언제 다시 사야 하나」 — 심사위원 피드백에 대한 답 (2026-08-08).
 *
 * 🔴 지적: **구매를 쿠팡으로 넘기면 고객을 붙잡을 게 없다.**
 *    결제를 가져오는 건 물류·정산 싸움이라 우리가 이길 자리가 아니다. 대신
 *    **다시 올 날짜를 우리가 안다.** 쿠팡은 1회 섭취량을 모르므로 이 계산을 못 한다.
 *
 * 🔴 저장하면 찜콩 목록에서 「D-3 곧 떨어져요」로 뜬다 — 그게 재방문 훅이다.
 * ⚠️ 낱개 판매(RTD·바·요거트)는 1통 = 1회분이라 **몇 개 샀는지**를 받아야 한다.
 *    파우더는 통 하나로 계산되므로 개수 칸을 안 띄운다.
 * ⚠️ 회분을 못 세는 57건(9%)에는 이 카드를 아예 안 그린다 — 지어내지 않는다.
 */
export default function RefillPlan({ p }: { p: Product }) {
  const perPack = servingsPerPack(p);
  const single = perPack === 1;

  const [packs, setPacks] = useState(single ? 12 : 1);
  const [perDay, setPerDay] = useState(1);
  const [boughtAt, setBoughtAt] = useState(todayStr());
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 마운트 뒤 복원 — 서버에는 localStorage 가 없어 첫 렌더는 기본값이어야 한다
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 사유
    setReady(true);
    const mine = readRefills().find((x) => x.id === p.id);
    if (!mine) return;
    setPacks(mine.packs);
    setPerDay(mine.perDay);
    setBoughtAt(mine.boughtAt);
    setSaved(true);
  }, [p.id]);

  if (perPack == null) return null;

  const plan = planOf(perPack, packs, perDay, boughtAt);

  return (
    <section className="card mt-6 rounded-2xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[18px] font-bold leading-[27px] text-title">언제 다시 사야 하나</h2>
        <span className="text-[12px] font-medium text-faint">
          {single ? "낱개 기준" : `한 통 ${perPack}회분`}
        </span>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-[19px] text-muted">
        신고 총용량을 {p.packLabel} 로 나눈 값입니다. 이 서비스가 1회 섭취량을 갖고 있어서
        계산되는 값이라, 쇼핑몰 상세페이지에는 없습니다.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className="text-[12.5px] font-semibold text-body">
          산 날
          <input
            type="date"
            value={boughtAt}
            onChange={(e) => {
              setBoughtAt(e.target.value);
              setSaved(false);
            }}
            className="focus-ring mt-1 block rounded-md border border-line-hover px-2.5 py-1.5 text-[13.5px] font-normal text-title"
          />
        </label>

        {/* 낱개 판매만 개수를 받는다 — 파우더는 통 하나로 계산이 끝난다 */}
        {single && (
          <label className="text-[12.5px] font-semibold text-body">
            몇 개 샀나요
            <span className="mt-1 flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={30}
                value={packs}
                onChange={(e) => {
                  setPacks(Number(e.target.value));
                  setSaved(false);
                }}
                className="w-32 accent-brand-strong"
              />
              <span className="w-10 text-[15px] font-bold tabular-nums text-title">{packs}개</span>
            </span>
          </label>
        )}

        <label className="text-[12.5px] font-semibold text-body">
          하루 몇 번
          <span className="mt-1 flex gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setPerDay(n);
                  setSaved(false);
                }}
                className={`focus-ring rounded-md px-3 py-1.5 text-[13.5px] font-semibold transition-colors ${
                  perDay === n
                    ? "bg-brand-strong text-on-brand"
                    : "border border-line-hover text-body hover:border-brand-strong"
                }`}
              >
                {n}번
              </button>
            ))}
          </span>
        </label>
      </div>

      {plan && (
        <p className="mt-4 rounded-lg border-l-[3px] border-brand bg-thumb px-3.5 py-3 text-[13.5px] leading-[21px] text-body">
          모두 <b className="font-bold tabular-nums">{plan.servings.toLocaleString()}회분</b>이고,
          하루 {perDay}번이면 <b className="font-bold tabular-nums">{plan.days}일</b>입니다 —{" "}
          <b className="font-bold text-brand-ink">{fmtDate(plan.until)}쯤</b> 떨어집니다.
          {ready && plan.left >= 0 && plan.left <= 400 && (
            <>
              {" "}
              오늘 기준 <b className="font-bold tabular-nums">{plan.left}일</b> 남았습니다.
            </>
          )}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (saved) {
              removeRefill(p.id);
              setSaved(false);
              return;
            }
            saveRefill({
              id: p.id,
              name: p.name,
              img: p.img ?? null,
              perPack,
              packs,
              perDay,
              boughtAt,
            });
            setSaved(true);
          }}
          className={`focus-ring rounded-md px-3.5 py-2 text-[13px] font-semibold transition-colors ${
            saved
              ? "border border-line-hover text-body hover:border-brand-strong"
              : "bg-brand-strong text-on-brand hover:bg-brand-deep"
          }`}
        >
          {saved ? "기록 지우기" : "내 기록에 담기"}
        </button>
        <span className="text-[11.5px] text-faint">
          {saved
            ? "찜콩 목록에서 남은 날을 확인할 수 있습니다."
            : "담아 두면 찜콩 목록에서 남은 날이 보입니다. 이 브라우저에만 저장됩니다."}
        </span>
      </div>
    </section>
  );
}
