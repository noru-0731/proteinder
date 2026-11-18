"use client";

import { useEffect } from "react";
import { seedDm, type DmSeed as Seed } from "@/lib/dm";

/**
 * 제품 상세에 붙는 **보이지 않는 부품** — 열어 본 제품이 쪽지를 보낸다.
 *
 * 🔴 화면에 아무것도 안 그린다. 하는 일은 하나뿐 — 마운트되면 서버가 지어 준
 *    씨앗을 쪽지함(localStorage)에 넣는다. 그 순간 헤더 「쪽지」에 배지가 켜진다.
 *
 * ⚠️ **문장은 서버가 짓는다** (`dmSeedOf`). 여기서 조립하면 `products.json` 0.5MB 가
 *    클라이언트 번들에 실린다 — 찜콩의 `snapOf` 와 같은 규칙이다.
 * ⚠️ `Date.now()` 는 여기서 부른다. 서버에서 찍으면 SSG 라 **빌드 시각이 박제**되어
 *    모든 대화가 같은 시각이 된다.
 * ⚠️ StrictMode 가 개발에서 두 번 마운트하지만 `seedDm` 이 `key` 로 걸러 안 불어난다.
 */
export default function DmSeed({ seed }: { seed: Seed }) {
  useEffect(() => {
    seedDm(seed, Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed 는 매 렌더 새 객체다. 제품이 바뀔 때만 다시 돈다
  }, [seed.id]);
  return null;
}
