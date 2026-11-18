import type { Product } from "@/lib/data";
import { editorialOf } from "@/lib/editorial";
import { editorNotesOf } from "@/lib/editor-notes";

/**
 * 프로틴더 에디터 — 제품 상세.
 *
 * 순수 서버 렌더링. 바이라인은 사람 이름이 아니라 **「프로틴더 에디터」**다 —
 * 우리 팀이 정한 문장 규칙이 쓴 글이라 실존 인물의 이름을 붙이면 그때부터 거짓이 된다.
 *
 * ❌ 맨 아래 출처 각주(「여기 적힌 값은 전부 … 신고값입니다」)는 지웠다
 *    (2026-08-08 · 팀 지시). 이 카드에서 사람이 지어낸 것은 **말투뿐이고 숫자는
 *    전부 화면 다른 곳에 이미 떠 있다**는 사실은 그대로지만, 그걸 화면이 말로
 *    밝히지는 않는다 — `lib/editorial.ts` 가 신고값만 조합하는 구조가 지킨다.
 */
export default function Editorial({ p }: { p: Product }) {
  const ed = editorialOf(p);
  /* 🔴 손으로 쓴 긴 글이 있는 제품은 조립문 아래에 이어 붙인다 (lib/editor-notes.ts).
     ⚠️ 조립문을 **대체하지 않는다.** 조립문은 신고값에서 자동으로 나오는 자리라
        데이터가 바뀌면 같이 바뀌고, 손글은 안 바뀐다 — 둘을 겹쳐 두면 어느 쪽이
        최신인지 화면이 말하지 못한다. 순서로 갈라 둔다: 자동 먼저, 손글 다음. */
  const notes = editorNotesOf(p.id);
  if (!ed && !notes) return null;

  return (
    <section id="sec-editor" className="card rounded-2xl p-6">
      <div className="flex items-center gap-2.5">
        {/* 🔴 「프」 글자 대신 심벌 마크 (2026-08-08 · 팀 지시).
            바이라인은 사람 이름이 아니라 서비스라, 아바타도 사람 흉내가 아니라
            브랜드 마크여야 앞뒤가 맞는다.
            ⚠️ 원본이 흰 배경이라 원형으로 자른다 — 카드도 흰색이라 경계가 안 보인다. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 고정 크기 한 장 */}
        <img
          src="/mark.png"
          srcSet="/mark.png 1x, /mark@2x.png 2x"
          alt=""
          aria-hidden
          width={36}
          height={36}
          className="block size-9 shrink-0 rounded-full"
        />
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-title">프로틴더 에디터</span>
          <span className="block text-[11.5px] text-faint">
            신고 원재료와 영양성분을 읽고 정리합니다
          </span>
        </span>
      </div>

      {ed?.nutrition && (
        <p className="kr mt-3.5 text-[14px] leading-[1.78] text-body">{ed.nutrition}</p>
      )}
      {ed?.ingredients && (
        <p className="kr mt-2.5 text-[14px] leading-[1.78] text-body">{ed.ingredients}</p>
      )}

      {notes?.map((s) => (
        <section
          key={s.title}
          className={
            s.caution
              ? "mt-5 rounded-xl border border-line-strong bg-bg p-4"
              : "mt-6 border-t border-line pt-5"
          }
        >
          <h3
            className={`kr text-[14.5px] font-bold ${s.caution ? "text-ink-sub" : "text-title"}`}
          >
            {s.title}
          </h3>
          {s.paras.map((t, i) => (
            <p key={i} className="kr mt-2.5 text-[14px] leading-[1.78] text-body">
              {t}
            </p>
          ))}
          {/* 🔴 근거 줄을 접지도 지우지도 않는다 — 사람이 쓴 글에서 이 줄이 빠지면
              조립문과 달리 「어디서 온 문장인가」를 화면이 못 말한다 (lib/editor-notes.ts) */}
          <ul className="mt-3 space-y-1">
            {s.sources.map((src) => (
              <li key={src} className="kr text-[11.5px] leading-[1.6] text-faint">
                · {src}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* ❌ 각주 「여기 적힌 값은 전부 … 신고값입니다」를 지웠다 (2026-08-08 · 팀 지시).
          ⚠️ 문단 본문은 그대로다 — 값을 지어내지 않는다는 규칙은 문구가 아니라
             `lib/editorial.ts` 가 신고값만 조합하는 구조로 지킨다. */}
    </section>
  );
}
