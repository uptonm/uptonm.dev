import { copy } from "@/lib/copy";
import { Badge } from "@uptonm/ui/components/base/badge";
import { Button } from "@uptonm/ui/components/base/button";
import { SocialLinks } from "@uptonm/ui/components/base/social-links";
import avatarImg from "@/public/avatar.jpeg";
import Image from "next/image";

export function Hero() {
  return (
    <section id="top" className="mx-auto max-w-5xl px-6 pt-32 pb-16 md:pt-40">
      <div className="grid items-center gap-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Badge
            size="md"
            className="mb-6 gap-2 font-medium text-muted-foreground"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            {copy.home.availability} · {copy.home.location}
          </Badge>

          <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            {copy.home.tagline}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {copy.brand.role} — based in {copy.home.location}.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild variant="brand" size="pill">
              <a href="#projects">View my work</a>
            </Button>
            <SocialLinks links={copy.socials} size="md" />
          </div>
        </div>

        <div className="justify-self-center md:justify-self-end">
          <div className="rounded-[2rem] border border-border bg-card p-2 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.35)]">
            <Image
              src={avatarImg}
              alt={`Photo of ${copy.brand.name}`}
              width={288}
              height={288}
              priority
              className="portrait h-56 w-56 rounded-[1.6rem] object-cover sm:h-72 sm:w-72"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
