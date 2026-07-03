import { copy } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <span className="font-display text-foreground">{copy.brand.name}</span>
        <span>
          © {new Date().getFullYear()} · Built in {copy.home.location}
        </span>
      </div>
    </footer>
  );
}
