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
    /** Short headline shown in the hero. */
    tagline: string;
    /** Availability / status line shown in the hero badge. */
    availability: string;
    location: string;
    bio: string[];
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
    employmentType?: string;
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

  contact: {
    heading: string;
    blurb: string;
  };
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
      "Full-stack software engineer at Meta building large-scale systems to plan, operate, and manage one of the world's biggest telecom networks. React, TypeScript, Rust, Go, C++, PostgreSQL.",
    keywords: [
      "Mike Upton",
      "software engineer",
      "full stack",
      "Meta",
      "React",
      "TypeScript",
      "Rust",
      "Go",
      "C++",
      "PostgreSQL",
      "geospatial",
      "distributed systems",
      "Boston",
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
    tagline: "I turn massive, real-world systems into software people love to use.",
    availability: "Open to interesting problems",
    location: "Boston, MA",
    bio: [
      `I'm a full-stack software engineer. I take big, messy, real-world systems and turn them into software people actually enjoy using.`,
      `Most days that's React and TypeScript up front, with Rust, Go, and PostgreSQL underneath. I care about system design, developer experience, and shipping work that lasts.`,
      `Outside of work, you'll find me snowboarding, on the golf course, traveling, at concerts, or making music.`,
    ],
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
      location: "Meta · Cambridge, MA",
      employmentType: "Full-time",
      startDate: "01/01/2025",
      description: `Joined Meta full-time on the same team I'd contracted with since 2020. I build the software Meta uses to plan, build, operate, and keep inventory of one of the world's largest telecom networks. My work spans the full stack, from database and services to the map-based interfaces teams rely on every day.`,
      keyPoints: [
        "Design and ship full-stack features across React, TypeScript, GraphQL, PostgreSQL, and Rust for the platform that runs day-to-day network operations.",
        "Turn complex, large-scale infrastructure workflows — project management, operations, and inventory — into interfaces engineers and operators actually want to use.",
        "Partner with infrastructure teams to scope requirements and set technical direction for new areas of the platform.",
      ],
    },
    {
      key: "method-dev-se3",
      role: "Senior Software Engineer III",
      location: "Method Dev (for Meta) · Cambridge, MA",
      employmentType: "Contract",
      startDate: "04/01/2023",
      endDate: "01/01/2025",
      description: `Grew into a senior engineer on the same team as the platform scaled, taking ownership of performance-critical services and the cross-cutting technical decisions behind them.`,
      keyPoints: [
        "Led the team's migration from Go to Rust for backend services — wrote the standards, ran the code reviews, and set patterns other engineers built on.",
        "Owned performance and reliability for core services handling continental-scale network data.",
        "Shaped technical direction for new areas of the platform and mentored engineers through design reviews.",
      ],
    },
    {
      key: "method-dev-se2",
      role: "Software Engineer II",
      location: "Method Dev (for Meta) · Cambridge, MA",
      employmentType: "Contract",
      startDate: "08/01/2022",
      endDate: "04/01/2023",
      description: `Built core parts of the platform from the ground up — the tools teams use to manage projects, operations, and inventory across a massive telecom network.`,
      keyPoints: [
        "Designed and built a project-management product from scratch, adopted by infrastructure teams to track construction and maintenance across the network.",
        "Built geospatial route-planning (least-cost pathfinding) for fiber using PostGIS, PGRouting, and a custom MapLibre-GL mapping framework.",
        "Shipped full-stack, map-based features across React, TypeScript, Redux, GraphQL, and Rust used daily by planning and operations teams.",
      ],
    },
    {
      key: "facebook-infogain",
      role: "Software Engineer",
      location: "Infogain (for Facebook) · Cambridge, MA",
      employmentType: "Contract",
      startDate: "03/01/2020",
      endDate: "07/31/2022",
      description: `Founding engineer on the platform that became this telecom management system. Built the application from scratch during the pandemic — the frontend architecture, mapping framework, and plugin system still in use today.`,
      keyPoints: [
        "Architected an in-house geospatial mapping framework on MapLibre-GL for visualizing and editing vector-tile datasets covering thousands of miles of fiber.",
        "Designed a plugin-based project-management system for tracking networks from construction through maintenance, adopted across US and European deployments.",
        "Built Go APIs over PostgreSQL with Redis caching, holding sub-200ms p99 latency on complex aggregations over large telecom datasets.",
      ],
    },
    {
      key: "fidelity-labs",
      role: "Software Engineering Co-Op",
      location: "Fidelity Labs · Boston, MA",
      employmentType: "Co-op",
      startDate: "05/01/2018",
      endDate: "12/31/2020",
      description: `Three rotations across Fidelity's internal innovation lab, shipping full-stack applications for analytics, ESG investing, and developer tooling.`,
      keyPoints: [
        "Built a full-stack analytics and admin dashboard (React, TypeScript, Nest.js) integrated with AWS, Concourse CI, and Jenkins.",
        "Developed an automated JIRA triage system with custom email notifications, cutting manual issue routing for the team.",
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
      items: ["TypeScript", "Rust", "Go", "C++", "PHP", "Hack", "Python", "Node.js"],
    },
    {
      category: "Frontend",
      items: ["React", "Next.js", "Tailwind CSS", "MapLibre-GL"],
    },
    {
      category: "Data & APIs",
      items: ["PostgreSQL", "PostGIS", "MySQL", "GraphQL", "tRPC", "Apache Thrift", "gRPC", "Redis", "Elasticsearch"],
    },
    {
      category: "Infrastructure",
      items: ["Docker", "Kubernetes", "Terraform", "OpenTelemetry"],
    },
  ],

  contact: {
    heading: "Let's build something worth using.",
    blurb:
      "Have a role, a project, or just want to talk shop about Rust, maps, and large-scale systems? My inbox is always open.",
  },
};
