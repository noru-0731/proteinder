import Link from "next/link";
import ComparePicker from "@/components/ComparePicker";
import CompareStarters from "@/components/CompareStarters";
import CompareFromLikes from "@/components/CompareFromLikes";
import CompareRating from "@/components/CompareRating";
import CompareShape from "@/components/CompareShape";
import CartButton from "@/components/CartButton";
import Icon from "@/components/Icon";
import { similarTo } from "@/lib/similar";
import { nutritionStandings, type Grade } from "@/lib/nutrition-grades";
import { catLabel, findProduct, type Product } from "@/lib/data";
import { ALL_SAMPLE, CATEGORIES, sampleOf } from "@/lib/categories";
import { priceOf } from "@/lib/cart";
import { topic } from "@/lib/josa";
import { summaryOf } from "@/lib/summary";
import {
  CIRCLE,
  COMPARE_ROWS,
  GROUPS,
  MAX_COMPARE,
  allSame,
  deltaOf,
  diffOf,
  fmtNum,
  type CompareRow,
} from "@/lib/compare";

export const metadata = { title: "비교 — 프로틴더" };

/**
 * 비교 탭 — **이 서비스의 본체**다 (2026-08-08 개편).
 *
 * 이 도메인에서 비교가 어려운 이유 셋을 각각 푼다 —
 *   ① 카테고리마다 기준 단위가 다르다 (1병 vs 1회분 30g)
 *      → 섞이면 경고를 띄우고 **차이 계산을 끈다.** 다른 자로 잰 값을 빼면 안 된다.
 *   ② 항목이 열 개가 넘는다
 *      → **절 넷으로 묶고**(살 때 · 영양 · 원재료 · 가려 먹는다면) 열 머리를 붙박는다.
 *   ③ 궁금한 건 값이 아니라 **어디서 갈리는가**다
 *      → 표 위에 「여기가 갈립니다」를 세운다.
 *
 * ── 실측한 비교 UI 셋에서 가져온 것 (2026-08-08) ─────────────────────────
 *   Apple 「모델 비교하기」  `.compare-section` 49개 · **첫 절이 「요약」** ·
 *                          선택기 `position:sticky top:-71px` · 가격 `fixed top:71px` ·
 *                          열 머리가 **제품 교체 드롭다운**
 *      → 표 맨 위 요약 절 · 절 묶음 · 열 머리 붙박이를 옮겼다.
 *   다나와 검색결과          목록 행마다 비교 체크박스 **161개** · 하단 `.box__compare` 트레이 ·
 *                          트레이 탭에 **「많이 비교한 상품」**
 *      → 「비교는 목적지가 아니라 훑는 중에 쌓이는 것」. 빈 화면의 시작 세트가 그 자리다.
 *   Rtings · Versus         점수표보다 **위에** "which should you get" 한 문단
 *      → 자리는 옮기되 **문장 종류는 안 옮겼다** — 우리는 「낫다」를 못 쓴다 (원칙 7).
 *
 * ⚠️ **다나와의 「제품별 비교 분석」 기획전은 표가 0개다** (`plan.danawa.com` 실측 —
 *    「하이뮨 프로틴 제품별 비교 분석」이 실제로는 할인 상품 나열이다). 국내 최대
 *    가격비교도 단백질 제품을 성분으로 견주지는 않는다.
 *
 * 🔴 **토글이 URL 파라미터다. JS 가 0 이다.** 상태를 들고 있는 클라이언트로 만들면
 *    비교 결과를 주소로 공유할 수 없다 — 그게 이 탭의 절반이다.
 * 🔴 **승자를 칠하지 않는다** (원칙 7). 차이는 적되 어느 쪽이 좋다고 말하지 않는다.
 */
type SP = Promise<{ ids?: string; a?: string; b?: string; diff?: string; delta?: string }>;

/* 🔴 **열 머리를 붙박는 높이** — sticky 헤더를 실측한 값이다 (1280px 에서 122px).
   Apple 도 선택기를 `sticky top:-71px` 로 붙박는다. 4열 표를 스크롤하면
   어느 열이 어느 제품인지 잃는데, 그 순간 표는 숫자 더미가 된다.
   ⚠️ `overflow-x-auto` 는 세로도 스크롤 컨테이너로 만들어 sticky 가 죽는다 —
      그래서 데스크톱에서만 `overflow-x-visible` 로 풀고 붙박는다.
   ⚠️ **바깥 상자에 `overflow-hidden` 을 주면 안 된다.** 둥근 모서리를 잘라내려고
      한 번 줬다가 붙박이가 통째로 죽었다 — 그것도 스크롤 컨테이너다. 모서리는
      귀퉁이 칸을 각각 둥글려서 낸다.
   ⚠️ 헤더 높이가 바뀌면 이 값도 바꿔야 한다. `style` 로 주는 이유는 Tailwind 임의값이
      아니라 **한 곳에서만 고치게** 하기 위해서다 (position 이 없으면 top 은 무시된다). */
const STICKY_TOP = { top: "122px" } as const;

/* 🔴 격자 — 다나와 VS 실측(라벨 배경 #fcfcfc · 값 칸 border-left 1px #e5e5e5)을 옮긴 것.
   ⚠️ 라벨 칸은 좁은 화면에서 **왼쪽에 붙박는다.** 가로로 밀면 「이 숫자가 무슨 값인지」가
      먼저 화면 밖으로 나가 버린다. lg 부터는 가로 스크롤이 없어 저절로 꺼진다
      (`max-lg:` 로 묶어 데스크톱에서 뷰포트 왼쪽에 달라붙는 사고를 막는다). */
const LABEL_CELL =
  "max-lg:sticky max-lg:left-0 max-lg:z-[5] bg-bg p-3 text-left text-[12px] font-semibold";
const VALUE_CELL = "border-l border-line p-3 text-center";

/* 🔴 막대 색 = 등급 사다리 (배지·오각형과 같은 것). **채움 강도가 위계**다.
   회색 막대는 「대조가 있는지 없는지 모르겠다」는 지적을 받았다 — 길이만으로는
   두 칸의 차이가 눈에 안 들어온다. 색이 붙으면 길이를 재기 전에 갈린다. */
const BAR_CLS: Record<Grade, string> = {
  A: "bg-grade-strong",
  B: "bg-grade-strong/45",
  C: "bg-caution-ink/45",
  D: "bg-danger-strong",
};
/* 막대 끝 글자 — 채운 칩이 아니라 글자다. 칩은 숫자 옆에서 시선을 빼앗았다 */
const GRADE_TEXT_CLS: Record<Grade, string> = {
  A: "text-grade-strong",
  B: "text-grade-ink",
  C: "text-caution-ink",
  D: "text-danger-ink",
};

export default async function ComparePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  /* 🔴 **`?a=&b=` 를 같이 받는다** (2026-08-08 버그 수정). 제품 상세의 「비슷한 제품 →
     대조」 버튼이 ver1 문법인 `?a=X&b=Y` 로 링크하는데 이 쪽은 `ids=` 만 읽고 있어서,
     **비교 탭으로 들어오는 가장 흔한 길이 통째로 빈 화면이었다.** 상세를 이식하며
     링크만 따라오고 파라미터 이름이 바뀐 자리다 — 프로덕션에서 재현했다.
     ⚠️ 상세 쪽 링크를 고치는 것으로는 부족하다. 이미 나간 주소가 살아 있어야 한다. */
  const raw = sp.ids ?? [sp.a, sp.b].filter(Boolean).join(",");
  const ids = raw
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  const picked = ids.map((id) => findProduct(id)).filter(Boolean) as Product[];

  /* 🔴 **「접기」를 버리고 「강조」로 갈아탔다** (2026-08-08 · 다나와 VS검색 실측).
     다나와 `vssearch` 는 값이 다른 행에 `highlight-item` 클래스를 붙여 **파랑 + 굵게**
     (#2070eb · 600) 로 들고, 같은 값은 먹색 보통(#333)으로 **그대로 둔다.**
     기본이 켜짐이다 (`diffToggleChk` checked · 10행 중 4행이 강조).

     우리는 반대로 하고 있었다 — 같은 값 행을 **지웠다.** 그래서 두 제품의 단백질이
     같으면 단백질 행이 통째로 사라졌다(잇츠프로틴 초코 vs 그레인 실측). 사라진 정보는
     못 읽지만, 흐린 정보는 읽을 수 있다. 지우는 쪽이 늘 나쁘다.
     ⚠️ 옛 주소 `?same=1`(접기)·`?same=0` 은 그냥 무시된다 — 접기 자체가 없어졌다.
     ⚠️ 강조색은 **열마다 같다.** 승자만 칠하면 그게 판정이다 (원칙 7) —
        「여기가 갈린다」까지가 색이 하는 말이다. */
  const highlight = sp.diff !== "0";
  const asDelta = sp.delta === "1";

  const cats = new Set(picked.map((p) => p.cat));
  const mixed = cats.size > 1;
  /* 카테고리가 섞이면 차이를 계산하지 않는다 — 다른 자로 잰 값이다 */
  const delta = asDelta && !mixed;
  const diff = mixed ? null : diffOf(picked);

  const list = ALL_SAMPLE.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand ?? null,
    cat: catLabel(p.cat),
  }));

  /* 빈 화면에 놓을 시작 세트 — 카테고리마다 랭킹 상위 셋을 그대로 담는다.
     표본이 셋도 안 되는 카테고리는 아예 안 만든다 (「비교」인데 하나만 뜨면 말이 안 된다) */
  const starters = CATEGORIES.filter((c) => c.data)
    .map((c) => {
      const top = sampleOf(c.key).slice(0, 3);
      return {
        key: c.key,
        label: c.label,
        serving: c.serving,
        items: top.map((p) => ({ id: p.id, name: p.name, img: p.img ?? null })),
      };
    })
    .filter((s) => s.items.length >= 3);

  const qs = (o: Record<string, string>) => {
    const u = new URLSearchParams();
    if (ids.length) u.set("ids", ids.join(","));
    if (!highlight) u.set("diff", "0");
    if (asDelta) u.set("delta", "1");
    for (const [k, v] of Object.entries(o)) {
      if (v) u.set(k, v);
      else u.delete(k);
    }
    return `/compare?${u}`;
  };

  /* ⚠️ 가격은 한 열도 없으면 뺀다 — 바로 아래 담기 자리가 「가격 미확인」이라고 이미
     적는다. 「—」 넉 줄과 「가격 미확인」 넉 줄이 위아래로 겹쳐 있었다.
     그 밖에는 **아무 행도 지우지 않는다** (위 「접기 폐기」 주석). */
  const visible = COMPARE_ROWS.filter(
    (row) => row.key !== "price" || picked.some((p) => row.get(p) != null),
  );

  /* 🔴 **비교에 더 담을 만한 제품** (2026-08-08 · 팀 지적 「표준화된 세트가 아니라
     추천이었으면」). 다나와 VS 는 빈 칸에 「상품추가」 점선 슬롯을 두고 최대 5개까지
     받는다 — 우리는 그 슬롯을 **비워 두지 않고** 제안으로 채운다.
     ⚠️ 지어낸 추천이 아니다. 제품 상세의 「비슷한 제품」과 **같은 함수**(similarTo —
        1회 기준 다섯 축 거리)라 두 화면이 같은 말을 한다.
     ⚠️ 이미 담긴 것과 카테고리가 섞이는 것은 뺀다 — 담는 순간 표의 차이 계산이 꺼진다. */
  const cols = picked.length + 1; // +1 = 왼쪽 라벨 칸

  const suggestBase = picked[picked.length - 1];
  const suggestions =
    picked.length > 0 && picked.length < MAX_COMPARE && !mixed
      ? similarTo(suggestBase, 12)
          .filter((s) => !ids.includes(s.id) && s.cat === suggestBase.cat)
          .slice(0, 3)
      : [];

  return (
    /* 🔴 셸을 랭킹 탭에 맞췄다 (2026-08-08). 이 쪽만 ver1 자리(`container-page
       lg:px-24` · 제목 26px 먹색)를 쓰고 있어 **같은 헤더 아래 다른 앱처럼** 보였다 —
       실측 x=136 vs 랭킹 x=20. 제목도 28px 시그니처색으로 통일한다. */
    <div className="px-5 pt-6 pb-10">
      <h1 className="kr text-[28px] leading-[1.25] font-semibold text-flame">비교</h1>
      <p className="kr mt-1 max-w-[640px] text-[12.5px] leading-[1.6] text-ink-dim">
        최대 {MAX_COMPARE}개를 한 표에 놓고 같은 자로 잽니다. 값은 전부 신고값이고, 어느
        쪽이 좋다고 표시하지 않습니다 — 무엇이 중요한지는 목적마다 다릅니다.
      </p>

      <div id="pick" className="mt-4 flex scroll-mt-[140px] flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 basis-[360px]">
          <ComparePicker all={list} ids={ids} />
        </div>
        {/* 찜콩에 둘 이상 담겨 있으면 그대로 표로 — 이 화면에 오기 전에 이미 고른 것들이다 */}
        <CompareFromLikes />
      </div>

      {/* 🔴 **추천을 표 안이 아니라 담는 칸 바로 밑에 둔다** (2026-08-08 · 표 구조 개편).
          전에는 표의 마지막 열에 점선 「+ 제품 추가」 카드를 세웠는데, 그 열이 본문
          행까지 이어져 **값이 하나도 없는 빈 열**이 표 끝에 죽 늘어섰다 — 제품이 하나
          더 있는데 데이터가 없는 것처럼 보였다.
          다나와도 카드 줄과 스펙 표가 따로다. 담는 일은 담는 칸 옆에서 하는 것이 맞다. */}
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[12px] text-ink-dim">견줄 만한 제품</span>
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={qs({ ids: [...ids, s.id].join(",") })}
              title={s.name}
              className="focus-ring kr max-w-[220px] truncate rounded-full border border-line-strong px-2.5 py-1 text-[12px] text-ink-sub transition-colors hover:border-flame-deep hover:text-flame-deep"
            >
              + {s.name}
            </Link>
          ))}
          <span className="text-[11.5px] text-ink-dim">최대 {MAX_COMPARE}개</span>
        </div>
      )}

      {picked.length === 0 ? (
        /* 빈 화면을 **시작하는 자리**로 (다나와 트레이의 「많이 비교한 상품」 자리).
           ⚠️ 세트는 지어낸 추천이 아니다 — 그 카테고리 랭킹 상위 셋을 그대로 담는다. */
        <div className="mt-6">
          <CompareStarters sets={starters} />
          <p className="mt-5 text-center text-[12.5px] text-ink-dim">
            제품 상세의 「비슷한 제품」에서 「대조」를 눌러 들어올 수도 있습니다.
          </p>
        </div>
      ) : (
        <>
          {mixed && (
            <p className="kr mt-5 rounded-[10px] border-l-[3px] border-red bg-flame-wash px-4 py-3 text-[12.5px] leading-[1.65] text-ink">
              카테고리가 섞여 있습니다 — {[...cats].map(catLabel).join(" · ")}. 기준량이
              달라(1병 vs 1회분 30g) 숫자를 그대로 견줄 수 없어 차이 계산을 끕니다.
            </p>
          )}

          {picked.length === 1 && (
            <p className="kr mt-5 rounded-[10px] bg-bg px-4 py-3 text-[12.5px] leading-[1.65] text-ink-sub">
              하나만 담겨 있습니다. 위 칸에서 제품을 하나 더 찾아 담으면 차이가 표시됩니다.
            </p>
          )}

          {diff && <DiffBox diff={diff} picked={picked} />}

          {/* 토글 둘 — 링크라 JS 가 없다. 다나와 VS 도 표 위 왼쪽에 「차이점 강조」를 둔다 */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Toggle
              on={highlight}
              href={qs({ diff: highlight ? "0" : "" })}
              label="같은 값 흐리게"
              disabled={picked.length < 2}
            />
            <Toggle
              on={delta}
              href={qs({ delta: asDelta ? "" : "1" })}
              label={`①과의 차이로 보기${mixed ? " (섞여서 꺼짐)" : ""}`}
              disabled={mixed || picked.length < 2}
            />
          </div>

          {/* ⚠️ 데스크톱에서는 가로 스크롤을 풀어야 sticky 열 머리가 산다 (위 STICKY_TOP 주석) */}
          {/* 🔴 **표를 표처럼 묶는다** (2026-08-08 · 팀 지시 「표로 묶는다던지」 · 다나와 VS 실측).
              다나와 VS 표는 값 칸마다 `border-left: 1px #e5e5e5` 가 있고 라벨 칸에
              `#fcfcfc` 배경이 깔린다 (라벨 150 · 값 290 · 행 높이 64). 우리 표는
              **세로선이 0개**여서 값이 흰 바탕에 떠 있었다 — 4열이 되면 어느 숫자가
              어느 제품 것인지 눈으로 줄을 그어야 했다.
              바깥 테두리로 한 번 감싸고, 라벨 칸에 배경을 주고, 값 칸마다 세로선을 넣는다. */}
          <div className="mt-4 rounded-[10px] border border-line-strong">
            <div className="overflow-x-auto lg:overflow-x-visible">
              {/* 모서리는 귀퉁이 칸을 둥글려 낸다 — 바깥에 overflow-hidden 을 주면 sticky 가 죽는다 */}
              <table className="w-full min-w-[600px] border-collapse text-[13px] [&>tbody>tr:last-child>th]:rounded-bl-[9px] [&>thead>tr:first-child>th:first-child]:rounded-tl-[9px]">
              <thead>
                {/* 🔴 **열 머리를 두 줄로 갈랐다** (2026-08-08).
                    사진까지 든 머리를 통째로 붙박았더니 높이가 300px 이라 **스크롤하면
                    「요약」·「살 때」 두 절을 통째로 덮었다** (실화면에서 잡음).
                    ① 사진 줄은 안 붙박고, ② 번호+이름만 든 얇은 줄(38px)을 붙박는다.
                    Apple 도 붙박는 것은 사진이 아니라 71px 짜리 선택기 줄이다. */}
                <tr>
                  <th className="w-[140px] bg-bg" />
                  {picked.map((p, i) => (
                    <th key={p.id} className="border-l border-line bg-card p-3 align-top">
                      <Link href={`/product/${p.id}`} className="focus-ring block rounded">
                        <span className="mx-auto block size-[72px] overflow-hidden rounded-[10px] bg-card">
                          {p.img && (
                            // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
                            <img src={p.img} alt="" className="size-full object-contain" />
                          )}
                        </span>
                        <span className="kr mt-2 block text-[12.5px] leading-[1.4] font-semibold text-ink">
                          {/* 🔴 번호를 **항상** 붙인다. 차이 요약이 「②가 …」라고 적는데
                              번호가 차이 보기에서만 뜨면 그 문장이 가리킬 데가 없다 */}
                          <span className="mr-0.5 text-flame-deep">{CIRCLE[i]}</span>
                          {p.name}
                        </span>
                      </Link>
                      <span className="mt-1 block text-[11px] leading-[1.4] text-ink-dim">
                        {p.packLabel} 기준
                      </span>
                      <Link
                        href={qs({ ids: ids.filter((x) => x !== p.id).join(",") })}
                        aria-label={`${p.name} 빼기`}
                        className="focus-ring mt-1.5 inline-flex items-center gap-0.5 rounded-full border border-line-strong px-2 py-0.5 text-[11px] font-medium text-ink-dim transition-colors hover:border-red hover:text-red"
                      >
                        <span aria-hidden>×</span> 빼기
                      </Link>
                    </th>
                  ))}
                </tr>
                {/* 🔴 붙박이는 것은 **이 얇은 줄**이다 — 스크롤 중 「어느 열이 누구인지」만 남긴다 */}
                <tr>
                  <th
                    style={STICKY_TOP}
                    className="bg-bg px-3 py-2 text-left text-[11.5px] font-semibold text-ink-dim shadow-[inset_0_-1px_0_var(--line-strong)] lg:sticky lg:z-10"
                  >
                    항목
                  </th>
                  {picked.map((p, i) => (
                    <th
                      key={p.id}
                      style={STICKY_TOP}
                      /* ⚠️ 붙박인 칸에는 `border-collapse` 테두리가 안 따라온다 —
                         밑선을 `inset` 그림자로 그린다 */
                      className="border-l border-line bg-card px-2 py-2 text-center shadow-[inset_0_-1px_0_var(--line-strong)] lg:sticky lg:z-10"
                    >
                      <span className="kr block truncate text-[11.5px] leading-[1.4] font-medium text-ink-sub">
                        <span className="mr-0.5 font-bold text-flame-deep">{CIRCLE[i]}</span>
                        {p.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 🔴 **첫 절이 「요약」이다** — Apple 비교표와 같은 자리. 스펙을 읽기 전에
                    「이 제품이 무엇인가」가 한 줄로 온다. 문장은 제품 상세가 쓰는
                    summaryOf 그대로라 두 화면이 어긋날 수 없다. */}
                {picked.some((p) => summaryOf(p)) && (
                  <>
                    <GroupHead label="요약" span={cols} />
                    <tr className="border-b border-line">
                      <th className={`${LABEL_CELL} align-top`}>한 줄</th>
                      {picked.map((p) => (
                        <td key={p.id} className={`${VALUE_CELL} align-top`}>
                          <span className="kr block text-left text-[12px] leading-[1.65] text-ink-sub">
                            {summaryOf(p) ?? "—"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {GROUPS.map((g) => {
                  const rows = visible.filter((r) => r.group === g);
                  if (!rows.length) return null;
                  return (
                    <GroupBody
                      key={g}
                      label={g}
                      rows={rows}
                      picked={picked}
                      delta={delta}
                      mixed={mixed}
                      highlight={highlight}
                      cols={cols}
                      /* 🔴 영양 절 맨 앞에 **오각형 줄** (팀 지시 「다른 도형이나 지표」).
                         숫자 행은 가로로는 읽히는데 세로로는 안 읽힌다 — 「이 제품이
                         어떤 물건인가」는 다섯 축을 한꺼번에 봐야 나온다. */
                      head={
                        g === "1회 섭취 영양" ? (
                          <tr className="border-b border-line">
                            <th className={`${LABEL_CELL} align-top text-ink-sub`}>
                              성분 밸런스
                              <span className="kr mt-1 block text-[10.5px] leading-[1.45] font-normal text-ink-dim">
                                12시부터 시계방향으로 단백질·칼로리·당류·탄수화물·지방.
                                점선은 나머지 제품입니다.
                              </span>
                            </th>
                            {picked.map((p) => (
                              <td key={p.id} className={`${VALUE_CELL} align-middle`}>
                                <CompareShape
                                  p={p}
                                  others={picked.filter((o) => o.id !== p.id)}
                                />
                              </td>
                            ))}
                                </tr>
                        ) : null
                      }
                      /* 🔴 담기 버튼을 표 맨 아래에서 **「살 때」 절 안으로** 옮겼다
                         (2026-08-08). 밑에 떨어져 있으면 「가격 —」 행과 「가격 미확인」
                         버튼 자리가 표의 위아래로 갈라져 같은 말을 두 번 한다.
                         Apple 도 「구입하기」를 스펙 앞쪽에 둔다. */
                      tail={g === "살 때" ? <BuyRow picked={picked} /> : null}
                    />
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>

          <p className="kr mt-4 text-[11.5px] leading-[1.7] text-ink-dim">
            {/* 🔴 색을 늘렸으니 무엇을 뜻하는지 그만큼 정확히 적는다 (원칙 7) */}
            막대와 A~D는 <b className="font-semibold">제품마다 자기 카테고리 분포</b>에서의
            위치입니다 — <b className="font-semibold">길수록 「흔히 반기는 쪽」에 가깝고</b>,
            축마다 방향이 이미 들어 있어 <b className="font-semibold">칼로리·당류는 낮을수록
            깁니다</b>.{" "}
            {!mixed && (
              <>
                <span className="rounded bg-flame-wash px-1 font-semibold text-ink">연분홍 칸</span>
                은 그 줄에서 그 끝에 가장 가까운 값입니다 — A~D 등급과{" "}
                <b className="font-semibold">같은 말</b>이고, 좋은 제품이라는 뜻이 아닙니다.{" "}
              </>
            )}
            {highlight && picked.length >= 2 && (
              <>흐린 행은 열끼리 값이 같은 자리입니다. </>
            )}
            오각형은 바깥일수록 흔히 반기는 쪽입니다{delta ? " (▴▾는 ①과의 차이)" : ""}.{" "}
            <Link href="/grades" className="text-flame-deep underline underline-offset-2">
              등급 기준 보기
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   「여기가 갈립니다」 — Rtings·Versus 가 점수표 **위에** 두는 자리.
   ⚠️ 자리만 옮기고 문장은 안 옮겼다. 저쪽은 "why X is better", 우리는
      「어디서 값이 갈리는가」다 (원칙 7).
   ══════════════════════════════════════════════════════════════════════ */
function DiffBox({
  diff,
  picked,
}: {
  diff: NonNullable<ReturnType<typeof diffOf>>;
  picked: Product[];
}) {
  const two = picked.length === 2;
  const top = diff.axes.slice(0, two ? 2 : 3);

  if (!top.length)
    return (
      <p className="kr mt-5 rounded-[10px] bg-bg px-4 py-3 text-[12.5px] leading-[1.65] text-ink-sub">
        고른 제품의 신고 영양성분이 다섯 축 모두 같은 값입니다.
      </p>
    );

  return (
    <div className="mt-5 rounded-[10px] border border-line-strong bg-card px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        <Icon name="chevron-right" size={15} className="text-flame" />
        여기가 갈립니다
      </p>
      <p className="kr mt-1.5 text-[13px] leading-[1.75] text-ink-sub">
        {/* 🔴 「가장 적은 쪽 ②」 같은 꼬리를 안 붙인다 — 어느 끝을 부르느냐가 곧
            방향이다. 셋 이상은 phrase 가 이미 양끝을 「②0g ~ ③6.5g」로 적는다 */}
        {top.map((a, i) => (
          <span key={a.key}>
            {i > 0 && (two ? "고, " : " · ")}
            <b className="font-semibold text-ink">{a.phrase}</b>
          </span>
        ))}
        {two && "."}
      </p>
      {diff.same.length > 0 && (
        /* ⚠️ 조사는 lib/josa.ts — 「지방**은**」·「칼로리**는**」이 갈린다 */
        <p className="kr mt-1 text-[12px] leading-[1.6] text-ink-dim">
          {diff.same.join(" · ")}
          {topic(diff.same[diff.same.length - 1])} 값이 같습니다.
        </p>
      )}
    </div>
  );
}

/**
 * 절 머리 — Apple 비교표의 `.compare-section` 제목 자리.
 * 🔴 표를 테두리로 감싸면서 **띠**가 됐다. 전에는 표 밖에 뜬 글자처럼 보여
 *    「여기부터 다른 묶음」이라는 뜻이 안 섰다.
 */
function GroupHead({ label, span }: { label: string; span: number }) {
  return (
    <tr>
      <th
        colSpan={span}
        className="border-y border-line bg-bg px-3 py-2 text-left text-[12px] font-bold tracking-[0.02em] text-flame-deep"
      >
        {label}
      </th>
    </tr>
  );
}

/** 「살 때」 절의 마지막 줄 — 값이 아니라 행동이라 라벨 칸을 비운다 */
function BuyRow({ picked }: { picked: Product[] }) {
  return (
    <tr className="border-b border-line">
      <th className={`${LABEL_CELL} align-middle text-ink-sub`}>담기</th>
      {picked.map((p) => {
        const pr = priceOf(p.id);
        return (
          <td key={p.id} className={`${VALUE_CELL} align-middle`}>
            {pr ? (
              <CartButton
                line={{ id: p.id, name: p.name, img: p.img ?? null, won: pr.won, title: pr.title }}
              />
            ) : (
              <span className="text-[11.5px] text-ink-dim">가격 미확인</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function GroupBody({
  label,
  rows,
  picked,
  delta,
  mixed,
  highlight,
  cols,
  head,
  tail,
}: {
  label: string;
  rows: CompareRow[];
  picked: Product[];
  delta: boolean;
  mixed: boolean;
  highlight: boolean;
  cols: number;
  head?: React.ReactNode;
  tail?: React.ReactNode;
}) {
  return (
    <>
      <GroupHead label={label} span={cols} />
      {head}
      {rows.map((row) => {
        const vals = picked.map((p) => row.get(p));
        /* 🔴 **다나와는 다른 값을 「들고」, 우리는 같은 값을 「내린다」** (2026-08-08 · 실화면).
           다나와 VS 는 10행 중 4행만 갈려서 그 넷을 파랑으로 들면 눈에 띈다. 우리는
           영양 신고값이라 **9행 중 7행이 갈린다** — 그걸 다 칠했더니 화면이 통째로
           분홍이 되어 강조가 강조가 아니었다 (실측).
           목적은 같다: **눈이 갈리는 자리로 가게 한다.** 우리 데이터에서는 같은 값을
           흐리게 내리는 쪽이 같은 일을 하고, 색을 하나도 늘리지 않는다.
           ⚠️ 별점은 서버가 값을 모르니(Supabase) 갈리는지도 모른다 — 대상이 아니다. */
        const same = highlight && row.key !== "rating" && picked.length >= 2 && allSame(vals);
        /* 🔴 막대는 **이 표 안에서의 상대 크기**다 — 분포도 방향도 끌어오지 않는다.
           화면에 이미 적힌 숫자끼리의 나눗셈이라 새로 주장하는 것이 없다.
           4열이 되면 숫자만으로는 큰지 작은지가 눈에 안 들어온다 (Rtings 의 막대 자리). */
        /* 🔴 **막대 = 분포 점수**, 그리고 그 줄에서 가장 앞선 칸을 표시한다
           (2026-08-08 · 팀 지적 「뭐가 우위인지 잘 안 보입니다」).

           우리는 「좋은 제품」이라고 말하지 않는다. 하지만 **축마다 어느 쪽이 흔히
           반기는 쪽인지는 이미 정해 놓았다** — A~D 등급이 그 말이고 /grades 에
           「A 는 흔히 반기는 쪽」이라고 적어 두었다. 그러니 그 줄에서 그 끝에 가장
           가까운 칸을 표시하는 것은 **새 판정이 아니라 이미 한 진술을 보이게 하는 것**이다.
           ⚠️ 문구는 「가장 좋음」이 아니라 「흔히 반기는 쪽에 가장 가까움」이다.
           ⚠️ 카테고리가 섞이면 표시하지 않는다 — 서로 다른 분포의 점수다.
           ⚠️ 동점이면 둘 다 표시한다. 순위를 만들지 않는다. */
        const scores =
          row.axis && !mixed
            ? picked.map(
                (p) => nutritionStandings(p).find((a) => a.key === row.axis)?.score ?? null,
              )
            : [];
        const valid = scores.filter((s): s is number => s != null && s > 0);
        /* 🔴 **동점 판정은 「화면에 적힌 값」으로 한다** (2026-08-08 · 실화면에서 잡음).
           score 원값으로 고르면 단백질 22.04 와 21.96 이 갈려 **둘 다 「22 g」이라
           적혀 있는데 한쪽만 칠해졌다.** 읽는 사람에게 그건 우리가 틀린 것이다. */
        const shown = picked.map((_, i) =>
          typeof vals[i] === "number" ? fmtNum(vals[i] as number, row.unit) : null,
        );
        const topScore = valid.length >= 2 && new Set(valid).size > 1 ? Math.max(...valid) : null;
        const bestShown =
          topScore != null ? (shown[scores.findIndex((s) => s === topScore)] ?? null) : null;
        return (
          <tr key={row.key} className="border-b border-line">
            <th
              className={`${LABEL_CELL} align-middle ${same ? "text-ink-dim" : "text-ink-sub"}`}
            >
              {row.label}
              {/* 같은 값 행은 왜 흐린지 한 번 말해 준다 — 흐린 것이 「없음」으로 안 읽히게 */}
              {same && (
                <span className="mt-0.5 block text-[10.5px] font-normal text-ink-dim">
                  값이 같음
                </span>
              )}
            </th>
            {picked.map((p, i) => {
              const lead = bestShown != null && shown[i] === bestShown;
              return (
                <td
                  key={p.id}
                  /* 앞선 칸에 옅은 배경 — 각주가 「등급과 같은 말」이라고 밝힌다 */
                  className={`${VALUE_CELL} align-middle ${lead ? "bg-flame-wash" : ""}`}
                  title={lead ? "이 줄에서 흔히 반기는 쪽 끝에 가장 가깝습니다" : undefined}
                >
                  <Cell
                    row={row}
                    p={p}
                    v={vals[i]}
                    base={vals[0]}
                    delta={delta && i > 0}
                    score={scores[i] ?? null}
                    same={same}
                  />
                </td>
              );
            })}
          </tr>
        );
      })}
      {tail}
    </>
  );
}

function Toggle({
  on,
  href,
  label,
  disabled,
}: {
  on: boolean;
  href: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled)
    return (
      <span className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] text-ink-dim">
        {label}
      </span>
    );
  return (
    <Link
      href={href}
      aria-pressed={on}
      className={`focus-ring rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
        on
          ? "bg-flame-deep text-white"
          : "border border-line-strong text-ink-sub hover:border-flame-deep hover:text-flame-deep"
      }`}
    >
      {on ? "✓ " : ""}
      {label}
    </Link>
  );
}

function Cell({
  row,
  p,
  v,
  base,
  delta,
  score,
  same,
}: {
  row: CompareRow;
  p: Product;
  v: number | string | boolean | null;
  base: number | string | boolean | null;
  delta: boolean;
  /** 분포 점수 0~1 · 1이 흔히 반기는 쪽 끝. 막대 길이가 된다 */
  score: number | null;
  same: boolean;
}) {
  if (row.key === "rating") return <CompareRating id={p.id} />;

  /* 같은 값이면 한 단 내린다. 갈리는 값이 기본색이고, 그게 이 표의 대부분이다.
     ⚠️ 열마다 **똑같이** 내린다 — 어느 한 열만 다르게 칠하면 그게 판정이다 (원칙 7). */
  const tone = same ? "text-ink-dim" : "text-ink";

  if (row.kind === "mark")
    return v ? (
      <span className={`text-[14px] font-bold ${same ? "text-ink-dim" : "text-flame-deep"}`}>✓</span>
    ) : (
      <span className="text-ink-dim">—</span>
    );

  if (v == null) return <span className="text-ink-dim">—</span>;

  if (row.kind === "num") {
    const d = delta ? deltaOf(v as number, base as number | null) : null;
    const g = row.grade?.(p) ?? null;
    /* 🔴 막대 길이 = **분포 점수**(1이 흔히 반기는 쪽 끝). 값이 아니다 —
       값으로 그리면 칼로리 180kcal 이 가장 긴 막대가 되어 거꾸로 읽힌다. */
    const pct = score != null && score > 0 ? Math.max(3, Math.round(score * 100)) : null;
    return (
      <span className="inline-block w-full max-w-[168px]">
        <span className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 tabular-nums">
          <b className={`text-[15px] font-semibold ${tone}`}>{fmtNum(v as number, row.unit)}</b>
          {d != null && (
            /* 🔴 회색이다. 색을 주면 어느 쪽이 좋다는 말이 된다 (원칙 7) */
            <span className="text-[11.5px] font-medium text-ink-dim">
              {d > 0 ? "▴" : "▾"}
              {fmtNum(Math.abs(d), row.unit === "원" ? "원" : undefined)}
            </span>
          )}
        </span>
        {/* 🔴 등급을 **막대 끝 글자**로 내렸다 (팀 지적 「랭크가 애매한 자리에서 시선을 뺏는다」).
            채운 칩이 숫자 바로 옆에 붙어 있어 값보다 먼저 읽혔다. 이제 막대의 끝이
            어디까지 왔는지를 그 글자가 마무리한다 — 둘이 같은 것을 말한다. */}
        {pct != null && g && (
          <span className="mt-1.5 flex items-center gap-1.5">
            <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-track">
              <span
                className={`block h-full rounded-full ${BAR_CLS[g]}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span
              className={`w-[9px] shrink-0 text-[11px] font-bold ${GRADE_TEXT_CLS[g]}`}
              title={`수록 ${catLabel(p.cat)} 분포에서 ${g}`}
            >
              {g}
            </span>
          </span>
        )}
      </span>
    );
  }

  return <span className={`kr text-[12.5px] ${tone}`}>{String(v)}</span>;
}
