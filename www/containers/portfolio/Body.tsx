import dayjs from "dayjs";
import { v4 } from "uuid";

import { StringToHslColor } from "../../lib/utils";
import { useTheme } from "../../context/ThemeProvider";
import { About } from "../../components/portfolio/About";
import { WorkExperience } from "../../components/portfolio/WorkExperience";

export const Body = () => {
  const { theme } = useTheme();
  const bodyData = {
    bio: `Hi! I'm Mike. I am a Boston based Software Engineer currently working as a contractor for Meta. 
		My interests in software are majorly in the web space, including React, TypeScript, & Rust. In the 
		little free time that I have I enjoy snowboarding, travel, attending concerts & music festivals, as 
		well as a bit of music production.`,
    workExperience: [
      {
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
    ],
    education: [
      {
        school: "Wentworth Institute of Technology",
        degree: "BS Computer Science",
        startDate: new Date("08/01/2016"),
        endDate: new Date("08/01/2020"),
      },
    ],
  };

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

  const renderDateRange = (start: Date, end?: Date) => {
    const [startDate, endDate] = [dayjs(start), dayjs(end)];

    return `${startDate.format("MMM YYYY")} - ${
      endDate ? endDate.format("MMM YYYY") : "Present"
    }`;
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-0 sm:px-6 lg:px-8">
      <div className="flex-1 relative z-0 flex flex-col lg:flex-row">
        <main className="w-full flex-1 relative z-0 focus:outline-none xl:order-first">
          <div className="flex flex-col items-stretch space-y-8 py-8 px-0 sm:px-4 pb-0 lg:pb-8">
            <About>{bodyData.bio}</About>
            <WorkExperience experience={bodyData.workExperience} />
          </div>
        </main>
        <aside className="relative xl:order-last xl:flex xl:flex-col flex-shrink-0 lg:w-1/3">
          {/* Start secondary column (hidden on smaller screens) */}
          {/*<div className="absolute inset-0 py-6 px-4 sm:px-6 lg:px-8">*/}
          {/*	<div className="h-full border-2 border-gray-200 border-dashed rounded-lg"/>*/}
          {/*</div>*/}
          <div className="flex flex-col items-stretch space-y-8 py-8 px-0 sm:px-4">
            <div className="bg-white shadow dark:bg-gray-800">
              <div className="px-4 py-5 pb-0 sm:px-6">
                <h4 className="text-gray-800 font-semibold text-2xl dark:text-white">
                  Education
                </h4>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                {bodyData.education.map((education) => (
                  <div key={v4()} className="flex items-start w-full">
                    <i className="fas fa-graduation-cap text-gray-600 mt-1 dark:text-white" />
                    <div className="flex flex-col items-stretch ml-2 w-full">
                      <div className="flex flex-col sm:flex-row lg:flex-col 2xl:flex-row justify-between w-full">
                        <h4 className="text-md font-bold text-gray-500 dark:text-gray-300 whitespace-nowrap">
                          {education.degree}
                        </h4>
                        <p className="text-md font-hairline text-gray-500 dark:text-gray-300">
                          {renderDateRange(
                            education.startDate,
                            education.endDate
                          )}
                        </p>
                      </div>
                      <p className="text-md text-gray-500 dark:text-gray-300">
                        {education.school}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow dark:bg-gray-800">
              <div className="px-4 py-5 pb-0 sm:px-6">
                <h4 className="text-gray-800 font-semibold text-2xl dark:text-white">
                  Skills
                </h4>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <ul className="mt-2 leading-8">
                  {skills.map((skill) => (
                    <li key={skill} className="inline">
                      <a
                        href="#"
                        className="relative inline-flex items-center rounded-full border border-gray-300 dark:border-gray-500 px-3 py-0.5 dark:bg-gray-600"
                      >
                        <div className="absolute flex-shrink-0 flex items-center justify-center">
                          <span
                            style={{
                              backgroundColor: StringToHslColor(
                                skill,
                                theme === "dark" ? 75 : 60,
                                50
                              ),
                            }}
                            className="h-2 w-2 rounded-full"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3.5 text-sm font-medium text-gray-900 dark:text-gray-300">
                          {skill}
                        </div>
                      </a>
                      &nbsp;
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* End secondary column */}
        </aside>
      </div>
    </div>
  );
};
