import { About } from "@/components/About";
import { Education, EducationItem } from "@/components/Education";
import { Header, SocialLink } from "@/components/Header";
import { Skills } from "@/components/Skills";
import {
  WorkExperience,
  WorkExperienceItem,
} from "@/components/WorkExperience";
import avatarImg from "@/public/avatar.jpeg";

const name = "Mike Upton";
const currentRole = "Full Stack Software Engineer";
const socialLinks: SocialLink[] = [
  {
    title: "GitHub",
    href: "https://github.com/uptonm",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-foreground"
        aria-hidden="true"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    title: "LinkedIn",
    href: "https://linkedin.com/in/uptonm",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-foreground"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];
const bio = `Hi! I'm Mike. I am a Boston based Software Engineer currently working at Meta.
  My interests in software are majorly in the web space, including React, TypeScript, & Rust. In the
  little free time that I have I enjoy snowboarding, travel, attending concerts & music festivals, as
  well as a bit of music production.`;
const workExperienceItems: WorkExperienceItem[] = [
  {
    key: "meta-direct",
    role: "Full Stack Software Engineer",
    location: "Meta - Cambridge, MA",
    startDate: new Date("01/01/2025"),
    endDate: undefined,
    description: `Support a team of 10 software engineers building products to help Meta scale its global
    telecommunications network at industry leading rates. Interface directly with stakeholders to translate
    business requirements into technical solutions, driving the development of full-stack features across
    Meta's OSS/BSS/NMS platform using React, TypeScript, GraphQL, PostgreSQL, and Rust.`,
    keyPoints: [
      `Collaborate with cross-functional stakeholders to define product roadmaps and prioritize features that accelerate the expansion of Meta's global telecom infrastructure.`,
      `Support and mentor a team of 10 engineers, facilitating technical design reviews and establishing best practices for scalable full-stack development.`,
      `Drive the continued evolution of Meta's internal telecom platform, delivering tooling that enables network deployment at industry leading velocity.`,
    ],
  },
  {
    key: "meta-method-dev",
    role: "Full Stack Software Engineer II",
    location: "Method Dev for Meta - Cambridge, MA",
    startDate: new Date("08/01/2022"),
    endDate: new Date("12/31/2024"),
    description: `Work on a team within Meta, building an OSS/BSS/NMS system to manage Meta's extensive global
    telecom footprint. Day to day involves building out full stack, user facing features using React, Typescript,
    GraphQL, Hasura, PostgreSQL, Golang & Rust.`,
    keyPoints: [
      `Led development of a new product to help Meta handle the project management aspect of their global telecom infrastructure.`,
      `Built out tooling using PostGIS & PGRouting to allow for advanced pathfinding of fiber optic networks using our internal map framework.`,
      `Designed, planned & developed full-stack map based features using Maplibre-GL, React, TypeScript, Redux, GraphQL and Rust.`,
      `Helped lead standards discussions and code reviews for the team as we pivot from using Golang to Rust as our primary service level language.`,
    ],
  },
  {
    key: "facebook-infogain",
    role: "Full Stack Software Engineer",
    location: "Infogain for Facebook - Cambridge, MA",
    startDate: new Date("08/01/2020"),
    endDate: new Date("07/31/2022"),
    description: `Coordinate with a team during COVID-19 pandemic to build a platform out from scratch to manage the internal needs
      of the company's global fiber optic footprint. Create end to end user experiences using React, TypeScript, Redux,
      Golang, and PostgreSQL. Deliver quality performance, while leading the development of an in-house mapping
      framework utilizing open-source frameworks, such as maplibre-gl to visualize vector tile data sets. Play an
      instrumental role in project module application development by creating a plugin based system for managing
      different tracking aspects of dark and lit fiber networks from construction to maintenance.`,
    keyPoints: [
      `Built scalable endpoints to calculate complex statistics based on data stored in PostgreSQL about long-haul
      telecom infrastructure projects in Golang, using Redis as to cache at the edge resulting in a < 200ms SLA.`,
      `Developed an entire project management platform, with a plugin based ecosystem of add-ons used to
      manage thousands of miles of dark and lit fiber infrastructure across the United States and Europe.`,
    ],
  },
  {
    key: "fidelity-labs",
    role: "Co-Op Software Engineer | Software Engineer Intern",
    location: "Fidelity Labs - Boston, MA",
    startDate: new Date("05/01/2018"),
    endDate: new Date("12/31/2020"),
    description: `Managed all phases of full software development lifecycle from development, CI/CD, and deployment while leading
      the development of a full-stack analytics and administration dashboard built on React, Typescript, and Nest.js.
      Improved data transfer by revising existing CSV generation programs to modern JavaScript with jQuery. Delivered
      quality performance, while working on an internal startup within Fidelity Investments engineering an application
      centered on ESG investment principals. Utilized Java Spring Boot and Angular 2 to create modern web applications
      for internal startups within Fidelity Investments. Developed a system to automate JIRA issue creation between the
      issue reporter and the team's project board, with custom email notifications for team members.`,
    keyPoints: [
      `Accessed and displayed useful information for administrative actions while connecting the dashboard to AWS,
      Concourse, and Jenkins using API's.`,
      `Gained hands-on experience with test-driven-development, writing tests in Cucumber and Jest for both
      back-ends in Java Spring Boot and front-ends in both React & Angular.`,
    ],
  },
];
const educationItems: EducationItem[] = [
  {
    key: "wentworth",
    school: "Wentworth Institute of Technology",
    degree: "BS Computer Science",
    startDate: new Date("08/01/2016"),
    endDate: new Date("08/01/2020"),
  },
];
const skills = [
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
];

export default function HomePage() {
  return (
    <>
      <Header
        avatarImage={avatarImg}
        fullName={name}
        currentRole={currentRole}
        socialLinks={socialLinks}
      />
      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-6">
              <About>{bio}</About>
              <WorkExperience items={workExperienceItems} />
            </div>
          </div>
          <aside className="lg:w-[340px] flex-shrink-0">
            <div className="flex flex-col gap-6 lg:sticky lg:top-8">
              <Education items={educationItems} />
              <Skills items={skills} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
