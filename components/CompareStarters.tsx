import Link from "next/link";

/**
 * 비교 탭의 빈 화면 — 「무엇부터 해야 하는지」를 화면이 말한다 (2026-08-08 · 팀 지시).
 *
 * 🔴 **지어낸 추천이 아니다.** 카테고리 랭킹 상위 셋을 그대로 담는다 —
 *    「많이 찾는 순」이라는 사실 진술이지 「이걸 비교하세요」가 아니다.
 * ⚠️ 표본이 셋도 안 되는 카테고리는 세트를 만들지 않는다 (부르는 쪽에서 걸러 온다).
 */
export type StarterSet = {
  key: string;
  label: string;
  serving: string;
  items: { id: string; name: string; img: string | null }[];
};

export default function CompareStarters({ sets }: { sets: StarterSet[] }) {
  if (sets.length === 0) return null;
  return (
    <>
      <p className="text-[13px] font-semibold text-body">
        바로 시작하기 — 카테고리별 상위 세 개를 그대로 담습니다
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((s) => (
          <Link
            key={s.key}
            href={`/compare?ids=${s.items.map((i) => i.id).join(",")}`}
            className="focus-ring card block rounded-2xl p-4 transition-colors hover:border-brand-strong"
          >
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-[14px] font-bold text-title">{s.label}</span>
              <span className="text-[11px] text-faint">{s.serving} 기준</span>
            </p>
            <div className="mt-3 flex gap-2">
              {s.items.map((i) => (
                <span
                  key={i.id}
                  className="block size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white"
                >
                  {i.img && (
                    // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
                    <img src={i.img} alt="" className="size-full object-contain" />
                  )}
                </span>
              ))}
            </div>
            <p className="kr mt-2 line-clamp-2 text-[12px] leading-[17px] text-ink-dim">
              {s.items.map((i) => i.name).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
