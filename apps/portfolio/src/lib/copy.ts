/**
 * Centralised site copy.
 *
 * Every user-facing string lives here so the data layer can be swapped for a
 * headless CMS (Sanity, Contentful, etc.) without touching component code.
 *
 * Guidelines for a future CMS migration:
 *  1. Define a provider that fetches from the CMS and returns a `SiteCopy` object.
 *  2. Replace the static `copy` export below with the provider's return value.
 *  3. Components already consume `copy.*` – no further changes needed.
 */

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface SiteCopy {
  /** Global brand / identity strings. */
  brand: {
    name: string;
    role: string;
    url: string;
  };

  seo: {
    title: string;
    description: string;
    keywords: string[];
  };

  socials: {
    key: string;
    title: string;
    href: string;
  }[];

  home: {
    bio: string;
  };

  sections: {
    about: string;
    workExperience: string;
    education: string;
    skills: string;
  };

  workExperience: {
    key: string;
    role: string;
    location: string;
    startDate: string;
    endDate?: string;
    description: string;
    keyPoints: string[];
  }[];

  education: {
    key: string;
    school: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }[];

  skills: {
    category: string;
    items: string[];
  }[];
}

// -----------------------------------------------------------------------
// Hard-coded copy (swap this with a CMS fetch in the future)
// -----------------------------------------------------------------------

export const copy: SiteCopy = {
  brand: {
    name: "Mike Upton",
    role: "Software Engineer at Meta",
    url: "https://uptonm.dev",
  },

  seo: {
    title: "Mike Upton — Software Engineer",
    description:
      "Software Engineer at Meta building telecom infrastructure at global scale. React, TypeScript, Rust, Go, PostgreSQL.",
    keywords: [
      "Mike Upton",
      "software engineer",
      "Meta",
      "full stack",
      "React",
      "TypeScript",
      "Rust",
      "Golang",
      "portfolio",
    ],
  },

  socials: [
    {
      key: "github",
      title: "GitHub",
      href: "https://github.com/uptonm",
    },
    {
      key: "linkedin",
      title: "LinkedIn",
      href: "https://linkedin.com/in/uptonm",
    },
  ],

  home: {
    bio: `Software Engineer at Meta building the platform that manages Meta's global telecommunications network. I specialise in full-stack product development with React, TypeScript, and Rust, and care deeply about developer experience, system design, and shipping high-quality software. Outside of work I snowboard, travel, attend concerts, and dabble in music production.`,
  },

  sections: {
    about: "About",
    workExperience: "Experience",
    education: "Education",
    skills: "Skills",
  },

  workExperience: [
    {
      key: "meta-direct",
      role: "Software Engineer",
      location: "Meta - Cambridge, MA",
      startDate: "01/01/2025",
      description: `Lead full-stack development on Meta's internal OSS/BSS/NMS platform — the system of record for the company's global telecom network. Own technical direction for a 10-engineer team, interface directly with infrastructure stakeholders, and ship product that enables Meta to scale network deployments at industry-leading rates.`,
      keyPoints: [
        "Own the product roadmap for the network lifecycle management module, aligning engineering priorities with infrastructure stakeholders across the organisation.",
        "Lead a team of 10 engineers — run design reviews, set technical standards, and drive the adoption of Rust for performance-critical service workloads.",
        "Architect and deliver full-stack features (React, TypeScript, GraphQL, PostgreSQL, Rust) that reduced network provisioning lead time across Meta's global fibre footprint.",
      ],
    },
    {
      key: "meta-method-dev",
      role: "Software Engineer II",
      location: "Method Dev for Meta - Cambridge, MA",
      startDate: "08/01/2022",
      endDate: "12/31/2024",
      description: `Built and shipped core modules of Meta's OSS/BSS/NMS telecom platform from early-stage to production, serving teams responsible for Meta's global fibre infrastructure.`,
      keyPoints: [
        "Designed and built a project management product from scratch, adopted by infrastructure teams to track construction and maintenance of Meta's global telecom network.",
        "Implemented geospatial pathfinding for fibre route planning using PostGIS, PGRouting, and a custom Maplibre-GL map framework — enabling automated least-cost routing across continental-scale networks.",
        "Drove the team's migration from Golang to Rust for backend services, authoring RFC standards, leading code reviews, and establishing patterns adopted across the platform.",
        "Shipped full-stack map-based features (Maplibre-GL, React, TypeScript, Redux, GraphQL, Rust) used daily by network planning and operations teams.",
      ],
    },
    {
      key: "facebook-infogain",
      role: "Software Engineer",
      location: "Infogain for Facebook - Cambridge, MA",
      startDate: "08/01/2020",
      endDate: "07/31/2022",
      description: `Founding engineer on the platform that became Meta's internal telecom management system. Built the application from scratch during the COVID-19 pandemic, establishing the frontend architecture, mapping framework, and plugin system still in use today.`,
      keyPoints: [
        "Architected and built an in-house geospatial mapping framework on Maplibre-GL for visualising and editing vector tile datasets representing thousands of miles of fibre infrastructure.",
        "Designed a plugin-based project management system for tracking dark and lit fibre networks from construction through maintenance — adopted across US and European deployments.",
        "Built Golang API endpoints backed by PostgreSQL and Redis caching, achieving < 200ms p99 latency for complex statistical aggregations over long-haul telecom datasets.",
      ],
    },
    {
      key: "fidelity-labs",
      role: "Software Engineering Co-Op",
      location: "Fidelity Labs - Boston, MA",
      startDate: "05/01/2018",
      endDate: "12/31/2020",
      description: `Three rotations across Fidelity's internal innovation lab, shipping full-stack applications for analytics, ESG investing, and developer tooling.`,
      keyPoints: [
        "Built a full-stack analytics and admin dashboard (React, TypeScript, Nest.js) integrated with AWS, Concourse CI, and Jenkins — used by engineering teams for deployment monitoring.",
        "Developed an automated JIRA triage system with custom email notifications, reducing manual issue routing for the team's project board.",
      ],
    },
  ],

  education: [
    {
      key: "wentworth",
      school: "Wentworth Institute of Technology",
      degree: "BS Computer Science",
      startDate: "08/01/2016",
      endDate: "08/01/2020",
    },
  ],

  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "Rust", "Golang"],
    },
    {
      category: "Frontend",
      items: ["React", "Next.js", "Tailwind CSS", "Maplibre-GL"],
    },
    {
      category: "Data & APIs",
      items: ["PostgreSQL", "PostGIS", "GraphQL", "tRPC", "Redis"],
    },
    {
      category: "Infrastructure",
      items: ["Docker", "Kubernetes", "Terraform", "Node.js"],
    },
  ],
};
