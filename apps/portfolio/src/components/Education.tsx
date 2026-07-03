import { copy } from "@/lib/copy";
import { renderDateRange } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

export function Education() {
  return (
    <Reveal delay={80}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        {copy.sections.education}
      </p>
      <h2 className="mt-3 font-display text-3xl font-light md:text-4xl">
        Where I studied
      </h2>
      <div className="mt-8 space-y-4">
        {copy.education.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
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
          </div>
        ))}
      </div>
    </Reveal>
  );
}
