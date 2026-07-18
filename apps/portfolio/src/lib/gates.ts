import { clerkClient } from "@clerk/nextjs/server";

export type GatedAppId =
  | "budget"
  | "facet"
  | "home"
  | "cairn"
  | "maplibre-gl-style-editor"
  | "convert-kit";

export type Gates = Record<GatedAppId, boolean>;

export type GatedApp = {
  id: GatedAppId;
  label: string;
  url: string;
  iconSrc: string;
};

/** Registry of personal sites that can be login-gated via Clerk org metadata. */
export const GATED_APPS: readonly GatedApp[] = [
  {
    id: "budget",
    label: "Budget",
    url: "https://budget.uptonm.dev",
    iconSrc: "/gates/budget.png",
  },
  {
    id: "facet",
    label: "Facet",
    url: "https://facet.uptonm.dev",
    iconSrc: "/gates/facet.png",
  },
  {
    id: "home",
    label: "Home",
    url: "https://home.uptonm.dev",
    iconSrc: "/gates/home.png",
  },
  {
    id: "cairn",
    label: "Cairn",
    url: "https://cairn.uptonm.dev",
    iconSrc: "/gates/cairn.png",
  },
  {
    id: "maplibre-gl-style-editor",
    label: "Map",
    url: "https://map.uptonm.dev",
    iconSrc: "/gates/maplibre-gl-style-editor.png",
  },
  {
    id: "convert-kit",
    label: "Convert",
    url: "https://convert.uptonm.dev",
    iconSrc: "/gates/convert-kit.png",
  },
] as const;

const DEFAULT_GATES: Gates = {
  budget: false,
  facet: false,
  home: false,
  cairn: false,
  "maplibre-gl-style-editor": false,
  "convert-kit": false,
};

function gatesOrgId(): string {
  const id = process.env.GATES_ORG_ID;
  if (!id) {
    throw new Error("GATES_ORG_ID is not configured");
  }
  return id;
}

function normalizeGates(raw: unknown): Gates {
  const gates =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = { ...DEFAULT_GATES };
  for (const app of GATED_APPS) {
    next[app.id] = gates[app.id] === true;
  }
  return next;
}

/** Read gate flags from the ops org `publicMetadata.gates`. */
export async function getGates(): Promise<Gates> {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: gatesOrgId(),
  });
  return normalizeGates(org.publicMetadata?.gates);
}

/**
 * Set one app's gate. `locked=true` requires Clerk login on that site.
 * Deep-merges into existing org `publicMetadata.gates`.
 */
export async function setGate(
  appId: GatedAppId,
  locked: boolean,
): Promise<Gates> {
  if (!GATED_APPS.some((app) => app.id === appId)) {
    throw new Error(`Unknown gated app: ${appId}`);
  }

  const client = await clerkClient();
  const org = await client.organizations.updateOrganizationMetadata(
    gatesOrgId(),
    {
      publicMetadata: {
        gates: { [appId]: locked },
      },
    },
  );
  return normalizeGates(org.publicMetadata?.gates);
}
