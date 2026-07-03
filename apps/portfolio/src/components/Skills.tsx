import { copy } from "@/lib/copy";
import { Badge } from "@uptonm/ui/components/base/badge";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { SectionHeading } from "@uptonm/ui/components/base/section-heading";

export function Skills() {
  return (
    <Reveal className="grid gap-10 md:grid-cols-[0.65fr_1.35fr] md:gap-12">
      <SectionHeading eyebrow={copy.sections.skills} title="What I work with" />
      <div className="space-y-6">
        {copy.skills.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {group.category}
            </h3>
            <ul
              className="mt-3 flex flex-wrap gap-2"
              aria-label={group.category}
            >
              {group.items.map((item, index) => (
                <li key={item} className="contents">
                  <Badge>{item}</Badge>
                  {index < group.items.length - 1 ? (
                    <span className="sr-only">, </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
