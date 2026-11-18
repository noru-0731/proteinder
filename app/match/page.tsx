import Link from "next/link";
import { MBTIS, matchOne, parseInput, synergyOf } from "@/lib/match";
import { brandLine } from "@/lib/products";
import { Note, NutLine, RailCard } from "@/components/Bits";

/**
 * 재미 매칭 — 홈 배너가 들어오는 곳.
 *
 * 🔴 GET 폼이라 JS 가 없다. URL 이 곧 결과이므로 링크를 그대로 공유하면
 *    같은 화면이 뜬다 — 서버 저장 0.
 * 🔴 놀이 라벨을 결과에 고정으로 붙인다. 궁합에 숫자 점수를 만들지 않는다.
 */

export const metadata = { title: "운명의 프로틴 매칭 — 프로틴더" };

type SP = Promise<{ birth?: string; mbti?: string; birth2?: string; mbti2?: string }>;

export default async function Match({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const me = parseInput(sp.birth, sp.mbti);
  const you = parseInput(sp.birth2, sp.mbti2);

  const mine = me ? matchOne(me.birth, me.mbti) : null;
  const yours = you ? matchOne(you.birth, you.mbti) : null;

  return (
    <>
      <div className="px-5 pt-6 pb-1">
        <p className="text-[12.5px] font-semibold text-flame-deep">재미로 보는 매칭</p>
        <h1 className="kr mt-1 text-[22px] leading-[1.3] font-semibold text-ink">
          생일과 MBTI로 찾는 <span className="text-flame">운명의 프로틴</span>
        </h1>
      </div>

      <Note>
        생년월일의 연도로 오행을 세고 MBTI 네 글자를 맛·용량·브랜드에 맞춰 하나를 고릅니다.
        같은 입력은 늘 같은 제품이 나옵니다.{" "}
        <b className="font-semibold text-ink-sub">
          성분·건강 적합성과는 무관한 놀이입니다.
        </b>
      </Note>

      {/* ── 입력 ── */}
      <form action="/match" className="px-5 pb-2">
        <div className="flex flex-wrap items-end gap-3 rounded-[10px] bg-bg px-4 py-4">
          <Field label="생년월일">
            <input
              type="date"
              name="birth"
              required
              defaultValue={me?.birth ?? ""}
              min="1900-01-01"
              max="2026-12-31"
              className="focus-ring rounded-[8px] border border-line-strong bg-card px-3 py-2 text-[14px] text-ink"
            />
          </Field>
          <Field label="MBTI">
            <select
              name="mbti"
              required
              defaultValue={me?.mbti ?? ""}
              className="focus-ring rounded-[8px] border border-line-strong bg-card px-3 py-2 text-[14px] text-ink"
            >
              <option value="" disabled>
                고르기
              </option>
              {MBTIS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          {/* 2인 궁합 — 1인 결과가 있을 때만 폼에 자리를 만든다 */}
          {mine && (
            <>
              <Field label="상대 생년월일">
                <input
                  type="date"
                  name="birth2"
                  defaultValue={you?.birth ?? ""}
                  min="1900-01-01"
                  max="2026-12-31"
                  className="focus-ring rounded-[8px] border border-line-strong bg-card px-3 py-2 text-[14px] text-ink"
                />
              </Field>
              <Field label="상대 MBTI">
                <select
                  name="mbti2"
                  defaultValue={you?.mbti ?? ""}
                  className="focus-ring rounded-[8px] border border-line-strong bg-card px-3 py-2 text-[14px] text-ink"
                >
                  <option value="">없음</option>
                  {MBTIS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <button
            type="submit"
            className="focus-ring rounded-[8px] bg-flame-deep px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            {mine ? "다시 뽑기" : "운명 찾기"}
          </button>
        </div>
        {me === null && sp.birth !== undefined && (
          <p className="mt-2 text-[12.5px] text-red">
            생년월일과 MBTI를 다시 확인해 주세요.
          </p>
        )}
      </form>

      {mine && (
        <>
          <div className={`grid gap-5 px-5 pt-4 ${yours ? "lg:grid-cols-2" : ""}`}>
            <Result title={yours ? "나" : "운명의 프로틴"} r={mine} />
            {yours && <Result title="상대" r={yours} />}
          </div>

          {yours && (
            <div className="mx-5 mt-5 rounded-[10px] bg-flame-wash px-5 py-4">
              <p className="text-[12.5px] font-semibold text-flame-deep">두 사람의 기운</p>
              <p className="kr mt-1 text-[15px] leading-[1.5] font-semibold text-ink">
                {synergyOf(mine.element.name, yours.element.name)}
              </p>
              {/* ⚠️ 옛 앱의 /compare(1:1 대조)는 app3 에 아직 없다.
                  없는 쪽으로 보내지 않고 각자의 상세로 나눠 보낸다 */}
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-flame-deep">
                <Link href={`/product/${mine.pick.id}`} className="focus-ring rounded">
                  내 제품 보기 ›
                </Link>
                <Link href={`/product/${yours.pick.id}`} className="focus-ring rounded">
                  상대 제품 보기 ›
                </Link>
              </p>
            </div>
          )}

          <p className="kr px-5 pt-6 pb-9 text-[11.5px] leading-[1.7] text-ink-dim">
            오행은 생년월일의 양력 연도만으로 셉니다 — 입춘 경계를 따지지 않는 단순화입니다.
            이 결과는 재미를 위한 것이고 제품의 성분·안전성·효능과는 아무 관계가 없습니다.
            영양 수치는 신고값 그대로입니다.
          </p>
        </>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-ink-dim">{label}</span>
      {children}
    </label>
  );
}

function Result({ title, r }: { title: string; r: NonNullable<ReturnType<typeof matchOne>> }) {
  const b = brandLine(r.pick);
  return (
    <section className="rounded-[10px] border border-line px-5 py-5">
      <p className="text-[12.5px] font-semibold text-flame-deep">{title}</p>

      <Link href={`/product/${r.pick.id}`} className="focus-ring mt-3 flex gap-4 rounded">
        <span className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[8px] border border-line bg-card">
          {r.pick.img && (
            // eslint-disable-next-line @next/next/no-img-element -- 로컬 JPEG
            <img
              src={r.pick.img}
              alt=""
              width={104}
              height={104}
              className="h-full w-full object-contain"
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[12px] ${b.isBrand ? "text-flame-deep" : "text-ink-dim"}`}>
            {b.text}
          </span>
          <span className="kr mt-0.5 block text-[16px] leading-[1.35] font-semibold text-ink">
            {r.pick.name}
          </span>
          <NutLine p={r.pick} className="mt-1.5" />
        </span>
      </Link>

      {/* 🔴 만족한 축만 내려온다 — 안 맞는 축을 맞다고 적지 않는다 */}
      <ul className="mt-4 space-y-1.5 border-t border-line pt-3.5">
        {r.reasons.map((line) => (
          <li key={line} className="kr text-[13px] leading-[1.6] text-ink-sub">
            {line}
          </li>
        ))}
      </ul>

      {r.runnerUps.length > 0 && (
        <>
          <p className="mt-4 text-[12px] text-ink-dim">같은 결의 다른 제품</p>
          <div className="rail mt-2 gap-3">
            {r.runnerUps.map((p) => (
              <RailCard key={p.id} p={p} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
