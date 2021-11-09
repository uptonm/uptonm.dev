import React, {FC, useCallback} from "react";
import Image from 'next/image'
import clsx from "classnames";

import avatarImg from "../../public/avatar.jpeg";
import {useTheme} from "../../context/ThemeProvider";

export const Header: FC = ({children}) => {
	const { theme, setTheme } = useTheme();

	const profile = {
		avatar: avatarImg,
		name: "Mike Upton",
		role: "Full Stack Software Engineer"
	}

	const toggleTheme = useCallback(() => {
		setTheme(theme === "dark" ? "light" : "dark")
	}, [theme, setTheme])

	return (
		<div className="shadow-md">
			<div className="w-full py-8 bg-white dark:bg-gray-800 relative">
				<div className="max-w-6xl px-8 mx-auto flex flex-col items-center sm:flex-row sm:space-x-12">
					<div className="h-32 w-32 sm:h-48 sm:w-48 rounded-full overflow-hidden">
						<Image
							className=""
							alt="Picture of Mike Upton"
							src={profile.avatar}
						/>
					</div>
					<div className="flex flex-col justify-center items-center pt-6 sm:py-0 sm:items-start space-y-1">
						<h2 className="text-2xl sm:text-4xl font-bold text-gray-700 dark:text-white">{profile.name}</h2>
						<p className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400">{profile.role}</p>
						<div className="flex space-x-4 pt-1">
							<a
								title="GitHub profile"
								href="https://github.com/uptonm"
								className="rounded-full bg-gray-800 h-10 w-10 flex justify-center items-center dark:bg-white"
							>
								<i className="fab fa-github fa-lg text-gray-100 dark:text-gray-800" />
							</a>
							<a
								title="LinkedIn profile"
								href="https://linkedin.com/in/uptonm"
								className="rounded-full bg-gray-800 h-10 w-10 flex justify-center items-center dark:bg-white"
							>
								<i className="fab fa-linkedin-in fa-lg text-gray-100 dark:text-gray-800" />
							</a>
						</div>
					</div>
				</div>
			</div>
			<div className="absolute top-8 right-8">
				<div
					title={`Turn ${theme === 'light' ? "off" : "on"} the lights`}
					className={clsx("rounded-full border-2 h-8 w-8 flex justify-center items-center", {
						"bg-gray-800": theme === "light",
						"bg-gray-100": theme === "dark"
					})}
				>
					<i
						onClick={toggleTheme}
						className={clsx("fa", {
							"text-white fa-moon fa-md": theme === "light",
							"text-gray-800 fa-sun fa-lg": theme === "dark"
						})}
					/>
				</div>
			</div>
		</div>
	)
}
