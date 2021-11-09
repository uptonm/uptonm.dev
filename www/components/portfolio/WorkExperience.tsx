import React, {FC, useCallback} from "react";
import dayjs from "dayjs";
import {v4} from "uuid";

interface IWorkExperience {
	role: string;
	location: string;
	startDate: Date;
	endDate?: Date;
	description: string;
	keyPoints: string[];
}

export interface WorkExperienceProps {
	experience: IWorkExperience[]
}

export const WorkExperience: FC<WorkExperienceProps> = ({experience}) => {
	const renderDateRange = useCallback( ( start: Date, end?: Date ) => {
		const [startDate, endDate] = [dayjs(start), dayjs(end)];

		return `${startDate.format("MMM YYYY")} - ${end ? endDate.format("MMM YYYY") : "Present"}`
	}, [] );

	return (
		<div className="bg-white shadow dark:bg-gray-800">
			<div className="px-4 py-5 pb-0 sm:px-6">
				<h4 className="text-gray-800 font-semibold text-2xl dark:text-white">
					Work Experience
				</h4>
			</div>
			<div className="px-4 py-5 sm:p-6 space-y-4">
				{experience.map((exp) => (
					<div key={v4()}>
						<div className="flex flex-col justify-start items-start mb-4">
							<h4 className="text-md font-bold text-gray-500 mr-2 sm:whitespace-nowrap dark:text-gray-300">{exp.role}</h4>
							<div className="w-full flex flex-col sm:flex-row justify-between sm:items-center">
								<span className="text-md font-hairline text-gray-500 dark:text-gray-300">
									{exp.location}
								</span>
								<span className="text-md font-hairline text-gray-500 dark:text-gray-300">
									{renderDateRange(exp.startDate, exp.endDate)}
								</span>
							</div>
						</div>
						<p className="text-gray-500 dark:text-gray-200 mb-2">{exp.description}</p>
						<ul className="list-disc list-outside ml-8">
							{exp.keyPoints.map((desc) => (
								<li key={v4()} className="text-gray-500 leading-6 dark:text-gray-300">{desc}</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</div>
	)
}
