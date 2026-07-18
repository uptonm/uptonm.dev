import { copy } from "@/lib/copy";
import { renderDateRange } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

export function Education() {
  return (
    <Reveal
      delay={80}
      className="mt-12 grid gap-10 border-t border-border pt-10 md:grid-cols-[0.65fr_1.35fr] md:gap-12"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          {copy.sections.education}
        </p>
        <h2 className="mt-3 font-display text-3xl font-light md:text-4xl">
          Where I built the foundation
        </h2>
      </div>
      <div className="space-y-4">
        {copy.education.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <h3 className="font-display text-lg text-foreground">
                  {item.degree}
                </h3>
                <p className="mt-1 text-muted-foreground">{item.school}</p>
              </div>
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {renderDateRange(item.startDate, item.endDate)}
              </span>
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Selected coursework
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.coursework.join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
