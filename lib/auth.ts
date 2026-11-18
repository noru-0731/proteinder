/**
 * 로그인 — Supabase Auth (아이디 + 비밀번호).
 *
 * 🔴 **`users` 표를 우리가 만들지 않는다.** 이 앱은 브라우저에서 anon 키로 Supabase 를
 *    직접 부르는 구조라, 우리가 만든 표는 클라이언트가 읽고 쓰는 자리가 된다 —
 *    거기에 비밀번호를 두면 사실상 공개다. 클라이언트에서 해시를 씌워도
 *    **그 해시가 곧 비밀번호**가 되어 달라지는 게 없다.
 *    Supabase Auth 는 해싱·세션·토큰을 서버가 맡는다. 우리 코드는 두 번 부르는 게 전부다.
 *
 * 🔴 supabase-js 를 안 쓴다 — REST fetch 두 개면 되고, 리뷰·매칭 카운터와 같은 방식이다.
 *
 * ⚠️ **아이디를 이메일로 바꿔 넘긴다.** Supabase Auth 는 이메일을 요구하는데 시연에서
 *    메일 주소를 치게 하면 느리고 오타가 난다. `noru` → `noru@proteinder-v2.vercel.app`
 *    으로 붙여서 보내고, 화면에는 아이디만 보여준다. 도메인은 **우리 배포 주소**이고
 *    MX 레코드가 없어 메일이 나갈 데가 없다 — 그래서 대시보드에서 메일 확인을 꺼야 한다.
 *
 * ⚠️ 토큰은 localStorage 에 둔다. anon 키로 도는 앱의 표준 방식이지만
 *    **XSS 가 나면 토큰도 함께 털린다** — 이 앱은 사용자 입력을 HTML 로 렌더하지 않는다.
 * ⚠️ 실패는 조용히 넘기지 않는다. 로그인은 부가 정보가 아니라 사용자가 결과를
 *    기다리는 행동이라, 안 되면 안 된다고 화면에 적는다 (리뷰·카운터와 다른 점).
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(URL_ && KEY);

/** 로그인 상태가 바뀌면 헤더가 따라 갱신되게 하는 신호 */
export const AUTH_EVENT = "ptd:auth";
const KEY_SESSION = "ptd.auth";

export type Session = { id: string; token: string; userId: string };

/** 아이디에 쓸 수 있는 글자 — 이메일로 바꿔 넘기므로 좁게 잡는다 */
export const ID_RE = /^[a-z0-9_.-]{3,20}$/;
/* 🔴 **우리가 배포한 도메인을 쓴다.** 아무 도메인이나 되지 않는다 —
   Supabase 가 주소를 검사해서 `proteinder.app` 은 `email_address_invalid` 로 막혔다.
   여기는 우리 주소이고 MX 레코드가 없어 메일이 나갈 데도 없다.
   ⚠️ 사용자는 이 글자를 보지도 치지도 않는다. 아이디만 입력한다. */
const DOMAIN = "proteinder-v2.vercel.app";

export const idToEmail = (id: string) => `${id.trim().toLowerCase()}@${DOMAIN}`;
export const emailToId = (email: string) => email.replace(`@${DOMAIN}`, "");

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY_SESSION);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && typeof s.token === "string" ? (s as Session) : null;
  } catch {
    return null;
  }
}

function write(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY_SESSION, JSON.stringify(s));
    else localStorage.removeItem(KEY_SESSION);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  } catch {
    /* 사생활 보호 모드 — 저장만 포기한다 (그 창에서는 새로고침하면 풀린다) */
  }
}

/** Supabase 가 돌려주는 오류 문구를 사람이 읽을 말로 */
function human(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "이미 있는 아이디입니다.";
  if (m.includes("invalid login credentials")) return "아이디나 비밀번호가 맞지 않습니다.";
  if (m.includes("password should be")) return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("email logins are disabled") || m.includes("signups not allowed"))
    return "로그인 기능이 아직 켜지지 않았습니다 (Supabase 대시보드에서 Email 공급자를 켜야 합니다).";
  if (m.includes("confirm")) return "메일 확인이 켜져 있어 로그인할 수 없습니다 — 대시보드에서 꺼 주세요.";
  return msg;
}

type Result = { ok: true; session: Session } | { ok: false; error: string };

async function call(path: string, body: object): Promise<Result> {
  if (!authEnabled) return { ok: false, error: "로그인 설정이 없습니다." };
  try {
    const res = await fetch(`${URL_}/auth/v1/${path}`, {
      method: "POST",
      headers: { apikey: KEY!, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: human(data.msg || data.error_description || data.message || "실패했습니다.") };

    const token: string | undefined = data.access_token;
    const email: string | undefined = data.user?.email ?? data.email;
    /* 🔴 토큰이 없으면 「가입은 됐지만 로그인은 아직」이다 — 메일 확인이 켜져 있을 때
       Supabase 가 이렇게 응답한다. 성공으로 넘기면 화면만 로그인처럼 보인다. */
    if (!token || !email)
      return {
        ok: false,
        error: "가입은 됐지만 바로 로그인되지 않았습니다 — 대시보드에서 메일 확인을 꺼 주세요.",
      };

    const session: Session = { id: emailToId(email), token, userId: data.user?.id ?? "" };
    write(session);
    return { ok: true, session };
  } catch {
    return { ok: false, error: "연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }
}

export const signUp = (id: string, password: string) =>
  call("signup", { email: idToEmail(id), password });

export const signIn = (id: string, password: string) =>
  call("token?grant_type=password", { email: idToEmail(id), password });

export function signOut() {
  const s = readSession();
  write(null);
  /* 서버 쪽 세션도 지운다. 실패해도 로컬은 이미 지웠으니 화면은 로그아웃 상태다 */
  if (authEnabled && s?.token) {
    fetch(`${URL_}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: KEY!, Authorization: `Bearer ${s.token}` },
    }).catch(() => {});
  }
}
