/**
 * 조사(助詞) 고르기.
 *
 * 🔴 원료 이름·제품명이 전부 데이터에서 온다. 「은(는)」·「이(가)」로 얼버무리면
 *    화면에 그대로 나온다 — 실제로 `제품명이 내세운 산양유은(는)` 이 떴다.
 *
 * ⚠️ 한글이 아니면 조사를 붙이지 않는다. 수록 원재료에 `L-카르니틴`·`D-소르비톨`
 *    처럼 로마자로 끝나는 이름은 없지만 제품명에는 `WPI`·`BCAA` 가 있다.
 *    틀린 조사를 붙이느니 안 붙이는 편이 낫다.
 */
function batchim(word: string): boolean | null {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 !== 0;
}

function pick(word: string, withBatchim: string, without: string): string {
  const b = batchim(word);
  return b === null ? "" : b ? withBatchim : without;
}

/** 은/는 */
export const topic = (w: string) => pick(w, "은", "는");
/** 이/가 */
export const subject = (w: string) => pick(w, "이", "가");
/** 을/를 */
export const object = (w: string) => pick(w, "을", "를");
/** 와/과 — 앞말에 받침이 있으면 「과」 */
export const conj = (w: string) => pick(w, "과", "와");
/**
 * 이에요/예요 — 쪽지의 해요체 서술어 (2026-08-08).
 * ⚠️ 한글이 아니면 빈 문자열이라 문장이 끊긴다. 부르는 쪽에서 `|| "입니다"` 로 받는다
 *    (`WPI` 같은 로마자 원료 이름이 배합 1순위에 올 수 있다).
 */
export const copula = (w: string) => pick(w, "이에요", "예요");
