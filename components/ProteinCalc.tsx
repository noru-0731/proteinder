"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

/**
 * 단백질 계산기 — 체중 × 상황 4종을 공통 눈금의 범위 바로 보여준다 (2026-08-07 개편 · 팀 요청).
 *
 * 🔴 구간은 지어낸 값이 아니다 (원칙 1·2) — 넷 다 원출처를 1건씩 대조했다 (2026-08-07).
 *      일반(비운동)  0.91 g/kg    보건복지부·한국영양학회 「한국인 영양소 섭취기준(2025)」
 *
 * ⚠️ 연도를 2020 → **2025** 로 고쳤다 (2026-08-08 · 팀 확인). 값(0.91)은 그대로다 —
 *    같은 값의 출처가 `/faq` 에서는 2025, 여기서는 2020 으로 갈려 있었다.
 * ⚠️ 여기 쓰는 0.91 은 **권장섭취량**이다. 2025 기준의 평균필요량은 0.73 이지만,
 *    평균필요량은 「절반이 모자라는 선」이라 개인이 볼 참고값이 아니다 — `/faq` 는
 *    둘을 나란히 적고, 계산기는 권장섭취량만 쓴다.
 *      운동함        1.4~2.0      ISSN(2017) 포지션 스탠드
 *      근비대 목표    1.62~2.2     Morton 외(2018, BJSM 52:376) — "beyond 1.62 g/kg/day
 *                                 no further RET-induced gains", 95% CI 상한 2.20
 *      65세 이상     1.0~1.2      PROT-AGE(Bauer 외 2013, JAMDA 14:542) — "at least in
 *                                 the range of 1.0 to 1.2 g protein per kg"
 *    ⚠️ 「운동 적당히/많이」의 빈도 분할(1.4~1.6 등)은 출처가 없어 쓰지 않는다.
 *    ⚠️ PROT-AGE 의 1.2~1.5 는 질환 동반 노인용이다. 건강 노인 칸에 옮겨 적으면 틀린다.
 *    ⚠️ 안전 상한·신장질환(CKD) 구간은 의료 판단의 영역이라 싣지 않는다 (원칙 6·7).
 * 🔴 화면에 적는 g 은 범위가 아니라 값 하나다 (2026-08-07 · 「딱 그만큼이 아니라
 *    저쯤 먹으면 좋다」는 팀 피드백 — 98~140g 처럼 적으면 범위 자체를 외우게 된다).
 *    대표값(rep)은 지어낸 수치가 아니다 —
 *      운동함 1.7      = ISSN 공표 구간 1.4~2.0 의 산술 가운데
 *      근비대 1.62     = Morton 외가 「이 위로는 추가 이득 없음」이라 못박은 그 값
 *      65세 이상 1.1   = PROT-AGE 공표 구간 1.0~1.2 의 산술 가운데
 *    구간 자체는 범위 바가 계속 그린다 — 숫자만 하나로 줄인 것이지 구간을 감춘 게 아니다.
 * 🔴 화면 표기는 g 정수 반올림까지만 — 「이 정도 먹어야
 *    하는구나」 감을 주는 참고 계산이지 처방이 아니다. 유도 방식은 각주에 그대로 적는다.
 *
 * 체중·상황은 localStorage 에만 저장한다 (서버 전송 0 · 시연 안정성 그대로).
 * JS 가 죽어도 기본값(70kg · 일반)의 4행과 문장은 서버 렌더링으로 이미 떠 있다.
 */
const SITS = [
  { key: "general", label: "일반 (비운동)", lo: 0.91, hi: 0.91, rep: 0.91 },
  { key: "active", label: "운동함", lo: 1.4, hi: 2.0, rep: 1.7 },
  { key: "bulk", label: "근비대 목표", lo: 1.62, hi: 2.2, rep: 1.62 },
  { key: "senior", label: "65세 이상", lo: 1.0, hi: 1.2, rep: 1.1 },
] as const;
type SitKey = (typeof SITS)[number]["key"];

const W_KEY = "ptd.calc.w";
const SIT_KEY = "ptd.calc.sit";

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 사파리 사생활 보호 모드 등 — 저장만 포기하고 계산은 그대로 */
  }
}

export default function ProteinCalc({
  protPack,
  packLabel,
}: {
  /** 1회 섭취량(1병·1회분 30g)당 단백질 g. 없으면 제품 연결 줄을 뺀다 */
  protPack: number | null;
  packLabel: string;
}) {
  const [w, setW] = useState(70);
  const [sit, setSit] = useState<SitKey>("general");

  // 저장된 값 복원 — 첫 렌더는 70kg·일반(서버와 동일)로 그리고, 붙은 뒤 갈아 끼운다.
  // 마운트 1회의 localStorage 복원이라 연쇄 렌더 걱정이 없는 자리다 — 규칙만 억제한다
  useEffect(() => {
    try {
      const savedW = Number(localStorage.getItem(W_KEY));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedW >= 40 && savedW <= 120) setW(savedW);
      const savedSit = localStorage.getItem(SIT_KEY);
      if (SITS.some((s) => s.key === savedSit)) setSit(savedSit as SitKey);
    } catch {
      /* 복원 실패 = 기본값 유지 */
    }
  }, []);

  // 공통 눈금 — 가장 넓은 구간(근비대 2.2)이 끝에 닿지 않게 4% 여유
  const scaleMax = w * 2.2 * 1.04;
  const pct = (g: number) => Math.min(100, (g / scaleMax) * 100);

  const cur = SITS.find((s) => s.key === sit)!;
  const curRep = Math.round(w * cur.rep);
  const prot = protPack != null ? Math.round(protPack) : null;

  return (
    /* 🔴 카드째 접는다 (2026-08-07 · 팀 결정 2안). 모바일 390px 에서 526px 로
       문서의 14% 를 먹는데, 이 화면에 온 사람이 늘 찾는 것은 아니다.
       ⚠️ 카드 단위 접기라 MoreDetail 을 안 쓴다 — 제목이 h2 로 남아야 하고
          (접혀 있어도 「단백질 계산기」가 카드 제목으로 읽혀야 한다) MoreDetail 의
          summary 는 작은 보조 글자다. 화살표 회전은 같은 .more 규칙을 쓴다.
       ⚠️ details 가 닫혀 있어도 안의 내용은 DOM 에 있다 — 클라이언트 컴포넌트라
          마운트되고 localStorage 체중 복원도 그대로 돈다. */
    <details className="more card rounded-2xl p-6">
      <summary className="focus-ring flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md">
        <h2 className="flex items-center gap-2 text-[18px] font-bold leading-[27px] text-title">
          <Icon name="chevron-right" size={12} className="more-chevron size-3 text-ink-dim" />
          단백질 계산기
        </h2>
        <span className="text-[12px] font-medium text-faint">
          내 체중 기준 하루 참고량 · 개인 처방 아님
        </span>
      </summary>

      {/* 체중 다이얼 — 마지막 값은 이 브라우저에 저장돼 다음에도 유지된다 */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-semibold text-body">내 체중</span>
          <span className="text-[20px] font-bold tabular-nums text-title">
            {w}
            <span className="text-[12px] font-medium text-muted"> kg</span>
          </span>
        </div>
        <input
          type="range"
          min={40}
          max={120}
          step={1}
          value={w}
          onChange={(e) => {
            const next = Number(e.currentTarget.value);
            setW(next);
            remember(W_KEY, String(next));
          }}
          aria-label="체중 (킬로그램)"
          className="mt-2 w-full accent-brand"
        />
        <div
          aria-hidden="true"
          className="mt-0.5 flex justify-between text-[10.5px] tabular-nums text-faint"
        >
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
          <span>120</span>
        </div>
      </div>

      {/* 상황 4행 — 같은 눈금 위의 범위 바. 행을 누르면 아래 문장이 그 기준으로 바뀐다 */}
      <div
        role="radiogroup"
        aria-label="상황 선택"
        className="mt-4 flex flex-col gap-2.5 border-t border-line pt-3.5"
      >
        {SITS.map((s) => {
          const on = s.key === sit;
          const lo = Math.round(w * s.lo);
          const hi = Math.round(w * s.hi);
          const rep = Math.round(w * s.rep);
          const isPoint = s.lo === s.hi;
          return (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setSit(s.key);
                remember(SIT_KEY, s.key);
              }}
              className="group text-left"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-[12.5px] leading-[18px] ${
                    on ? "font-bold text-ink" : "font-medium text-muted group-hover:text-body"
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`text-[12.5px] tabular-nums ${
                    on ? "font-bold text-title" : "font-medium text-faint"
                  }`}
                >
                  {/* 숫자는 대표값 하나 — 「저쯤」이라는 참고선이지 처방량이 아니다.
                      출처 구간은 아래 범위 바가 그대로 그린다 */}
                  약 {rep}g
                  <span className="text-[10.5px] font-medium text-faint">/일</span>
                </span>
              </div>
              <div className="relative mt-1 h-2 rounded-full bg-line/45">
                {isPoint ? (
                  /* 일반(0.91)은 구간이 아니라 점 — 없는 구간을 만들어 그리지 않는다 */
                  <span
                    className={`absolute inset-y-0 w-[3px] rounded-full ${
                      on ? "bg-ink" : "bg-line-hover"
                    }`}
                    style={{ left: `${pct(lo)}%` }}
                  />
                ) : (
                  <span
                    className={`absolute inset-y-0 rounded-full ${
                      on ? "bg-ink" : "bg-line-hover"
                    }`}
                    style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
                  />
                )}
                {/* 대표값 눈금 — 구간 안 어디를 「약 N g」이라 읽었는지 바에도 표시 */}
                {!isPoint && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 w-[2px] bg-white/80"
                    style={{ left: `${pct(rep)}%` }}
                  />
                )}
                {/* 이 제품 마커 — 가는 세로선(2px)은 안 보인다는 지적을 받아
                    흰 테를 두른 점으로 바꿨다. 회색 바탕·파란 바 어디서나 뜬다 */}
                {prot != null && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-title shadow-sm"
                    style={{ left: `${pct(prot)}%` }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {prot != null && (
        <p className="mt-2 text-[11px] leading-4 text-faint">
          <span
            aria-hidden="true"
            className="mr-1 inline-block size-2 rounded-full border border-white bg-title align-[-1px]"
          />
          = 이 제품 {packLabel}의 단백질 {prot}g 위치
        </p>
      )}

      {/* 제품과 잇는 줄 — 계산기가 이 화면에 있는 이유다 */}
      {prot != null && (
        <p className="mt-3 break-keep rounded-[10px] bg-bg px-3.5 py-2.5 text-[12.5px] leading-[19px] text-ink-sub">
          {cur.label} 기준 하루 약{" "}
          <b className="font-bold tabular-nums">{curRep}g</b>
          {" — "}이 제품 {packLabel}의 단백질 <b className="font-bold">{prot}g</b>은 그중 약{" "}
          <b className="font-bold">{Math.round((prot / curRep) * 100)}%</b>입니다.
        </p>
      )}

      <p className="mt-3 text-[11px] leading-4 text-faint">
        한국인 영양소 섭취기준(2025) 0.91 · ISSN(2017) 1.4~2.0 · Morton 외(2018) 1.62~2.2 ·
        PROT-AGE(2013) 1.0~1.2 g/kg 를 체중에 곱한 참고 계산입니다. 「약 N g」은 구간의
        가운데 값(근비대는 추가 이득이 멈추는 1.62)으로, 딱 맞출 양이 아니라 참고선입니다.
      </p>
    </details>
  );
}
