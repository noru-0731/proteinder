"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LIKES_EVENT, readLikes } from "@/lib/likes";
/* ⚠️ 잎 모듈에서 — `@/lib/compare` 는 products.json 을 문다 (lib/format.ts 주석) */
import { MAX_COMPARE } from "@/lib/format";

/**
 * 「찜콩에서 가져오기」 — 이 화면에 오기 전에 이미 고른 것들이 있다 (2026-08-08).
 *
 * ⚠️ 찜이 둘 미만이면 버튼을 안 그린다. 하나짜리 비교는 비교가 아니다.
 * ⚠️ 마운트 뒤에 채운다 — 찜은 localStorage 라 서버가 모른다 (찜콩 배지와 같은 규칙).
 */
export default function CompareFromLikes() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(readLikes().map((l) => l.id).slice(0, MAX_COMPARE));
    sync();
    window.addEventListener(LIKES_EVENT, sync);
    return () => window.removeEventListener(LIKES_EVENT, sync);
  }, []);

  if (ids.length < 2) return null;

  return (
    <Link
      href={`/compare?ids=${ids.join(",")}`}
      className="focus-ring shrink-0 rounded-[10px] border border-line-strong px-4 py-3 text-[13.5px] font-semibold text-body transition-colors hover:border-brand-strong hover:text-brand-ink"
    >
      찜콩 {ids.length}개 가져오기
    </Link>
  );
}
