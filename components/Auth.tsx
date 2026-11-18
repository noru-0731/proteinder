"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AUTH_EVENT,
  ID_RE,
  authEnabled,
  readSession,
  signIn,
  signOut,
  signUp,
  type Session,
} from "@/lib/auth";

/**
 * 로그인 화면 부품 둘 — 헤더 표시와 로그인/가입 폼.
 *
 * 🔴 첫 렌더는 서버와 같아야 한다 — 서버에는 localStorage 가 없으므로
 *    **로그아웃 상태로 그리고** 마운트 뒤에 갈아 끼운다. 하이드레이션이 어긋나지 않는다.
 * 🔴 비밀번호는 이 컴포넌트 밖으로 나가지 않는다. state 에만 있다가 Supabase 로 가고,
 *    우리 저장소(localStorage)에는 **토큰만** 남는다.
 */

function useSession(): Session | null {
  const [s, setS] = useState<Session | null>(null);
  useEffect(() => {
    const sync = () => setS(readSession());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return s;
}

/* ❌ `AuthBadge` 를 여기서 뺐다 (2026-08-08) — 헤더 오른쪽 세 칸을
   `components/HeaderActions.tsx` 하나로 합쳤다. 로그인 여부에 따라 한 칸이 두 칸
   (아이디 + 로그아웃)이 되며 헤더 줄 높이를 흔들던 자리라, 헤더에는 아이디만 적고
   로그아웃은 이 파일 아래 `/login` 화면이 맡는다. */

/** /login 의 본문 — 로그인과 회원가입을 한 폼에서 오간다 */
export function AuthForm() {
  const router = useRouter();
  const s = useSession();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!authEnabled)
    return (
      <p className="kr px-5 py-16 text-center text-[13px] leading-[1.7] text-ink-dim">
        로그인 설정이 아직 없습니다.
      </p>
    );

  if (s)
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">
          <span className="text-flame-deep">{s.id}</span> 님으로 로그인돼 있습니다
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/"
            className="focus-ring rounded-[8px] bg-flame-deep px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            홈으로
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="focus-ring rounded-[8px] border border-line-strong px-5 py-2.5 text-[14px] font-semibold text-ink-sub"
          >
            로그아웃
          </button>
        </div>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr("");

    const trimmed = id.trim().toLowerCase();
    if (!ID_RE.test(trimmed)) {
      setErr("아이디는 영문 소문자·숫자·_ . - 으로 3~20자입니다.");
      return;
    }
    if (pw.length < 6) {
      setErr("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setBusy(true);
    const r = await (mode === "in" ? signIn(trimmed, pw) : signUp(trimmed, pw));
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setPw("");
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-[420px] px-5 py-10">
      <h1 className="kr text-[22px] leading-[1.3] font-semibold text-ink">
        {mode === "in" ? "로그인" : "회원가입"}
      </h1>

      {/* 탭 — 같은 폼에서 오간다. 화면을 갈아 끼우지 않는다 */}
      <div className="mt-4 flex gap-5 border-b border-line">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setErr("");
            }}
            aria-current={mode === m ? "page" : undefined}
            className={`focus-ring -mb-px rounded-t border-b-2 pb-2.5 text-[14.5px] font-semibold ${
              mode === m ? "border-ink text-ink" : "border-transparent text-ink-dim"
            }`}
          >
            {m === "in" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5">
        <label className="block">
          <span className="mb-1 block text-[12.5px] text-ink-sub">아이디</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="영문 소문자·숫자 3~20자"
            className="focus-ring w-full rounded-[8px] border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-dim"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-[12.5px] text-ink-sub">비밀번호</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder="6자 이상"
            className="focus-ring w-full rounded-[8px] border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-dim"
          />
        </label>

        {err && <p className="kr mt-3 text-[12.5px] leading-[1.6] text-danger">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="focus-ring mt-5 w-full rounded-[8px] bg-flame-deep py-3 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {busy ? "잠시만요" : mode === "in" ? "로그인" : "가입하고 시작하기"}
        </button>
      </form>

      {/* 🔴 무엇을 저장하는지 화면에 적는다 — 로그인은 사용자가 무언가를 맡기는 행동이다 */}
      <p className="kr mt-6 text-[11.5px] leading-[1.7] text-ink-dim">
        비밀번호는 우리 쪽에 저장되지 않습니다 — Supabase 인증 서버가 받아 처리하고,
        이 브라우저에는 로그인 토큰만 남습니다. 아이디는 내부에서만 메일 주소 꼴로
        바뀌어 전달되며 메일은 오가지 않습니다.
      </p>
      <p className="kr mt-2 text-[11.5px] leading-[1.7] text-ink-dim">
        지금은 로그인해도 찜콩과 리뷰는 이 브라우저에 그대로 남습니다 — 계정에 묶는
        일은 아직 하지 않았습니다.
      </p>
    </div>
  );
}
