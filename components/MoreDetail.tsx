
import Icon from "@/components/Icon";/**
 * 「자세히 보기」 접기 — 제품 상세를 반으로 줄이는 장치 (2026-08-07 · 팀 결정 2안).
 *
 * 🔴 **접는 기준이 취향이 아니라 규칙이다 — 신고값은 펼치고, 우리가 만든 해석은 접는다.**
 *    영양 여섯 칸(신고값)과 원재료 배합 순번(신고값)은 늘 펼쳐져 있고,
 *    오각형·종합지수 분포·원료 강단 해설·단백질 계산기는 우리가 얹은 해석이라 접는다.
 *    원칙 5·7 이 화면 구조로 내려온 것이다.
 *
 * 실측 근거 (모바일 390px · 2026-08-07):
 *    접기 전 문서 3,878px = 4.6화면
 *      오각형+분포 514 · 계산기 526 · 원료 해설 ~200
 *    접은 뒤 약 2,600px = 3.1화면
 *
 * 🔴 native `<details>` 다 — **JS 가 0** 이다. 필터·카테고리 시트와 같은 방식이고,
 *    시연 중 하이드레이션을 기다리지 않는다. 검색엔진도 접힌 내용을 읽는다.
 *
 * ⚠️ **접힌 줄이 안을 설명해야 한다.** 옛 앱에서 「원료 · 전체」라고만 적힌 필터가
 *    안에 WPI·ISP·산양유가 있는 걸 못 알려 준다는 지적을 받았고 그건 아직 미해결이다.
 *    같은 실수를 반복하지 않으려고 `hint` 를 오른쪽에 **필수로** 적는다 —
 *    접혀 있어도 무엇이 들었는지는 읽힌다.
 */
export default function MoreDetail({
  label,
  hint,
  children,
  className = "",
}: {
  /** 여는 줄 왼쪽. 「성분 밸런스」처럼 무엇의 자세히 보기인지 */
  label: string;
  /** 여는 줄 오른쪽 — 안에 무엇이 들었는지. 비워 두지 말 것 (위 ⚠️) */
  hint: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={`more ${className}`}>
      {/* ⚠️ flex-wrap + kr(break-keep) 이 둘 다 필요하다. 원재료 카드의 이 자리는
          라벨 칸(86px) 옆의 좁은 dd 안이라, 모바일 390px 에서 한 줄에 안 들어가면
          「원료 해설 자 / 세히 보기」로 **낱말 한가운데가 갈렸다** (실측 확인).
          wrap 이 있어야 hint 가 아래로 내려가고, kr 이 있어야 낱말이 안 갈린다. */}
      <summary className="focus-ring flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-md py-1.5">
        <span className="kr flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-sub">
          {/* 열리면 90° 돈다 (globals.css 의 .more[open] 규칙) */}
          {/* shrink-0 — 좁은 칸에서 화살표가 눌려 찌그러지지 않게 */}
          <Icon name="chevron-right" size={12} className="more-chevron size-3" />
          {label} 자세히 보기
        </span>
        <span className="kr text-[11px] text-faint">{hint}</span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
