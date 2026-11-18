import type { Product } from "./data";

/**
 * 재구매 시점 — 「이 통 언제 떨어지나」 (2026-08-08 · 심사위원 피드백).
 *
 * 🔴 **지적: 구매를 쿠팡으로 넘기면 붙잡을 게 없다.**
 *    맞는 지적이고, 답은 결제가 아니라 **재방문 시점을 우리가 아는 것**이다.
 *    쿠팡은 이 계산을 못 한다 — 1회 섭취량(파우더 30g)을 갖고 있지 않기 때문이다.
 *    우리는 packLabel 로 이미 갖고 있고 단백질 계산기가 그 값을 쓴다.
 *
 * 실측 (626건):
 *    회분 계산 가능        569건 (91%)
 *    파우더 281건          중앙 20회분   ← 「이 통이면 20일치」가 실제로 나온다
 *    RTD·바·요거트 등       1회분          ← 낱개라 몇 개 샀는지를 사용자가 정해야 한다
 *
 * ⚠️ 그래서 **파우더는 통 하나로, 나머지는 「몇 개 샀나」를 받아** 계산한다.
 *    「전 제품에서 된다」고 말하면 안 된다.
 */

/** 「500g」·「1.2kg」·「190ml」 → 숫자(ml·g 단위로 통일) */
function amount(text: string | null | undefined): number | null {
  const m = /([\d.]+)\s*(ml|g|kg|l)\b/i.exec(text ?? "");
  if (!m) return null;
  let v = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === "kg" || u === "l") v *= 1000;
  return v > 0 ? v : null;
}

/** 한 통(팩)에 몇 회분이 들었나. 계산 못 하면 null */
export function servingsPerPack(p: Product): number | null {
  const total = amount(p.size);
  const serv = amount(p.packLabel);
  if (!total || !serv || total < serv) return null;
  const n = Math.round(total / serv);
  return n >= 1 ? n : null;
}

/** 낱개로 파는 것(1통 = 1회분)인가 — 이 경우 구매 개수를 받아야 한다 */
export function isSingleServe(p: Product): boolean {
  const n = servingsPerPack(p);
  return n === 1;
}

export type RefillPlan = {
  /** 산 것 전부를 합친 총 회분 */
  servings: number;
  /** 다 먹는 데 걸리는 날 수 */
  days: number;
  /** 소진 예정일 */
  until: Date;
  /** 오늘 기준 남은 날. 음수면 이미 지났다 */
  left: number;
};

/**
 * @param perPack  한 통의 회분 (servingsPerPack)
 * @param packs    몇 통(개) 샀나
 * @param perDay   하루 몇 번 먹나
 * @param boughtAt 산 날 (YYYY-MM-DD)
 */
export function planOf(
  perPack: number,
  packs: number,
  perDay: number,
  boughtAt: string,
  today = new Date(),
): RefillPlan | null {
  if (perPack < 1 || packs < 1 || perDay < 1) return null;
  const start = new Date(`${boughtAt}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;

  const servings = perPack * packs;
  const days = Math.ceil(servings / perDay);
  const until = new Date(start);
  until.setDate(until.getDate() + days);

  /* 날짜만 비교한다 — 시각이 섞이면 「오늘」이 −1일로 나온다 */
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d1 = new Date(until.getFullYear(), until.getMonth(), until.getDate());
  const left = Math.round((d1.getTime() - d0.getTime()) / 86400000);

  return { servings, days, until, left };
}

export const fmtDate = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

/* ─────────────────────────────────────────────────────────────
   저장 — 로그인이 없으므로 이 브라우저에만 (찜콩·계산기와 같은 방식).
   🔴 이게 **재방문 장치**다. 저장해 두면 /likes 에서 「곧 떨어져요」로 뜬다.
   ───────────────────────────────────────────────────────────── */
const KEY = "ptd.refill";
export const REFILL_EVENT = "ptd:refill";

export type RefillRecord = {
  id: string;
  name: string;
  img: string | null;
  perPack: number;
  packs: number;
  perDay: number;
  boughtAt: string;
};

export function readRefills(): RefillRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RefillRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRefill(r: RefillRecord) {
  try {
    const all = readRefills().filter((x) => x.id !== r.id);
    all.push(r);
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(REFILL_EVENT));
  } catch {
    /* 사생활 보호 모드 — 저장만 포기하고 계산은 그대로 보여준다 */
  }
}

export function removeRefill(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readRefills().filter((x) => x.id !== id)));
    window.dispatchEvent(new Event(REFILL_EVENT));
  } catch {
    /* 위와 같다 */
  }
}

/** 오늘 날짜를 input[type=date] 값으로 */
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
