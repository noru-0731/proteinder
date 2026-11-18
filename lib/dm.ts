
/**
 * 쪽지 — 제품을 열어 보면 **그 제품이 말을 건다** (2026-08-08 · 팀 지시 「틴더 정체성」).
 *
 * 이 서비스 이름이 프로틴더인데, 정작 틴더에서 온 것은 이름뿐이었다.
 * 틴더의 알맹이는 **매칭되면 대화가 열린다**는 것이고, 그 자리를 여기서 만든다 —
 * 제품 상세를 열면 그 제품과 「매칭」되어 쪽지함에 대화가 하나 생긴다.
 *
 * 🔴 **이 파일은 클라이언트가 부른다 — 그래서 무거운 것을 하나도 안 문다.**
 *    문장을 짓는 일은 `lib/dm-compose.ts` 가 맡는다 (서버 전용).
 *    한 파일에 두었다가 `DmSeed`·`Messages` 가 이걸 부르면서 `similarTo` →
 *    `data.ts` → **products.json 이 통째로 클라이언트 번들에 실렸다** —
 *    실측 `.next/static/chunks` 에 778KB · 제품 687개.
 *    ⚠️ 여기에 `./data`·`./similar`·`./summary`·`./nutrition-grades` 를 import 하지 말 것.
 *
 * ⚠️ 브라우저별·기기별로 따로다. 로그인이 없고 서버로 아무것도 보내지 않는다.
 * ⚠️ 시연은 발표 노트북으로 — 심사위원 폰에는 빈 쪽지함이다 (찜콩과 같은 사정).
 */

export type DmMsg = {
  /** 같은 말이 두 번 붙지 않게 하는 열쇠 — 다시 열어도 대화가 안 불어난다 */
  key: string;
  text: string;
};

export type DmRec = {
  id: string;
  name: string;
  img: string | null;
  /** 왜 이걸 권하는지 — 지어낸 말이 아니라 잣대 이름이다 */
  why: string;
};

export type DmThread = {
  id: string;
  name: string;
  img: string | null;
  cat: string;
  /** 「1병(260ml) 기준」 — 값이 무엇을 기준으로 한 것인지 대화에도 붙는다 */
  basis: string;
  msgs: DmMsg[];
  recs: DmRec[];
  /** 마지막으로 말이 온 시각 (ms). 목록을 이걸로 줄 세운다 */
  at: number;
  /** 안 읽은 쪽지 수 */
  unread: number;
};

/** 서버가 만들어 클라이언트로 넘기는 씨앗 — 여기에 든 문장이 그대로 대화가 된다 */
export type DmSeed = Omit<DmThread, "at" | "unread">;

const KEY = "ptd.dm";
/** 쪽지함·헤더 배지·상세가 서로를 갱신하는 신호 */
export const DM_EVENT = "ptd:dm";
/** 쪽지함에 남기는 대화 수 — 넘치면 오래된 것부터 버린다 */
export const MAX_THREADS = 30;

/* ── 저장 (클라이언트) ─────────────────────────────────────────── */

export function readDm(): DmThread[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((t) => t && typeof t.id === "string") : [];
  } catch {
    return [];
  }
}

function write(threads: DmThread[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(threads.slice(0, MAX_THREADS)));
    window.dispatchEvent(new CustomEvent(DM_EVENT));
  } catch {
    /* 사파리 사생활 보호 모드 등 — 저장만 포기 */
  }
}

/**
 * 씨앗을 쪽지함에 넣는다. **이미 있는 대화면 새 말만 덧붙인다.**
 *
 * ⚠️ 같은 제품을 다시 열었다고 대화가 두 배로 불어나면 안 된다 — `key` 로 거른다.
 * ⚠️ 덧붙일 말이 없으면 **아무것도 안 건드린다.** 다시 열 때마다 「안 읽음」이 켜지면
 *    배지가 늘 빨간 채로 있어 아무 뜻이 없어진다.
 */
export function seedDm(seed: DmSeed, now: number) {
  const all = readDm();
  const old = all.find((t) => t.id === seed.id);

  if (!old) {
    write([{ ...seed, at: now, unread: seed.msgs.length }, ...all]);
    return;
  }

  const have = new Set(old.msgs.map((m) => m.key));
  const fresh = seed.msgs.filter((m) => !have.has(m.key));
  if (!fresh.length) return;

  const next: DmThread = {
    ...old,
    /* 추천은 늘 최신으로 덮는다 — 수록이 바뀌면 이웃도 바뀐다 */
    recs: seed.recs,
    msgs: [...old.msgs, ...fresh],
    at: now,
    unread: old.unread + fresh.length,
  };
  write([next, ...all.filter((t) => t.id !== seed.id)]);
}

/** 대화를 열었다 — 안 읽음을 지운다 */
export function readThread(id: string) {
  const all = readDm();
  const t = all.find((x) => x.id === id);
  if (!t || t.unread === 0) return;
  write(all.map((x) => (x.id === id ? { ...x, unread: 0 } : x)));
}

export function removeThread(id: string) {
  write(readDm().filter((t) => t.id !== id));
}

export function clearDm() {
  write([]);
}

export const unreadCount = (threads: DmThread[]) => threads.reduce((s, t) => s + t.unread, 0);
