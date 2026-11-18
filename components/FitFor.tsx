import type { Product } from "@/lib/data";
import { fitReasonsOf, type FitItem } from "@/lib/fit";

/**
 * 이 제품을 고르는 이유 — 두 열. 순수 서버 렌더링.
 *
 * 🔴 **항목이 없는 열은 아예 안 그린다.** 「없음」이라고 적지도 않는다 —
 *    한쪽만 있는 것이 그 제품에 대한 정직한 진술이다.
 * ⚠️ 왼쪽 열에만 연한 색을 준다. 오른쪽을 빨갛게 칠하면 「나쁜 제품」이 되어
 *    조건부 진술이 판정으로 뒤집힌다 (원칙 7) — 오른쪽은 회색 바탕이다.
 */
export default function FitFor({ p }: { p: Product }) {
  const fit = fitReasonsOf(p);
  if (!fit) return null;

  const cols = [
    { key: "yes", title: "이런 분께 맞습니다", items: fit.yes, tone: true },
    { key: "no", title: "이런 분께는 아닐 수 있습니다", items: fit.no, tone: false },
  ].filter((c) => c.items.length > 0);

  return (
    <section id="sec-fit" className="card rounded-2xl p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-[27px] text-title">
          이 제품을 고르는 이유
        </h2>
        <span className="text-[12px] text-muted">{p.packLabel} 기준</span>
      </div>

      <div className={`grid gap-3 ${cols.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {cols.map((c) => (
          /* 🔴 **두 열은 등급 사다리의 양 끝을 빌려 쓴다** (2026-08-08 · 팀 지시
             「색깔 구분이 구려졌다」). 한 번 회색 강도로만 갈랐다가 되돌린 자리다 —
             두 열이 나란히 서는 구조라 진하기 차이만으로는 어느 쪽이 어느 쪽인지
             한눈에 안 갈렸다.

             맞습니다 → 파랑(--grade-*)   · 등급 A 와 같은 색 = 위쪽
             아닐 수 → 주황(--caution-*) · 등급 C 와 같은 색 = 아래쪽

             ⚠️ **아닐 수 있습니다에 빨강을 쓰지 않는다.** 빨강은 D 등급과 경고
                (「목록에 없습니다」)가 독점한다 — 「이 사람에겐 안 맞을 수 있다」는
                경고가 아니라 위치 진술이다 (원칙 7).
             ⚠️ 분홍을 쓰지 않는다. 이 카드는 누르는 것이 아니다. */
          <div
            key={c.key}
            className={`rounded-xl border p-4 ${
              c.tone ? "border-grade-wash bg-grade-wash/40" : "border-caution bg-caution/40"
            }`}
          >
            <h3
              className={`flex items-center gap-2 text-[13.5px] font-bold ${
                c.tone ? "text-grade-ink" : "text-caution-ink"
              }`}
            >
              <span
                aria-hidden
                className={`size-[7px] shrink-0 rounded-full ${
                  c.tone ? "bg-grade-strong" : "bg-caution-ink"
                }`}
              />
              {c.title}
            </h3>
            <ul className="mt-3">
              {c.items.map((it: FitItem) => (
                <li key={it.key} className="mt-3 first:mt-0">
                  <b className="block text-[13px] font-bold text-title">{it.cond}</b>
                  <span className="kr mt-0.5 block text-[12.5px] leading-[1.6] text-body-soft tabular-nums">
                    {it.why}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ❌ 각주 「어느 쪽이 좋은 제품이라고 적지 않습니다 …」를 지웠다 (2026-08-08 · 팀 지시).
          ⚠️ 두 칸(「이런 분께 맞습니다 / 아닐 수 있습니다」)의 제목이 이미 같은 말을
             하고 있다 — 판정이 아니라 「무엇을 우선하는 사람에게」라는 조건부 진술이다. */}
    </section>
  );
}
