import { copy } from "@/lib/copy";
import { renderDateRange } from "@/lib/utils";
import { Badge } from "@uptonm/ui/components/base/badge";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { SectionHeading } from "@uptonm/ui/components/base/section-heading";
import { cn } from "@uptonm/ui/lib/utils";

export function WorkExperience() {
  return (
    <section id="work" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Reveal className="mb-12">
          <SectionHeading
            eyebrow={copy.sections.workExperience}
            title="Where I've worked"
          />
        </Reveal>

        <div className="space-y-4">
          {copy.workExperience.map((item, i) => (
            <Reveal
              key={item.key}
              delay={(i % 3) * 60}
              className="group grid gap-4 rounded-2xl border border-transparent p-6 transition-colors hover:border-border hover:bg-card md:grid-cols-[170px_32px_1fr]"
            >
              <div className="text-sm text-muted-foreground md:text-right">
                <div className="font-medium text-foreground">
                  {renderDateRange(item.startDate, item.endDate)}
                </div>
                <div>{item.location}</div>
              </div>
              <div className="relative hidden md:block" aria-hidden="true">
                <span
                  className={cn(
                    "absolute left-1/2 w-px -translate-x-1/2 bg-border",
                    i === 0 ? "top-3" : "-top-10",
                    i === copy.workExperience.length - 1
                      ? "bottom-[calc(100%-0.75rem)]"
                      : "-bottom-10",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-1/2 top-3 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand",
                    i === 0
                      ? "h-4 w-4 bg-brand ring-4 ring-brand-soft"
                      : "h-3 w-3 bg-secondary transition-colors group-hover:bg-card",
                  )}
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-xl text-foreground">
                    {item.role}
                  </h3>
                  {item.employmentType ? (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {item.employmentType}
                    </Badge>
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
