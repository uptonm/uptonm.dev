import { copy } from "@/lib/copy";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { Code2, ExternalLink } from "lucide-react";
import Image from "next/image";

export function Projects() {
  const featured = copy.projects[0]!;
  const supporting = copy.projects.slice(1);

  return (
    <section id="projects" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Reveal className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {copy.sections.selectedWork}
            </p>
            <h2 className="mt-3 font-display text-3xl font-light md:text-4xl">
              Work you can open.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Public tools and systems that show how I approach mapping, backend
            services, and infrastructure outside the constraints of client work.
          </p>
        </Reveal>

        <Reveal
          delay={80}
          className="mt-12 overflow-hidden rounded-3xl border border-border bg-card md:grid md:grid-cols-[1.25fr_0.75fr]"
        >
          <div className="relative min-h-64 overflow-hidden border-b border-border bg-secondary md:min-h-[380px] md:border-r md:border-b-0">
            {featured.image && featured.imageAlt ? (
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover object-center"
              />
            ) : null}
          </div>
          <div className="flex flex-col justify-between p-7 md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {featured.eyebrow}
              </p>
              <h3 className="mt-3 font-display text-2xl text-foreground">
                {featured.title}
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {featured.description}
              </p>
              <TechnologyList technologies={featured.technologies} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {featured.liveUrl ? (
                <a
                  href={featured.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
                >
                  Live demo
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : null}
              <a
                href={featured.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
              >
                Source
                <Code2 className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {supporting.map((project, index) => (
            <Reveal
              key={project.key}
              delay={120 + index * 60}
              className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-7"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  {project.eyebrow}
                </p>
                <h3 className="mt-3 font-display text-xl text-foreground">
                  {project.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
                <TechnologyList technologies={project.technologies} />
              </div>
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-brand"
              >
                View repository
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={180} className="mt-8 text-center">
          <a
            href="https://github.com/uptonm"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            More projects and experiments on GitHub
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function TechnologyList({ technologies }: { technologies: string[] }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies">
      {technologies.map((technology) => (
        <li
          key={technology}
          className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground"
        >
          {technology}
        </li>
      ))}
    </ul>
  );
}
