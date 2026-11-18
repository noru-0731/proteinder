"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  DM_EVENT,
  clearDm,
  readDm,
  readThread,
  removeThread,
  unreadCount,
  type DmThread,
} from "@/lib/dm";

/**
 * 쪽지함 — DM 골격 (2026-08-08 · 팀 지시 「메시지 탭은 DM처럼」).
 *
 * 🔴 **왼쪽 대화 목록 · 오른쪽 대화** (데스크톱). 좁은 화면에서는 목록만 보이고
 *    고르면 대화가 그 자리를 덮는다 — 인스타·카톡이 다 이 골격이다.
 * 🔴 **주소를 안 쓴다.** 대화 내용이 localStorage 에만 있어 `/messages/[id]` 를 만들어도
 *    링크를 받은 사람에겐 빈 화면이다. 고른 대화는 상태로만 들고 있는다 —
 *    덕분에 라우트가 하나뿐이고 정적으로 남는다.
 *
 * ⚠️ 첫 렌더는 서버와 같아야 한다 — `null` 로 시작해 「불러오는 중」을 그리고
 *    마운트 뒤에 채운다. 빈 배열로 시작하면 쪽지가 있는 사람에게도
 *    「받은 쪽지가 없습니다」가 한 프레임 스쳐 간다 (찜콩에서 겪은 자리).
 */
export default function Messages() {
  const [threads, setThreads] = useState<DmThread[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setThreads(readDm().sort((a, b) => b.at - a.at));
    sync();
    window.addEventListener(DM_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DM_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /* 대화를 열면 안 읽음을 지운다 — 목록·헤더 배지가 같이 따라온다 */
  useEffect(() => {
    if (openId) readThread(openId);
  }, [openId]);

  if (threads === null)
    return <p className="px-5 py-16 text-center text-[13px] text-ink-dim">불러오는 중입니다</p>;

  if (!threads.length)
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">받은 쪽지가 없습니다</p>
        <p className="kr mx-auto mt-2 max-w-[440px] text-[13px] leading-[1.7] text-ink-dim">
          제품을 열어 보면 그 제품이 쪽지를 보냅니다. 신고된 성분과 원재료를 스스로
          소개하고, 성분이 가까운 제품을 함께 알려 줍니다.
        </p>
        <Link
          href="/rank"
          className="focus-ring mt-6 inline-block rounded text-[13px] font-semibold text-flame-deep"
        >
          제품 보러 가기 ›
        </Link>
      </div>
    );

  const open = threads.find((t) => t.id === openId) ?? null;
  const unread = unreadCount(threads);

  return (
    <div className="px-5 pb-10">
      <div className="flex items-center justify-between gap-3 pb-3">
        <p className="text-[12.5px] text-ink-dim">
          대화 {threads.length}개{unread > 0 && ` · 안 읽음 ${unread}`}
        </p>
        <button
          type="button"
          onClick={() => {
            clearDm();
            setOpenId(null);
          }}
          className="focus-ring rounded text-[12.5px] text-ink-dim transition-colors hover:text-red"
        >
          전체 지우기
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        {/* ── 대화 목록 ── 고른 대화가 있으면 좁은 화면에서는 감춘다 */}
        <ul className={`${open ? "hidden lg:block" : "block"} rounded-[10px] border border-line-strong`}>
          {threads.map((t) => (
            <li key={t.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenId(t.id)}
                aria-current={t.id === openId ? "true" : undefined}
                className={`focus-ring flex w-full items-center gap-2.5 rounded-[9px] p-3 text-left transition-colors hover:bg-bg ${
                  t.id === openId ? "bg-bg" : ""
                }`}
              >
                <Avatar img={t.img} name={t.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="kr min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                      {t.name}
                    </span>
                    {t.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-flame-deep px-1.5 text-[10px] leading-4 font-semibold text-white tabular-nums">
                        {t.unread}
                      </span>
                    )}
                  </span>
                  <span className="kr mt-0.5 block truncate text-[12px] text-ink-dim">
                    {t.msgs[t.msgs.length - 1]?.text ?? ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* ── 대화 ── */}
        {open ? (
          <Thread t={open} onClose={() => setOpenId(null)} onDelete={() => {
            removeThread(open.id);
            setOpenId(null);
          }} />
        ) : (
          <p className="hidden rounded-[10px] border border-line-strong px-5 py-16 text-center text-[13px] text-ink-dim lg:block">
            왼쪽에서 대화를 고르세요
          </p>
        )}
      </div>
    </div>
  );
}

function Avatar({ img, name }: { img: string | null; name: string }) {
  return (
    <span className="size-[42px] shrink-0 overflow-hidden rounded-full border border-line-strong bg-card">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG. 런타임 외부 요청 0
        <img src={img} alt="" className="size-full object-contain" />
      ) : (
        <span className="grid size-full place-items-center text-[13px] font-bold text-ink-dim">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

function Thread({
  t,
  onClose,
  onDelete,
}: {
  t: DmThread;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-[10px] border border-line-strong">
      {/* 대화 머리 — 상대가 누구인지. 누르면 그 제품으로 간다 */}
      <div className="flex items-center gap-2.5 border-b border-line p-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="목록으로"
          className="focus-ring -ml-1 rounded p-1 text-ink-sub lg:hidden"
        >
          <span aria-hidden className="block rotate-180">
            <Icon name="chevron-right" size={18} />
          </span>
        </button>
        <Avatar img={t.img} name={t.name} />
        <Link href={`/product/${t.id}`} className="focus-ring min-w-0 flex-1 rounded">
          <span className="kr block truncate text-[14px] font-semibold text-ink">{t.name}</span>
          <span className="block truncate text-[11.5px] text-ink-dim">
            {t.cat} · {t.basis} 기준
          </span>
        </Link>
        <button
          type="button"
          onClick={onDelete}
          aria-label="이 대화 지우기"
          className="focus-ring shrink-0 rounded p-1 text-ink-dim transition-colors hover:text-red"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        {/* 🔴 매칭 줄 — 틴더에서 대화가 열리는 그 자리다. 대화가 왜 생겼는지 한 줄로 */}
        <p className="kr mx-auto max-w-[420px] rounded-full bg-flame-wash px-3.5 py-1.5 text-center text-[11.5px] leading-[1.5] text-ink-sub">
          제품을 열어 보아 대화가 열렸습니다
        </p>

        {t.msgs.map((m) => (
          <p
            key={m.key}
            /* 받은 쪽 말풍선 — 왼쪽 정렬 · 오른쪽 위 모서리만 각지게 (DM 문법) */
            className="kr max-w-[80%] self-start rounded-[14px] rounded-tl-[4px] bg-bg px-3.5 py-2.5 text-[13px] leading-[1.7] text-ink"
          >
            {m.text}
          </p>
        ))}

        {/* 추천 — 말풍선 안이 아니라 카드로. 눌러서 바로 갈 수 있어야 한다 */}
        {t.recs.length > 0 && (
          <div className="mt-1 self-start rounded-[14px] rounded-tl-[4px] border border-line-strong bg-card p-2.5">
            <ul className="flex flex-col gap-1">
              {t.recs.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/product/${r.id}`}
                    className="focus-ring flex items-center gap-2.5 rounded-[8px] p-1.5 transition-colors hover:bg-bg"
                  >
                    <span className="size-[38px] shrink-0 overflow-hidden rounded-[6px] border border-line-strong bg-card">
                      {r.img && (
                        // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
                        <img src={r.img} alt="" className="size-full object-contain" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="kr block truncate text-[12.5px] font-semibold text-ink">
                        {r.name}
                      </span>
                      <span className="block truncate text-[11px] text-ink-dim">{r.why}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* 셋을 한 표에 놓는 길 — 비교가 이 서비스의 본체다 */}
            <Link
              href={`/compare?ids=${[t.id, ...t.recs.map((r) => r.id)].slice(0, 4).join(",")}`}
              className="focus-ring mt-1.5 block rounded-[8px] bg-flame-deep px-3 py-2 text-center text-[12.5px] font-semibold text-white transition-colors hover:bg-flame"
            >
              나와 함께 한 표에 놓고 보기
            </Link>
          </div>
        )}

        {/* 🔴 답장 칸을 만들지 않았다 — 보낼 곳이 없다. 그 자리에 무엇을 할 수 있는지 적는다.
            ⚠️ 흉내만 낸 입력칸을 두면 눌러 보고 아무 일도 안 일어난다 (원칙 5 의 화면판). */}
        <p className="kr mt-2 border-t border-line pt-3 text-[11.5px] leading-[1.7] text-ink-dim">
          이 대화는 신고된 성분·원재료를 옮겨 적은 것입니다. 답장 기능은 없고, 값은 전부
          식약처 신고값입니다 — 좋고 나쁨을 판정하지 않습니다.
        </p>
      </div>
    </div>
  );
}
