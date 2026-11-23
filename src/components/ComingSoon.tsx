import { LogoMark } from "@/components/LogoMark";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";

interface ComingSoonProps {
  tone: "studio" | "shop";
  title: string;
  blurb: string;
  phase: string;
}

// Friendly placeholder used until a section is built in a later phase.
export function ComingSoon({ title, blurb, phase }: ComingSoonProps) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-28">
        <div className="w-full max-w-lg rounded-2xl bg-surface p-10 text-center">
          <LogoMark className="mx-auto h-12 w-12" />
          <p className="mt-6 text-sm text-brand">{phase}</p>
          <h1 className="mt-2 text-4xl">{title}</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{blurb}</p>
          <ButtonLink href="/" className="mt-8">
            Back home
          </ButtonLink>
        </div>
      </main>
    </>
  );
}
