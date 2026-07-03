import { copy } from "@/lib/copy";
import { renderDateRange } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

export function WorkExperience() {
  return (
    <section id="work" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Reveal className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {copy.sections.workExperience}
          </p>
          <h2 className="mt-3 font-display text-3xl font-light md:text-4xl">
            Where I&apos;ve worked
          </h2>
        </Reveal>

        <div className="space-y-4">
          {copy.workExperience.map((item, i) => (
            <Reveal
              key={item.key}
              delay={(i % 3) * 60}
              className="group grid gap-4 rounded-2xl border border-transparent p-6 transition-colors hover:border-border hover:bg-card md:grid-cols-[220px_1fr]"
            >
              <div className="text-sm text-muted-foreground">
                <div className="font-medium text-foreground">
                  {renderDateRange(item.startDate, item.endDate)}
                </div>
                <div>{item.location}</div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-xl text-foreground">{item.role}</h3>
                  {item.employmentType ? (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {item.employmentType}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {item.keyPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
