import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { Product, catLabel, formatWhole } from "@/lib/data";
import { snapOf } from "@/lib/likes";
import { GRADE_BADGE_CLS, nutritionStandings } from "@/lib/nutrition-grades";
import CardRating from "@/components/CardRating";
import PriceLine from "@/components/PriceLine";

/**
 * 제품 카드 — 사진이 먼저 보이고 글자가 뒤따른다. (fruitsfamily 구조 참고)
 *
 * 🔴 사진을 **틀에 꽉 채운다**(object-cover). 전에는 회색 상자 안에 92%로 넣어
 *    사방에 여백이 남았다. 우리 사진 710장 중 **644장(90%)이 이미 정사각**이라
 *    정사각 틀에 채워도 잘리는 건 41장(6%)뿐이다 — 재고 넘어갔다.
 *
 * 🔴 카드 테두리는 걷어내고 **사진 틀에만** 남겼다. 참고한 사이트는 사진을
 *    자체 촬영해 배경이 있지만, 우리 사진은 대부분 **흰 배경 제품컷**이라
 *    테두리가 없으면 어디까지가 사진인지 안 보인다.
 *
 * 볼드는 **둘뿐**이고, 크기는 그 둘 사이에서만 갈린다.
 * 셋 이상 굵으면 아무것도 강조되지 않고, 크기가 셋 이상이면 눈이 흔들린다.
 *
 *    제품명   15.5px 굵게·진하게   ← 카드에서 유일하게 제품을 특정하는 글자
 *    단백질   14px  굵게·진하게   ← 이 서비스에서 「가격」에 해당하는 값
 *    나머지   12.5px 보통·흐리게  ← 브랜드·용량·칼로리·당류 전부 같은 크기
 *
 *   ~lg   [썸네일 88×88] [글자]   ← 가로 행. 좁은 폭에서는 목록이 낫다
 *   lg~   [정사각 사진] 위, 글자 아래
 */
export default function ProductCard({ p }: { p: Product }) {
  const protGrade = nutritionStandings(p).find((a) => a.key === "prot")?.grade ?? null;
  // 🔴 당류는 3단계 전용 축이다 (제로 / 저당 / 많음). edgesOf 의 「하위 20%」를 대체했다

  return (
    /* 🔴 하트는 Link 의 형제다 — a 안의 button 은 잘못된 중첩이고 클릭이 겹친다.
       모바일 가로형 카드는 우상단이 용량 자리라 하트를 lg 이상에서만 띄운다
       (모바일 찜은 상세에서 — /compare 대조 버튼을 우하단으로 내린 것과 같은 사정) */
    /* ❌ **두르는 선을 다시 걷어냈다** (2026-08-08 · 팀 지시 「선은 다 지우고 스칠 때
       애니메이션은 유지」). 한 번 둘러 봤더니 격자에 선이 너무 많았다 —
       카드마다 테두리가 있고 그 안에 사진 틀 테두리가 또 있어 선이 두 겹이었다.
       🔴 **경계는 hover 가 맡는다** — 스치면 떠오르면서 그림자가 생겨 그때 한 칸이
          한 물건으로 보인다. 가만히 있을 때는 사진 틀 하나로 충분하다.
       ⚠️ 여백(`p-2.5`)과 흰 바탕은 남긴다. 그림자가 앉을 면이 없으면 hover 가 안 보인다.
       ⚠️ 하트는 그 여백만큼 안으로 들어와 있다 (right-2 → right-3.5). */
    <div className="pcard relative rounded-xl bg-card p-2.5 lg:p-3">
      <LikeButton
        snap={snapOf(p)}
        variant="card"
        className="absolute right-3.5 top-3.5 z-10 hidden lg:grid"
      />
    <Link
      href={`/product/${p.id}`}
      className="focus-ring group flex gap-3.5 rounded-lg lg:block"
    >
      <div className="relative size-22 shrink-0 overflow-hidden rounded-lg border border-line bg-thumb lg:aspect-square lg:size-auto lg:w-full">
        {p.img ? (
          // 외부 도메인이 아니라 자체 호스팅이지만, 정적 파일이라 next/image 를 쓰지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.img}
            alt={p.name}
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="grid size-full place-items-center px-2 text-center text-[11px] leading-4 text-faint">
            {p.type}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 lg:mt-3">
        {/* 윗줄은 브랜드와 용량 — 둘 다 보통 굵기다.
            브랜드가 없는 174건은 카테고리를 적는다. 이 줄이 비면 아래 제목이 떠 보인다. */}
        <div className="flex items-baseline justify-between gap-2">
          {/* 🔴 브랜드에는 색을 준다 — 상세 화면(3차)의 브랜드 줄과 같은 --brand-ink 다.
              같은 자리에 같은 값이 두 화면에서 다른 색으로 뜨면 다른 것으로 읽힌다.
              ⚠️ 브랜드가 없는 제품은 카테고리를 대신 적는데, 거기에는 색을 주지 않는다.
                 카테고리가 브랜드처럼 보이면 「RTD 음료」라는 브랜드가 있는 줄 안다. */}
          <span
            className={`truncate text-[12.5px] leading-[18px] ${
              p.brand ? "font-semibold text-ink-sub" : "text-meta"
            }`}
          >
            {p.brand || catLabel(p.cat)}
          </span>
          {p.size && (
            <span className="shrink-0 text-[12.5px] leading-[18px] text-faint">{p.size}</span>
          )}
        </div>

        {/* 🔴 굵은 줄은 **제품명**이다. 브랜드를 굵게 두면 같은 브랜드 카드가
            줄줄이 같은 글자로 보여 무엇이 다른지 눈에 안 들어온다.
            두 줄까지 준다 — 「닥터유 프로 단백질 드링크 40g 초코」가 한 줄에 안 들어간다. */}
        <p className="mt-0.5 line-clamp-2 break-keep text-[15.5px] font-bold leading-[21px] text-title">
          {p.name}
        </p>

        {/* 이 서비스의 「가격」은 단백질이다. 한 줄에서 가장 굵고 크다.
            🔴 **수치는 전부 이 줄이 맡는다** (2026-08-06). 당류가 배지 안에
               「당류 하위 20% · 0g」처럼 붙어 있었는데, 배지가 길어져 한 줄에
               두 개가 안 들어갔다. 칼로리와 같은 회색 글씨로 여기 옮겼다 —
               숫자를 감춘 게 아니라 **한 곳으로 모은 것**이다. */}
        {/* 🔴 별점 (2026-08-08 · 화해 문법) — 제품명 바로 아래, 영양값 위.
            화해 랭킹 카드가 「제품명 → ★4.61 → 리뷰수」 순서다. 영양값보다 위인 이유는
            별점이 **고르는 순서에서 먼저 걸리는 값**이기 때문이다.
            ⚠️ 리뷰가 없는 제품은 이 줄이 아예 안 생긴다 (CardRating 참조). */}
        <CardRating id={p.id} />

        <p className="mt-1.5 text-[14px] font-bold leading-5 text-title tabular-nums">
          {p.protPack == null ? (
            <span className="font-semibold text-faint">환산 미산출</span>
          ) : (
            <>
              단백질 {formatWhole(p.protPack, "g")}
              <span className="font-medium text-faint">
                {" · "}
                {formatWhole(p.kcalPack)}kcal
                {/* 당류 미신고는 「0」이 아니라 「모름」이라 칸 자체를 안 적는다 */}
                {p.sugarPack != null && ` · 당류 ${formatWhole(p.sugarPack, "g")}`}
              </span>
            </>
          )}
        </p>

        {/* 🔴 **색이 방향을 말한다 — 파랑은 반기는 쪽, 빨강은 꺼리는 쪽** (2026-08-06).
            op.gg 전적 카드의 태그 문법이다. 「당류 상위 20%」와 「당류 하위 20%」가
            같은 파란 배지로 나란히 뜨던 자리 — 낱말을 읽어야만 방향을 알 수 있었다.
            ⚠️ **바뀐 것은 색뿐이고 문구는 여전히 위치 진술이다.** 몸에 좋다/나쁘다를
               말하는 게 아니라 **분포에서 어느 끝인가**까지다 (원칙 7). `/grades` 참조.

            🔴 **회색 배지를 2차 화면에서 전부 걷어냈다** (2026-08-06).
               「원료 N종 불명」·「식물성」·「락토프리」·맛 칩이 여기 있었다.
               색이 축을 나타내지 못하면 배지가 아니라 외워야 할 범례가 된다.
               ⚠️ **제품 상세(3차)에는 그대로 있다.** 지운 게 아니라 옮긴 것이다.

            ❌ 뺀 것 — 「제품명·배합순서 어긋남」(35건). 카드 한 줄로 옮기기엔
               설명이 필요한 값이다. 상세에서 배합 순번과 함께 읽어야 뜻이 선다. */}
        <PriceLine id={p.id} className="mt-1" />

        <div className="mt-2 flex flex-wrap gap-1">
          {/* 🔴 **한 축만 적는다 — 「단백질 A」** (2026-08-07 · 종합 등급 폐기).
              전에는 다섯 축을 합친 「종합 S」가 여기 있었는데, 합친 값은 실측상
              단백질이 아니라 「덜 든 제품」을 위로 올렸다 (폐기 주석 참조).

              🔴 축 이름 없이 등급만 적지 않는다. 「A」 혼자면 제품 판정이 되고,
                 「단백질 A」면 **한 축에서의 위치**라는 사실 진술로 끝난다.
              ⚠️ 목록 카드에 등급을 아예 없애지는 않았다 — 프로틴랩도 목록 카드에
                 축별 등급을 박아 두고, 그게 「목록에서 비교가 된다」는 강점의 정체다
                 (10_작업/08_프로틴랩_벤치마크비교.md). 축을 하나로 줄였을 뿐이다. */}
          {protGrade && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[12px] font-bold ${GRADE_BADGE_CLS[protGrade]}`}
            >
              단백질 {protGrade}
            </span>
          )}
          {/* ❌ **태그 전면 삭제** (2026-08-08 · 팀 지시 「태그는 그냥 전체 삭제 —
              2차든 3차든」). 여기 있던 것: 유당불내증 OK · 식물성 · 당류 0g/많음 ·
              원료 전부 공개.

              🔴 **남긴 것은 「단백질 A」 하나** — 이건 태그가 아니라 **등급 배지**다.
                 목록에서 제품끼리 견주는 장치가 이것뿐이고, 지우면 카드에 비교값이
                 0이 된다 (프로틴랩 벤치마크의 「목록에서 비교가 된다」가 이 자리다).
                 이것까지 빼라는 뜻이었으면 이 블록 위의 protGrade 도 함께 지우면 된다.
              🔴 잣대는 전부 살아 있다 — `health-tags` · `sugarTier` · `opaqueBadge` 는
                 랭킹 조건별 탭(`FIT_CHIPS`)과 검색 필터가 그대로 쓴다. */}
        </div>
      </div>
    </Link>
    </div>
  );
}
