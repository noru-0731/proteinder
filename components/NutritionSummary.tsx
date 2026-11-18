import Link from "next/link";
import { catLabel, type Product } from "@/lib/data";
import NutritionRadar from "@/components/NutritionRadar";
import MoreDetail from "@/components/MoreDetail";
import { nutritionStandings } from "@/lib/nutrition-grades";

/**
 * 영양정보 — 이 화면에서 영양성분을 적는 **유일한 자리**.
 *
 * 🔴 한 화면에 기준이 셋이었다. 무엇을 보고 있는지 알 수 없었다.
 *      이름 밑     RTD 음료 · 총 350ml · 1회 200ml     ← servSize
 *      문단        1병(350ml) 기준 단백질 40g …         ← packLabel
 *      요약 카드    [100g 기준] / [200ml 기준] 토글      ← servSize
 *    게다가 토글의 「100g 기준」은 RTD 에서도 g 이라고 적혀 있었다 (실제는 100ml).
 *
 * 🔴 **servSize 는 쓰지 않는다.** RTD 는 대개 100ml당으로 신고하면서 servSize 칸에는
 *    200ml 을 관행적으로 적어 둔다. 파우더는 절반이 미신고이고, 가루 무게가 아니라
 *    물을 탄 완성 음료 부피가 적힌 것도 섞여 있다 (「제트맥스 2000g」의 servSize 가 150).
 *    CLAUDE.md 에서 이미 버린 값인데 이 카드에만 살아 있었다.
 *
 * 그래서 기준을 **하나로 통일**하고 100 단위 값을 작게 함께 적는다.
 *   RTD    총 내용량(= 1병) 기준  ·  작게 100ml당
 *   파우더  1회분 30g 기준        ·  작게 100g당
 *
 * ⚠️ 파우더는 「총 내용량」으로 통일할 수 없다. 통이 2kg 이라 그대로 환산하면
 *    단백질 1,600g 이 나온다. 파우더의 기준은 우리가 정한 1회분 30g 이다.
 *
 * 토글을 없애면서 클라이언트 컴포넌트가 아니게 됐다 — JS 없이 뜬다.
 */
const CELLS = [
  { label: "단백질", key: "prot", pack: "protPack", unit: "g" },
  { label: "칼로리", key: "kcal", pack: "kcalPack", unit: "kcal" },
  { label: "당류", key: "sugar", pack: "sugarPack", unit: "g" },
  { label: "탄수화물", key: "carb", pack: null, unit: "g" },
  { label: "지방", key: "fat", pack: null, unit: "g" },
  { label: "나트륨", key: "na", pack: null, unit: "mg" },
] as const;

export default function NutritionSummary({ p }: { p: Product }) {
  // 기준량(100ml·100g)당 값을 통일 기준으로 옮기는 배수.
  // 단백질·칼로리·당류는 export_app_data.py 가 이미 환산해 뒀고(protPack 등),
  // 나머지 셋은 같은 배수로 여기서 환산한다 — 한 카드 안에서 기준이 갈리면 안 된다.
  const basis = amountOf(p.basis);
  const target = amountOf(p.packLabel);
  const factor = basis && target ? target / basis : null;

  // protPack 이 없는 13건(대용량 단위 미확인 · 신고값 이상)은 환산하지 않는다.
  const unified = p.protPack != null && factor != null;
  const headline = unified ? p.packLabel : `${p.basis}당`;

  // 오각형 — 100ml/100g당 다섯 축의 분포 위치 (나트륨 제외 · 팀 요청)
  const radar = nutritionStandings(p);

  return (
    <div className="card rounded-2xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[18px] font-bold leading-[27px] text-title">영양정보</h2>
        <span className="text-[12.5px] font-semibold text-ink-dim">
          {headline} 기준
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4">
        {CELLS.map((c) => {
          const per100 = p[c.key] as number | null;
          const packValue = c.pack
            ? (p[c.pack] as number | null)
            : per100 != null && factor != null
              ? per100 * factor
              : null;
          const main = unified ? packValue : per100;

          return (
            <div key={c.label} className="text-center">
              <div className="text-[12px] leading-[18px] text-muted">{c.label}</div>
              <div className="mt-0.5">
                <span className="text-[19px] font-bold tabular-nums text-title">
                  {main == null ? "—" : round(main)}
                </span>
                {main != null && (
                  <span className="text-[12px] font-medium text-muted"> {c.unit}</span>
                )}
              </div>
              {/* ❌ 100 단위 소수(4.7g 등)를 지웠다 (2026-08-07 · 팀 결정 — 원 함량 강조).
                  같은 자로 재는 일은 아래 오각형이 맡는다 — 숫자 두 벌이 겹치던 자리다 */}
            </div>
          );
        })}
      </div>

      {/* ❌ 등수 전면 삭제 (2026-08-06 저녁) — 「262건 중 236위」류 등수·분포 막대를
          걷어냈다. 등수는 읽는 사람이 쓸 수 있는 값이 아니었다.

          🔴 대신 오각형 (같은 날 밤 · 팀 요청) — 나트륨을 뺀 다섯 축의 100ml/100g당
          값이 분포 어디인지를 A~D 로. A = 흔히 반기는 쪽 상위 20% (필터의
          「상위 20%」와 같은 경계 — lib/nutrition-grades.ts 주석). */}
      {/* 🔴 표본이 얕은 카테고리는 등급을 안 매긴다 — **왜 없는지 화면이 말한다.**
             아무 말 없이 오각형만 사라지면 「이 제품은 뭔가 빠졌다」로 읽힌다.
             모수는 nutrition-grades.ts 의 MIN_DIST 가 정한다 (지금 25). */}
      {!radar.some((a) => a.grade != null) && radar.some((a) => a.value != null) && (
        <p className="kr mt-4 border-t border-line pt-3 text-[11.5px] leading-[1.7] text-faint">
          이 카테고리는 영양성분이 확인된 제품이 {Math.max(...radar.map((a) => a.n))}개뿐이라
          등급을 매기지 않았습니다. 네 등급으로 자르면 한 칸에 두어 개씩만 들어가
          한두 제품 차이로 등급이 뒤집힙니다 — 값은 그대로 보여드리고 순위는 접어 둡니다.
        </p>
      )}

      {/* 🔴 접는다 (2026-08-07 · 팀 결정 2안). 모바일 390px 에서 이 덩어리가
          514px — 영양정보 카드 773px 의 66% 다. 위 여섯 칸은 신고값이라 늘 펼쳐 두고,
          오각형은 우리가 얹은 해석이라 접는다 (MoreDetail 주석의 규칙). */}
      {radar.some((a) => a.grade != null) && (
        <MoreDetail
          label="성분 밸런스"
          hint="다섯 축 A~D"
          className="mt-5 border-t border-line pt-2"
        >
          {/* 🔴 1회 섭취 기준 (2026-08-07 · 2안) — 위 여섯 칸·태그 줄·계산기와 같은 자다.
              100당이던 때는 태그 「상위 20%」와 오각형 등급이 어긋났다 (RTD 53%) */}
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-semibold text-body">
              {p.packLabel} 기준 성분 밸런스
            </span>
            <span className="text-[11px] text-faint">
              수록 {catLabel(p.cat)} {radar[0].n}개 분포 기준
            </span>
          </div>
          <NutritionRadar p={p} />
          {/* 🔴 페르소나 명시 (2026-08-07 · 정합성 점검) — 「탄수 적으면 무조건 좋냐」는
              지적이 정당한 자리. 이 등급이 어느 목적 기준인지와, 반대 목적일 때
              어떻게 읽는지를 화면에 그대로 적는 것이 방어선이다 */}
          {/* 🔴 각주가 「등급 구간표」를 이름으로 지칭하면서 링크가 없었다 (2026-08-07) —
              주장(A~D) 옆에서 근거 페이지의 존재만 말하고 연결은 안 한 자리
              🔴 「축을 합친 한 글자」는 없다 — 종합 등급을 폐기했다 (2026-08-07). */}
          <p className="break-keep text-[11px] leading-4 text-faint">
            A는 흔히 반기는 쪽일 뿐 몸에 좋다는 판정이 아닙니다. 다섯 축을 하나로
            합치지 않는 것도 같은 이유입니다 — 무엇이 더 중요한지는 목적마다 다릅니다.
            증량·식사대용처럼 열량과 탄수를 채우려는 목적이라면 칼로리·탄수화물 축은
            거꾸로 읽으세요. A~D가 갈리는 실측 경계는{" "}
            <Link
              href="/grades#cuts"
              className="focus-ring font-semibold text-ink-sub underline underline-offset-2"
            >
              등급 구간표
            </Link>
            에 있습니다.
          </p>

          {/* ❌ 「종합 지수 분포」 곡선 삭제 (2026-08-07 · 종합 등급 폐기).
              다섯 축을 가중 평균한 지수의 실측 밀도 곡선 + 이 제품 마커가 여기 있었다.
              합친 값 자체를 폐기했으므로 그릴 것이 없다 — 축별 위치는 위 오각형이 말한다. */}
        </MoreDetail>
      )}

      <p className="mt-4 text-[11.5px] leading-[17px] text-faint">
        {unified ? (
          <>
            모든 값은 <b className="font-semibold text-meta">{headline}</b> 기준으로 환산한
            신고값입니다.
          </>
        ) : (
          <>
            {p.packLabel.startsWith("용량 미확인")
              ? "한 병에 얼마가 담기는지 확인하지 못해 총량으로 환산하지 않았습니다."
              : "신고된 기준량과 총용량이 서로 맞지 않아 총량으로 환산하지 않았습니다."}{" "}
            신고값 그대로 {p.basis}당으로만 적습니다.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * 「단위가 붙은」 숫자만 읽는다.
 *
 * 🔴 그냥 첫 숫자를 읽으면 `1병(330ml)` 에서 **330 이 아니라 1** 이 잡힌다.
 *    배수가 1/100 이 되어 나트륨이 106mg → 1.1mg 으로 나왔다.
 *    `1병(190ml) · 950ml 5병들이` 처럼 숫자가 여럿인 라벨도 앞의 190 을 집는다.
 */
function amountOf(text: string): number | null {
  const m = (text || "").match(/([\d.]+)\s*(?:ml|g)\b/i);
  return m ? Number(m[1]) : null;
}

function round(v: number): string {
  if (v >= 100) return String(Math.round(v));
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
