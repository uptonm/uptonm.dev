import { copy } from "@/lib/copy";
import { renderDateRange } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { SectionHeading } from "@uptonm/ui/components/base/section-heading";

export function Education() {
  return (
    <Reveal
      delay={80}
      className="mt-12 grid gap-10 border-t border-border pt-10 md:grid-cols-[0.65fr_1.35fr] md:gap-12"
    >
      <SectionHeading
        eyebrow={copy.sections.education}
        title="Where I built the foundation"
      />
      <div className="space-y-4">
        {copy.education.map((item) => (
          <Card key={item.key}>
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
          </Card>
        ))}
      </div>
    </Reveal>
  );
}
