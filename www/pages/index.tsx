import type {NextPage} from 'next'
import Head from 'next/head'

import {Header} from "../containers/portfolio/Header";
import {Body} from "../containers/portfolio/Body";

const Home: NextPage = () => {
	return (
		<div className="bg-gray-100 dark:bg-gray-700 h-screen overflow-auto">
			<Head>
				<title>Mike Upton</title>
				<meta name="application-name" content="uptonm.dev"/>
				<meta name="description" content="Mike Upton's personal portfolio"/>
				<meta name="keywords" content="Mike,Upton,personal,website,blog,github,uptonm,dev"/>
				<link rel="icon" type="image/ico" href="favicon.ico"/>
				<link rel="preconnect" href="https://fonts.gstatic.com"/>
				<link
					href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;300&family=Noto+Sans:ital@0;1&family=Poppins:wght@300;400;500;600&display=swap"
					rel="stylesheet"/>
				<link
					rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.15.3/css/all.css"
					integrity="sha384-iKbFRxucmOHIcpWdX9NTZ5WETOPm0Goy0WmfyNcl52qSYtc2Buk0NCe6jU1sWWNB"
					crossOrigin="anonymous"/>
			</Head>

			<main>
				<Header />
				<Body />
			</main>
		</div>
	)
}

export default Home
