// Map Clerk's UI onto the site's design tokens so auth surfaces inherit the
// warm-editorial theme and react to light/dark automatically via CSS vars.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--brand)",
    colorBackground: "var(--card)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--field)",
    colorInputText: "var(--foreground)",
    colorNeutral: "var(--foreground)",
    colorDanger: "var(--destructive)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
  },
  elements: {
    cardBox: "shadow-none border border-border",
    footer: "bg-transparent",
  },
};
