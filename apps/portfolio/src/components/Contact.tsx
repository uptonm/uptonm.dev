import { copy } from "@/lib/copy";
import { socialIcon } from "@/components/icons";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Contact
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-light leading-tight md:text-5xl">
          {copy.contact.heading}
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          {copy.contact.blurb}
        </p>
      </Reveal>

      <Reveal delay={80} className="mx-auto mt-10 max-w-xl">
        <ContactForm />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-10 flex items-center justify-center gap-3">
          {copy.socials.map((s) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.title}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand hover:text-brand"
            >
              {socialIcon(s.key, "h-5 w-5")}
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
