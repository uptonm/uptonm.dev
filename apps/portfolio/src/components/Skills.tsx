import { copy } from "@/lib/copy";
import { Reveal } from "@/components/Reveal";

export function Skills() {
  return (
    <Reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        {copy.sections.skills}
      </p>
      <h2 className="mt-3 font-display text-3xl font-light md:text-4xl">
        What I work with
      </h2>
      <div className="mt-8 space-y-6">
        {copy.skills.map((group) => (
          <div key={group.category}>
            <h3 className="text-sm font-medium text-muted-foreground">
              {group.category}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
