# `@uptonm/ui`

Shared, presentation-only React components and design tokens for the
_warm editorial_ design language. Components are data-agnostic — callers pass
in their own copy/data.

## Importing

Components are exported per-file (see `exports` in `package.json`):

```ts
import { Button } from "@uptonm/ui/components/base/button";
import { Badge } from "@uptonm/ui/components/base/badge";
import { SectionHeading } from "@uptonm/ui/components/base/section-heading";
import { SocialLinks } from "@uptonm/ui/components/base/social-links";
import { Card } from "@uptonm/ui/components/base/card";
import { Reveal } from "@uptonm/ui/components/utils/reveal";
import { socialIcon } from "@uptonm/ui/components/icons";
import { cn } from "@uptonm/ui/lib/utils";
```

The design tokens live in `@uptonm/ui/styles/default.css` — `@import` it once
from the app's global stylesheet.

## Components

| Import                                        | Purpose                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base/button`                                 | `Button` with `brand` / `soft` variants and `pillSm`/`pill`/`pillLg` sizes (plus the standard shadcn variants). Use `asChild` to render an `<a>`. |
| `base/badge`                                  | Pill/tag primitive (`soft` / `outline`, sizes `sm`/`md`/`lg`).                                                                                    |
| `base/switch`                                 | Radix switch (`on`/`off`); use for boolean settings.                                                                                              |
| `base/card`                                   | Bordered card surface with an optional title.                                                                                                     |
| `base/section-heading`                        | The brand eyebrow + display-serif title that opens each section.                                                                                  |
| `base/social-links`                           | A row of circular social icon links (renders a fragment).                                                                                         |
| `utils/reveal`                                | Scroll-triggered fade + lift; respects reduced-motion.                                                                                            |
| `utils/theme-provider` · `utils/theme-toggle` | Light/dark theme state + toggle.                                                                                                                  |
| `icons`                                       | `GithubIcon`, `LinkedinIcon`, and `socialIcon(key)`.                                                                                              |
