import { About } from "@/components/About";
import { Education, EducationItem } from "@/components/Education";
import { Header, SocialLink } from "@/components/Header";
import { Skills } from "@/components/Skills";
import {
  WorkExperience,
  WorkExperienceItem,
} from "@/components/WorkExperience";
import avatarImg from "@/public/avatar.jpeg";
import { v4 } from "uuid";

const name = "Mike Upton";
const currentRole = "Full Stack Software Engineer";
const socialLinks: SocialLink[] = [
  {
    title: "GitHub",
    href: "https://github.com/uptonm",
    icon: (
      <i className="fab fa-github fa-lg text-gray-100 dark:text-gray-800" />
    ),
  },
  {
    title: "LinkedIn",
    href: "https://linkedin.com/in/uptonm",
    icon: (
      <i className="fab fa-linkedin-in fa-lg text-gray-100 dark:text-gray-800" />
    ),
  },
];
const bio = `Hi! I'm Mike. I am a Boston based Software Engineer currently working as a contractor for Meta. 
  My interests in software are majorly in the web space, including React, TypeScript, & Rust. In the 
  little free time that I have I enjoy snowboarding, travel, attending concerts & music festivals, as 
  well as a bit of music production.`;
const workExperienceItems: WorkExperienceItem[] = [
  {
    key: v4(),
    role: "Full Stack Software Engineer II",
    location: "Method Dev for Meta - Cambridge, MA",
    startDate: new Date("08/01/2022"),
    endDate: undefined,
    description: `Work on a team within Meta, building an OSS/BSS/NMS system to manage Meta’s extensive global 
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
    key: v4(),
    role: "Full Stack Software Engineer",
    location: "Infogain for Facebook - Cambridge, MA",
    startDate: new Date("08/01/2020"),
    endDate: new Date("07/31/2022"),
    description: `Coordinate with a team during COVID-19 pandemic to build a platform out from scratch to manage the internal needs
      of the company’s global fiber optic footprint. Create end to end user experiences using React, TypeScript, Redux,
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
    key: v4(),
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
      issue reporter and the team’s project board, with custom email notifications for team members.`,
    keyPoints: [
      `Accessed and displayed useful information for administrative actions while connecting the dashboard to AWS,
      Concourse, and Jenkins using API’s.`,
      `Gained hands-on experience with test-driven-development, writing tests in Cucumber and Jest for both
      back-ends in Java Spring Boot and front-ends in both React & Angular.`,
    ],
  },
];
const educationItems: EducationItem[] = [
  {
    key: v4(),
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
    <main className="bg-gray-100 dark:bg-gray-700 h-screen overflow-auto">
      <Header
        avatarImage={avatarImg}
        fullName={name}
        currentRole={currentRole}
        socialLinks={socialLinks}
      />
      <div className="max-w-screen-2xl mx-auto px-0 sm:px-6 lg:px-8">
        <div className="flex-1 relative z-0 flex flex-col lg:flex-row">
          <main className="w-full flex-1 relative z-0 focus:outline-none xl:order-first">
            <div className="flex flex-col items-stretch space-y-8 py-8 px-0 sm:px-4 pb-0 lg:pb-8">
              <About>{bio}</About>
              <WorkExperience items={workExperienceItems} />
            </div>
          </main>
          <aside className="relative xl:order-last xl:flex xl:flex-col flex-shrink-0 lg:w-1/3">
            <div className="flex flex-col items-stretch space-y-8 py-8 px-0 sm:px-4">
              <Education items={educationItems} />
              <Skills items={skills} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
