import type { Product } from "./data";
/* ⚠️ `./data` 가 아니라 잎 모듈에서 가져온다 — 하트가 모든 카드에 있어서
   여기서 `./data` 를 부르면 제품 626건이 전 화면 번들에 실린다 (lib/format.ts 주석) */
import { catLabel, formatWhole } from "./format";

/**
 * 찜목록 — 로그인 없이 localStorage 에만 둔다 (2026-08-07 · 팀 승인).
 *
 * 🔴 id 만 저장하지 않고 **카드를 그릴 요약 스냅샷째로** 저장한다.
 *    /likes 화면이 products.json(0.5MB)을 부를 필요가 없어진다 —
 *    런타임 요청 0 이 찜목록 화면까지 이어진다. 사진은 id 에서 경로가 나온다.
 * ⚠️ 스냅샷이라 데이터를 다시 내보내면 수치가 낡을 수 있다. 카드에서 상세로
 *    들어가면 최신 값이라 MVP 범위에서는 두기로 했다.
 * ⚠️ 브라우저별·기기별로 따로다. 시크릿 모드는 창을 닫으면 사라진다.
 *
 * 계산기(ptd.calc.*)와 같은 원칙 — 서버 전송 0 · JS 가 죽어도 화면은 뜬다
 * (하트가 빈 상태로 그려질 뿐이다).
 */
export type LikeSnap = {
  id: string;
  name: string;
  /** 카드 윗줄 — 브랜드 또는 카테고리 라벨 */
  top: string;
  /** 윗줄이 브랜드인가 (브랜드에만 --brand-ink 색을 준다 — 카드와 같은 규칙) */
  topIsBrand: boolean;
  size: string;
  img: string | null;
  /** 「단백질 20g · 150kcal · 당류 4g」 — 찜 시점에 카드와 같은 규칙으로 완성한 문자열 */
  nut: string;
};

const KEY = "ptd.likes";
/** 하트 버튼·헤더 배지·찜목록이 서로를 갱신하는 신호 */
export const LIKES_EVENT = "ptd:likes";

/** 서버 컴포넌트에서 스냅샷을 만들어 클라이언트 버튼에 넘긴다 */
export function snapOf(p: Product): LikeSnap {
  return {
    id: p.id,
    name: p.name,
    top: p.brand || catLabel(p.cat),
    topIsBrand: Boolean(p.brand),
    size: p.size,
    img: p.img,
    // ProductCard 의 영양 줄과 같은 규칙 — 당류 미신고는 「0」이 아니라 「모름」이라 뺀다
    nut:
      p.protPack == null
        ? ""
        : `단백질 ${formatWhole(p.protPack, "g")} · ${formatWhole(p.kcalPack)}kcal` +
          (p.sugarPack != null ? ` · 당류 ${formatWhole(p.sugarPack, "g")}` : ""),
  };
}

export function readLikes(): LikeSnap[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.id === "string") : [];
  } catch {
    return [];
  }
}

function write(likes: LikeSnap[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(likes));
    window.dispatchEvent(new CustomEvent(LIKES_EVENT));
  } catch {
    /* 사파리 사생활 보호 모드 등 — 저장만 포기 */
  }
}

export function isLiked(id: string): boolean {
  return readLikes().some((s) => s.id === id);
}

/** 눌렀을 때 찜/해제를 오간다. 반환값 = 지금 찜된 상태인가 */
export function toggleLike(snap: LikeSnap): boolean {
  const likes = readLikes();
  const without = likes.filter((s) => s.id !== snap.id);
  if (without.length < likes.length) {
    write(without);
    return false;
  }
  write([snap, ...likes]); // 최근 찜이 앞
  return true;
}

export function removeLike(id: string) {
  write(readLikes().filter((s) => s.id !== id));
}
