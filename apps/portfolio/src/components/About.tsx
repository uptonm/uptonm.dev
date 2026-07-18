import { copy } from "@/lib/copy";
import { Reveal } from "@/components/Reveal";

const stats = [
  { value: "2018", label: "shipping since" },
  { value: "Meta", label: "current team" },
  { value: "Rust", label: "favorite lately" },
];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {copy.sections.about}
          </p>
          <h2 className="mt-3 font-display text-3xl font-light leading-snug md:text-4xl">
            A little about how I got here.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
            {copy.home.bio.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl font-normal text-brand-strong md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
