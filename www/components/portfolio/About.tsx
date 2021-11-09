import React, {FC} from "react";

export const About: FC = ({children}) => {
	return (
		<div className="bg-white shadow dark:bg-gray-800">
			<div className="px-4 py-5 pb-0 sm:px-6">
				<h4 className="text-gray-800 font-semibold text-2xl dark:text-white">
					About Me
				</h4>
			</div>
			<div className="px-4 py-5 sm:p-6">
				<p className="text-md text-gray-500 leading-6 dark:text-gray-300">
					{children}
				</p>
			</div>
		</div>
	)
}
