import { copy } from "@/lib/copy";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { SectionHeading } from "@uptonm/ui/components/base/section-heading";
import { SocialLinks } from "@uptonm/ui/components/base/social-links";
import { ContactForm } from "@/components/ContactForm";

export function Contact() {
  return (
    <section
      id="contact"
      className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28"
    >
      <Reveal>
        <SectionHeading
          eyebrow="Contact"
          title={copy.contact.heading}
          titleClassName="mx-auto mt-4 max-w-3xl text-4xl leading-tight md:text-5xl"
        >
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
            {copy.contact.blurb}
          </p>
        </SectionHeading>
      </Reveal>

      <Reveal delay={80} className="mx-auto mt-10 max-w-xl">
        <ContactForm />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-10 flex items-center justify-center gap-3">
          <SocialLinks links={copy.socials} size="lg" />
        </div>
      </Reveal>
    </section>
  );
}
