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

  skills: string[];
}

// -----------------------------------------------------------------------
// Hard-coded copy (swap this with a CMS fetch in the future)
// -----------------------------------------------------------------------

export const copy: SiteCopy = {
  brand: {
    name: "Mike Upton",
    role: "Full Stack Software Engineer",
    url: "https://uptonm.dev",
  },

  seo: {
    title: "Mike Upton",
    description: "Mike Upton's personal portfolio",
    keywords: [
      "Mike",
      "Upton",
      "personal",
      "website",
      "blog",
      "github",
      "uptonm",
      "dev",
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
    bio: `Hi! I'm Mike. I am a Boston based Software Engineer currently working at Meta. My interests in software are majorly in the web space, including React, TypeScript, & Rust. In the little free time that I have I enjoy snowboarding, travel, attending concerts & music festivals, as well as a bit of music production.`,
  },

  sections: {
    about: "About Me",
    workExperience: "Work Experience",
    education: "Education",
    skills: "Skills",
  },

  workExperience: [
    {
      key: "meta-direct",
      role: "Full Stack Software Engineer",
      location: "Meta - Cambridge, MA",
      startDate: "01/01/2025",
      description: `Support a team of 10 software engineers building products to help Meta scale its global telecommunications network at industry leading rates. Interface directly with stakeholders to translate business requirements into technical solutions, driving the development of full-stack features across Meta's OSS/BSS/NMS platform using React, TypeScript, GraphQL, PostgreSQL, and Rust.`,
      keyPoints: [
        "Collaborate with cross-functional stakeholders to define product roadmaps and prioritize features that accelerate the expansion of Meta's global telecom infrastructure.",
        "Support and mentor a team of 10 engineers, facilitating technical design reviews and establishing best practices for scalable full-stack development.",
        "Drive the continued evolution of Meta's internal telecom platform, delivering tooling that enables network deployment at industry leading velocity.",
      ],
    },
    {
      key: "meta-method-dev",
      role: "Full Stack Software Engineer II",
      location: "Method Dev for Meta - Cambridge, MA",
      startDate: "08/01/2022",
      endDate: "12/31/2024",
      description: `Work on a team within Meta, building an OSS/BSS/NMS system to manage Meta's extensive global telecom footprint. Day to day involves building out full stack, user facing features using React, Typescript, GraphQL, Hasura, PostgreSQL, Golang & Rust.`,
      keyPoints: [
        "Led development of a new product to help Meta handle the project management aspect of their global telecom infrastructure.",
        "Built out tooling using PostGIS & PGRouting to allow for advanced pathfinding of fiber optic networks using our internal map framework.",
        "Designed, planned & developed full-stack map based features using Maplibre-GL, React, TypeScript, Redux, GraphQL and Rust.",
        "Helped lead standards discussions and code reviews for the team as we pivot from using Golang to Rust as our primary service level language.",
      ],
    },
    {
      key: "facebook-infogain",
      role: "Full Stack Software Engineer",
      location: "Infogain for Facebook - Cambridge, MA",
      startDate: "08/01/2020",
      endDate: "07/31/2022",
      description: `Coordinate with a team during COVID-19 pandemic to build a platform out from scratch to manage the internal needs of the company's global fiber optic footprint. Create end to end user experiences using React, TypeScript, Redux, Golang, and PostgreSQL. Deliver quality performance, while leading the development of an in-house mapping framework utilizing open-source frameworks, such as maplibre-gl to visualize vector tile data sets. Play an instrumental role in project module application development by creating a plugin based system for managing different tracking aspects of dark and lit fiber networks from construction to maintenance.`,
      keyPoints: [
        "Built scalable endpoints to calculate complex statistics based on data stored in PostgreSQL about long-haul telecom infrastructure projects in Golang, using Redis as to cache at the edge resulting in a < 200ms SLA.",
        "Developed an entire project management platform, with a plugin based ecosystem of add-ons used to manage thousands of miles of dark and lit fiber infrastructure across the United States and Europe.",
      ],
    },
    {
      key: "fidelity-labs",
      role: "Co-Op Software Engineer | Software Engineer Intern",
      location: "Fidelity Labs - Boston, MA",
      startDate: "05/01/2018",
      endDate: "12/31/2020",
      description: `Managed all phases of full software development lifecycle from development, CI/CD, and deployment while leading the development of a full-stack analytics and administration dashboard built on React, Typescript, and Nest.js. Improved data transfer by revising existing CSV generation programs to modern JavaScript with jQuery. Delivered quality performance, while working on an internal startup within Fidelity Investments engineering an application centered on ESG investment principals. Utilized Java Spring Boot and Angular 2 to create modern web applications for internal startups within Fidelity Investments. Developed a system to automate JIRA issue creation between the issue reporter and the team's project board, with custom email notifications for team members.`,
      keyPoints: [
        "Accessed and displayed useful information for administrative actions while connecting the dashboard to AWS, Concourse, and Jenkins using API's.",
        "Gained hands-on experience with test-driven-development, writing tests in Cucumber and Jest for both back-ends in Java Spring Boot and front-ends in both React & Angular.",
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
    "React",
    "TypeScript",
    "Rust",
    "Golang",
    "PostgreSQL",
    "PostGIS",
    "Redux",
    "GraphQL",
    "Docker",
    "Kubernetes",
  ],
};
