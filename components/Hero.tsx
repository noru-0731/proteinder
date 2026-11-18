import Link from "next/link";
import Icon from "@/components/Icon";

/**
 * 홈 히어로 — 드링크메모 홈의 큰 사진 자리 (2026-08-08 · 팀 지시).
 *
 * 🔴 **배경은 팀 촬영본이다** (`public/hero.jpg` · 원본 `프로틴더 메인 히어로.png`
 *    1896×830 → 1600px q84). 왼쪽이 비어 있고 어두운 사진이라 글자 자리가 이미
 *    마련돼 있다 — 제품 사진 모자이크를 굽던 때처럼 검정 막을 두껍게 씌울 필요가 없다.
 *    ⚠️ 모자이크 스크립트(`10_작업/scripts/make_hero.py`)는 이제 `hero-mosaic.jpg` 로
 *       굽는다. 기본 출력을 안 바꿨으면 다시 돌릴 때 이 사진을 덮어썼다.
 *
 * 🔴 **주 CTA 는 「제품 찾아보기」 하나다.** 드링크메모는 취향 테스트를 대문에 세웠지만
 *    우리 `/match` 는 화면에 「성분·건강 적합성과 무관」이라고 우리 손으로 적어 둔
 *    놀이라, 대문 버튼으로 세우면 서비스 정체가 흔들린다.
 *
 * ❌ 매칭 링크 삭제 (2026-08-08 · 팀 지시). 히어로에 작은 줄로 달려 있었다.
 *    ⚠️ **그 줄이 `/match` 의 유일한 진입점이었다** — 헤더 탭에 매칭을 넣지 않으면
 *       80조합 매칭 화면이 통째로 고아가 된다 (사전이 겪었던 것과 같은 자리).
 *
 * ⚠️ 사진 위 글자라 대비를 색으로 못 잡는다. 사진 왼쪽이 이미 어둡지만 폭이 넓어지면
 *    밝은 쪽이 글자 뒤로 들어오므로 가로 그러데이션을 한 겹 얹는다.
 */
export default function Hero() {
  return (
    <div className="px-5 pt-4">
      <section className="relative isolate overflow-hidden rounded-[12px] bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 한 장. next/image 최적화가 필요 없다 */}
        <img
          src="/hero.jpg"
          alt=""
          aria-hidden
          /* ⚠️ 사진이 2.28:1 인데 틀은 그보다 세로가 길다 — 데스크톱은 위아래만 잘린다.
             모바일(1.44:1)은 **좌우가 잘려** 가운데 정렬이면 제품이 글자 뒤로 온다.
             왼쪽 38% 를 잡아 글자 바닥은 어둡게 두고 제품은 살짝만 보이게 한다. */
          className="h-[248px] w-full object-cover object-[38%_center] sm:h-[300px] lg:h-[420px] lg:object-center"
        />
        {/* 사진 왼쪽이 이미 어둡다 — 막을 얇게 얹어 넓은 화면에서만 보정한다 */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-12">
          <p className="text-[11px] font-bold tracking-[0.16em] text-flame-soft">PROTEINDER</p>
          {/* 🔴 문구 교체 (2026-08-08 · 팀 지시). 「성분표를 봐도 모르겠다면 /
              원재료부터 펼쳐서 봅니다」에서 바꿨다 — 틴더 어법을 앞세운 것이다.
              ⚠️ 팀이 준 대안: 「취향은 가볍게, 성분은 꼼꼼하게」. 두 줄 다 쓰면 같은
                 말을 두 번 하는 꼴이라 하나만 세웠다 — 바꾸려면 이 두 줄만 갈면 된다. */}
          <h1 className="kr mt-2.5 max-w-[19ch] text-[24px] leading-[1.32] font-bold text-white sm:text-[28px] lg:text-[32px]">
            첫눈에 끌려도,
            <br />
            성분은 보고 만나자
          </h1>
          <p className="kr mt-3 max-w-[30ch] text-[12.5px] leading-[1.7] text-white/80 sm:text-[13.5px]">
            단백질·당류·칼로리·원재료까지 비교하고
            <br />내 기준에 맞는 프로틴을 찾아보세요
          </p>
          <Link
            href="/products"
            className="focus-ring mt-5 inline-flex w-max items-center gap-1.5 rounded-[9px] bg-flame-deep px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-flame"
          >
            제품 찾아보기
            <Icon name="chevron-right" size={16} />
          </Link>
          {/* ❌ 매칭 링크 삭제 (팀 지시) — 위 주석의 고아 경고 참조 */}
        </div>
      </section>
    </div>
  );
}
