"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
/* ⚠️ 잎 모듈에서 — `@/lib/compare` 는 products.json 을 문다 (lib/format.ts 주석) */
import { MAX_COMPARE } from "@/lib/format";

/**
 * 비교할 제품 고르기 (2026-08-08).
 *
 * 🔴 고른 것은 **주소에 남는다** (`?ids=a,b,c`). 비교 결과를 그대로 공유할 수 있어야
 *    「같이 보자」가 되고, 그게 이 탭이 존재하는 이유의 절반이다.
 * ⚠️ 목록은 서버가 넘겨준다 — 210건 이름만 받아 여기서 걸러 쓴다 (요청 0).
 */
type Item = { id: string; name: string; brand: string | null; cat: string };

export default function ComparePicker({
  all,
  ids,
}: {
  all: Item[];
  ids: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const hits = useMemo(() => {
    const k = q.trim().toLowerCase().replace(/\s/g, "");
    if (!k) return [];
    return all
      .filter((x) => !ids.includes(x.id))
      .filter((x) => `${x.brand ?? ""}${x.name}`.toLowerCase().replace(/\s/g, "").includes(k))
      .slice(0, 8);
  }, [q, all, ids]);

  const go = (next: string[]) =>
    router.push(next.length ? `/compare?ids=${next.join(",")}` : "/compare");

  const full = ids.length >= MAX_COMPARE;

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        disabled={full}
        placeholder={full ? `최대 ${MAX_COMPARE}개까지 견줍니다` : "제품 이름으로 찾아 담기"}
        className="focus-ring w-full rounded-[10px] border border-line-strong bg-card px-4 py-3 text-[14px] text-ink placeholder:text-ink-dim disabled:bg-bg"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-[10px] border border-line-strong bg-card shadow-lg">
          {hits.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setOpen(false);
                  go([...ids, x.id]);
                }}
                className="focus-ring block w-full px-4 py-2.5 text-left text-[13.5px] hover:bg-bg"
              >
                <span className="text-ink-dim">{x.brand ?? x.cat} </span>
                <span className="font-semibold text-ink">{x.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
