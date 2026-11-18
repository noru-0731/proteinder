import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, articleOf, otherArticles } from "@/lib/magazine";
import { MagazineGrid, Rich } from "@/components/Magazine";
import { Gap, RankGrid, SectionHead } from "@/components/Bits";

type P = Promise<{ slug: string }>;

/**
 * 🔴 **읽는 화면이라 컬럼을 가운데 세운다** (2026-08-08 · 팀 지시 「너무 좌측 정렬」).
 *
 * 셸이 1200px 인데 본문만 720px 이라, 글이 왼쪽에 붙고 오른쪽 480px 이 통째로
 * 비어 있었다. 폭을 1200 까지 늘리는 것은 답이 아니다 — 14px 한글로 한 줄이
 * 80자를 넘어가 눈이 줄을 잃는다. **폭은 읽기 좋게 두고 자리만 가운데로 옮긴다.**
 *
 * ⚠️ 좌우 패딩을 여기 넣지 않는다. 이 화면이 쓰는 부품 절반(`SectionHead` ·
 *    `MagazineGrid` · `Note`)이 제 안에 `px-5` 를 갖고 있어, 겹쳐 주면 그것들만
 *    안쪽으로 밀려 왼쪽 선이 두 줄이 된다.
 * ⚠️ 회색 띠(`Gap`)는 이 컬럼 **밖**에 둔다. 흰 컬럼을 끝에서 끝까지 갈라야
 *    절이 나뉜 것으로 보인다 — 안에 넣으면 가운데 뜬 회색 토막이 된다.
 * ⚠️ 목록 쪽도 같은 폭이다. 기사는 820, 아래 제품 목록은 1200 이면 **한 화면에
 *    왼쪽 선이 둘** 생겨 「정렬이 안 맞는다」가 그대로 남는다.
 */
const COL = "mx-auto max-w-[820px]";

/** 🔴 여섯 쪽 전부 빌드 때 굽는다 — 런타임 계산이 0 이라 시연 중 느려질 자리가 없다 */
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const a = articleOf((await params).slug);
  if (!a) return { title: "매거진 — 프로틴더" };
  return { title: `${a.headline} — 프로틴더 매거진`, description: a.description };
}

/**
 * 기사 한 편 — 뉴닉 아티클 골격 그대로다.
 *
 *   리드 문단 → 질문형 소제목 + 본문 → 소제목 + 본문 → … → 각주
 *
 * 🔴 **그 아래가 우리 것이다.** 뉴닉은 기사가 기사로 끝나지만 우리는 기사가 곧
 *    필터다 — 「15건 있어요」를 읽고 나면 그 15건이 그대로 눈앞에 있고, 눌러서
 *    제품 상세로 간다. 매거진을 붙이는 이유가 이 자리다.
 *
 * ⚠️ 목록은 `/rank` 로 넘기지 않는다. 랭킹은 카테고리마다 30개로 자른 **표본**을
 *    보여 주는데 기사는 수록 전체를 세므로, 넘기면 「82건」이라 적고 12건이 뜬다.
 * ⚠️ `RankRow` 를 `plain` 으로 쓴다. 이 목록은 순위가 아니라 **해당하는 제품들**이라
 *    1·2·3 에 메달이 붙으면 「1등 제품」으로 읽힌다.
 */
export default async function ArticlePage({ params }: { params: P }) {
  const a = articleOf((await params).slug);
  if (!a) notFound();

  return (
    <>
      <div className={`${COL} px-5 pt-6`}>
        <Link href="/magazine" className="focus-ring rounded text-[12.5px] font-semibold text-flame-deep">
          ← 프로틴더 매거진
        </Link>

        <div className="mt-3 flex items-center gap-1.5">
          <span aria-hidden className="text-[16px] leading-none">
            {a.emoji}
          </span>
          {a.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-flame-wash px-2 py-0.5 text-[11px] font-semibold text-flame-deep"
            >
              {t}
            </span>
          ))}
        </div>

        <h1 className="kr mt-2.5 max-w-[42ch] text-[23px] leading-[1.36] font-semibold text-ink">
          {a.headline}
        </h1>
      </div>

      <article className={`${COL} px-5 pt-5 pb-8`}>
        <p className="kr border-l-[3px] border-flame pl-4 text-[14px] leading-[1.8] text-ink-sub">
          <Rich text={a.lead} />
        </p>

        {a.sections.map((s) => (
          <section key={s.q} className="mt-7">
            {/* 🔴 소제목만 반말 질문이다 — 뉴닉 문법의 핵심 대비 */}
            <h2 className="kr text-[16px] leading-[1.45] font-semibold text-ink">{s.q}</h2>
            <p className="kr mt-2 text-[14px] leading-[1.8] text-ink-sub">
              <Rich text={s.body} />
            </p>
          </section>
        ))}

        {/* 🔴 뉴닉이 「이 아티클은 AI가 작성했어요」를 본문 끝에 적는 그 자리다.
            우리도 사람이 한 편씩 쓴 글이 아니라 규칙으로 조립한 글이라 그대로 적는다. */}
        <p className="kr mt-8 border-t border-line pt-4 text-[11.5px] leading-[1.75] text-ink-dim">
          이 기사의 문장과 숫자는 <b className="font-semibold">수록 제품을 세어 조립한 것</b>
          입니다. 따로 조사하거나 어림한 값이 없고, 수록이 바뀌면 문장도 함께 바뀝니다. 원재료
          순번은 신고된 배합 순서이며 함량 비율은 공개되지 않습니다. 이 서비스는 식품의
          안전성·효능을 평가하지 않습니다.
        </p>
      </article>

      {a.lists.map((l) => (
        <div key={l.title}>
          {/* 🔴 회색 띠는 `COL` 밖이다 — 흰 컬럼을 끝에서 끝까지 갈라야 절이 나뉜 것으로
              보인다. 안에 넣으면 820px 짜리 회색 토막이 가운데 떠 있게 된다 */}
          <Gap />
          {/* ⚠️ `COL` 에는 좌우 패딩을 주지 않는다 — `SectionHead`·`MagazineGrid` 가
              제 안에 `px-5` 를 갖고 있어, 여기서 또 주면 그 둘만 20px 씩 더 밀려
              바로 아래 문단·목록과 왼쪽 선이 어긋난다 */}
          <div className={COL}>
            <SectionHead title={l.title} />
            <p className="kr px-5 pb-1 text-[12.5px] leading-[1.65] text-ink-dim">
              {l.note}
              {l.total > l.items.length && ` 여기에는 ${l.items.length}건만 실었습니다.`}
            </p>
            {/* 🔴 한 줄에 하나씩 쌓으면 780px 짜리 행에 내용이 왼쪽 절반만 차고
                오른쪽이 통째로 빈다 — 본문을 가운데로 옮겨도 목록에 같은 문제가 남는다.
                홈·랭킹이 쓰는 격자를 그대로 쓰되 컬럼이 좁으니 2열이다.
                ⚠️ `plain` 을 준다. 이 목록은 순위가 아니라 「해당하는 제품들」이라
                   1·2·3 에 메달이 붙으면 「1등 제품」으로 읽힌다. */}
            <div className="pb-3">
              <RankGrid items={l.items} cols={2} plain />
            </div>
          </div>
        </div>
      ))}

      <Gap />

      <div className={`${COL} pb-9`}>
        <SectionHead accent="다른" title="이야기" href="/magazine" />
        <MagazineGrid items={otherArticles(a.slug)} cols={3} />
      </div>
    </>
  );
}
