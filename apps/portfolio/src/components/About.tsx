import { copy } from "@/lib/copy";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { SectionHeading } from "@uptonm/ui/components/base/section-heading";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <SectionHeading
            eyebrow={copy.sections.about}
            title="I care about how the whole system fits together."
            titleClassName="leading-snug"
          />
        </Reveal>
        <Reveal delay={80}>
          <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
            {copy.home.bio.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
          <div className="mt-8 border-t border-border pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Current focus
            </p>
            <p className="mt-2 font-display text-2xl text-foreground">
              {copy.home.currentFocus}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
