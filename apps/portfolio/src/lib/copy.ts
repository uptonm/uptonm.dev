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
    currentFocus: string;
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
    coursework: string[];
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
      "Software engineer at Meta working across full-stack products, systems, developer tools, and the next generation of large language models. React, TypeScript, Rust, Go, C++, PostgreSQL.",
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
      "AI",
      "machine learning",
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
    tagline: "I build software for problems that don't fit neatly in one box.",
    availability: "Open to interesting problems",
    location: "Boston, MA",
    bio: [
      `My background spans product applications, backend services, data-intensive systems, developer tooling, and infrastructure. I'm at my best when a problem crosses those boundaries and needs someone to make the pieces cohere.`,
      `At Meta, I'm currently helping build the next generation of large language models. Before moving into AI, I spent several years building mapping, planning, and operations software for global telecom infrastructure.`,
      `I like taking work from an ambiguous problem to something people can depend on: learning the domain, finding the right abstractions, making the tradeoffs explicit, and staying close enough to the product to know whether the engineering is actually useful.`,
      `Outside of work, you'll find me snowboarding, on the golf course, traveling, at concerts, or making music.`,
    ],
    currentFocus:
      "Helping build the next generation of large language models at Meta.",
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
      description: `Joined Meta full-time in 2025 after five years as a contractor. I now help build the next generation of large language models, bringing experience across product interfaces, backend services, data systems, and developer tooling to a new class of problems.`,
      keyPoints: [
        "Help build software for the next generation of large language models.",
        "Moved into AI after years building Meta's telecom planning and operations platform.",
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
        "Cut response times on targeted network-data workloads from 2–5 seconds to roughly 20ms–1s, depending on the operation.",
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
        "Designed a plugin-based project-management system for tracking networks from construction through maintenance across NORAM, EMEA, and APAC.",
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
      coursework: [
        "Parallel & Distributed Computing",
        "Databases",
        "Operating Systems",
        "Programming Languages & Compilers",
        "Algorithms",
        "Network Programming",
        "Image Processing / Computer Vision",
      ],
    },
  ],

  skills: [
    {
      category: "Primary",
      items: ["TypeScript", "Rust", "Go", "React", "PostgreSQL"],
    },
    {
      category: "Experienced with",
      items: [
        "C++",
        "PHP",
        "Hack",
        "Python",
        "Node.js",
        "Next.js",
        "Tailwind CSS",
        "MapLibre-GL",
        "PostGIS",
        "MySQL",
        "GraphQL",
        "tRPC",
        "Apache Thrift",
        "gRPC",
        "Redis",
        "Elasticsearch",
        "Docker",
        "Kubernetes",
        "Terraform",
        "OpenTelemetry",
      ],
    },
  ],

  contact: {
    heading: "Let's tackle a hard systems problem.",
    blurb:
      "Have a role, a project, or just want to talk shop about Rust, maps, and large-scale systems? My inbox is always open.",
  },
};
