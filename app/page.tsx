import { CATEGORIES, catOf } from "@/lib/categories";
import { byRank, pool } from "@/lib/filters";
import { Chips, Gap, MoreButton, RankGrid, SectionHead } from "@/components/Bits";
import Hero from "@/components/Hero";

/**
 * 홈 — **히어로 · 랭킹 한 절.** 그게 전부다.
 *
 * (2026-08-08 · 드링크메모 벤치마크 · 팀 지시 「판 1 바로 적용」)
 *
 * 🔴 **맨 밑 절이 비었다** (2026-08-08 밤 · 팀 지시). 그 자리를 자주 묻는 질문 →
 *    매거진 순으로 채워 봤는데, 둘 다 **헤더 탭에도 있는 것**이었다. 같은 것을
 *    홈에서 미리 보여 주고 탭에서 또 보여 줄 이유가 없다 — 사전을 탭으로 올리면서
 *    홈에서 뺐던 것과 같은 판단이다. 홈은 히어로와 랭킹 한 절로 끝난다.
 *
 * 드링크메모 홈은 [큰 사진 + CTA 하나] → [칩 + 카드 여섯 + 더보기] → [FAQ] 로 끝난다.
 * 우리 홈은 배너 하나에 절이 여섯이었다 — 많이 찾는 · 카테고리별 · 내 조건에 맞는 ·
 * 무엇을 우선할까요 · 브랜드 · 사전. 한 화면에 목록이 여섯 벌 깔리니
 * **무엇부터 보라는 건지가 없었다.**
 *
 * 🔴 **내린 다섯 절은 삭제가 아니라 이동이다.** 넷은 이미 `/rank` 의 하위 탭이
 *    같은 목록을 그린다 (view=popular · fit · axis · brand). 홈에서 미리 보여 주던
 *    것을 한 단계 안으로 넣은 것뿐이다.
 * 🔴 **사전은 헤더 탭으로 옮겼다.** `/ingredients` 706쪽의 진입점이 이 홈의
 *    마지막 절 하나뿐이었다 — 그냥 지웠으면 고아가 됐다 (`layout.tsx` TABS).
 *
 * ⚠️ 남긴 한 절을 「카테고리별」로 고른 이유: 카테고리가 이 서비스의 뼈대고,
 *    칩 일곱이 곧 수록 범위를 보여 준다. 「많이 찾는」은 쇼핑몰 노출 수라
 *    첫 화면에서 우리가 재지 않은 것을 앞세우게 된다.
 *
 * 칩은 전부 링크(쿼리스트링)라 JS 가 없다 — 서버에서 그려서 내려간다.
 */

type SP = Promise<{ cat?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cat = catOf(sp.cat) ?? CATEGORIES[0];

  /* 표본이 있는 카테고리만 칩으로 — 「수집 중」 두 칸은 랭킹 탭 드롭다운에서 보인다 */
  const catChips = CATEGORIES.filter((c) => c.data).map((c) => ({
    key: c.key,
    label: c.label,
    icon: c.icon,
    href: `/?cat=${c.key}`,
  }));

  const popular = byRank(pool(cat.key)).slice(0, 6);

  return (
    <>
      <Hero />

      <Gap />

      <SectionHead
        accent="카테고리별"
        title="랭킹"
        href={`/rank?view=category&cat=${cat.key}`}
      />
      <Chips items={catChips} active={cat.key} />
      <RankGrid items={popular} />
      <MoreButton href={`/rank?view=category&cat=${cat.key}`} label={`${cat.label} 전체보기`} />

      <div className="h-6" />
    </>
  );
}
