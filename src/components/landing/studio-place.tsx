import { ButtonLink } from "@/components/ui/button";
import { DAILY_FREE_DESIGNS } from "@/lib/credits/constants";
import { generatePattern, presetFor } from "@/lib/engine";
import { BEAR_WITH_EARS } from "@/lib/spec/samples";

// The card shows a real pattern computed by the engine at build time, not hand-typed rows.
const gauge = presetFor("worsted").gauge;
const head = generatePattern(BEAR_WITH_EARS, 15, gauge).parts.find((p) => p.partId === "head");

export function StudioPlace() {
  const rows = head?.rounds ?? [];
  return (
    <section id="studio-place" aria-labelledby="studio-place-heading" className="scroll-mt-20 border-t border-line/10 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <h2 id="studio-place-heading" className="text-balance text-4xl leading-[1.05] sm:text-6xl">
            For the one holding the hook.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Show the Studio a photo, a sketch, or describe the piece in Arabic or English. It works out the parts, then counts every round for you and checks that each one adds up.
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Watch it grow in 3D round by round, change the size or the colors, and print the pattern. You get {DAILY_FREE_DESIGNS} new designs free every day.
          </p>
          <ButtonLink href="/studio" size="lg" className="mt-8">
            Start a pattern
          </ButtonLink>
        </div>

        {/* A printed pattern card, the thing a crocheter actually keeps next to them */}
        <figure className="relative mx-auto w-full max-w-md rotate-[1.2deg] rounded-sm bg-paper p-7 text-paper-fg shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-9">
          <figcaption>
            <p className="font-serif text-3xl">Little bear</p>
            <p className="mt-1 text-sm opacity-70">Head, worsted yarn, 4 mm hook</p>
          </figcaption>
          <ol className="mt-6 space-y-1.5 text-[15px]">
            {rows.map((r) => (
              <li key={r.number} className="grid grid-cols-[2.6rem_1fr_auto] gap-2 border-b border-paper-fg/10 pb-1.5 last:border-0">
                <span className="font-medium text-wine">R{r.number}</span>
                <span>{r.instruction}</span>
                <span className="tabular-nums opacity-70">{r.stitches}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm italic opacity-80">{head?.finish}</p>
        </figure>
      </div>
    </section>
  );
}
