import ReviewCount from "@/components/ReviewCount";

/**
 * 제품 상세 탭 — 화해의 [상품정보] [리뷰/성분] (2026-08-08 · 팀 지시).
 *
 * 🔴 **해시 앵커 + CSS `:target` 이다. JS 가 0 이다.** 상태를 들고 있는 클라이언트
 *    컴포넌트로 만들면 시연 중 하이드레이션을 기다려야 하고, 무엇보다 **리뷰 탭 주소를
 *    공유할 수 없다.** 필터 시트·카테고리 드롭다운이 native 로 도는 것과 같은 결정이다.
 *    (개수 배지 하나만 클라이언트다 — 그마저 없으면 숫자만 안 뜨고 탭은 그대로 돈다.)
 *
 * 🔴 **`?tab=review` 쿼리로 만들면 안 된다** (2026-08-08 · 되돌린 자리).
 *    페이지가 `searchParams` 를 한 번이라도 읽으면 Next 가 그 라우트를 통째로
 *    동적 렌더링으로 돌린다 — 빌드에서 `● /product/[id]` 626쪽 SSG 가 `ƒ` 로 바뀐다.
 *    해시는 서버로 가지 않으므로 SSG 가 유지되면서 주소 공유도 된다.
 *
 * 🔴 **뛰어가는 자리(`#review`)는 이 막대가 아니라 막대 바로 위의 빈 앵커다**
 *    (page.tsx 의 `.ptab-anchor`). 리뷰 패널 자신을 `#review` 로 두었더니 그 패널이
 *    켜지기 전엔 `display:none` 이라 좌표가 (0,0) 이었고 — 제목 밑 별점을 누르면
 *    **제품 맨 위로 튀었다.** 그 자리를 고친 것이다.
 *
 * ⚠️ `<a>` 다. next/link 로 해시만 바꾸면 라우터가 개입한다.
 * ⚠️ 활성 밑줄은 CSS 가 정한다 (globals.css `.ptab`) — 서버는 해시를 모르므로
 *    `aria-current` 를 못 박는다. 대신 두 칸이 무엇인지 sr-only 로 적어 둔다.
 * ⚠️ 「상품정보」의 목적지는 이 막대 자신(`#info`)이다. 해시를 지우는 앵커가 따로 없어
 *    기본 상태로 돌아가려면 **해시가 review 가 아니기만** 하면 된다.
 */
export default function ProductTabs({ id }: { id: string }) {
  return (
    /* 🔴 `grid-cols-2` 다 — `flex-1` 이면 글자 수에 따라 칸 폭이 달라진다.
       「리뷰 1,284」로 숫자가 붙으면 그쪽 칸만 넓어져 스위치가 기울어 보인다.
       밑선은 2px — 켜진 칸의 3px 밑줄이 그 위에 얹혀 한 줄로 읽힌다. */
    <div id="info" className="ptab-bar mt-6 grid grid-cols-2 border-b-2 border-line">
      <a href="#info" data-tab="info" className="ptab focus-ring">
        상품정보
      </a>
      <a href="#review" data-tab="review" className="ptab focus-ring">
        리뷰
        <ReviewCount id={id} />
      </a>
      <span className="sr-only">
        상품정보와 리뷰 두 칸입니다. 기본은 상품정보이고, 리뷰를 누르면 주소 끝에 #review 가
        붙습니다.
      </span>
    </div>
  );
}
