// src/pages/index.js
import React from 'react';
import Head from 'next/head'
import Image from 'next/image'
import Layout from '../components/layout_landing'; // Adjust path based on your project structure
import { isLoggedIn, logout, getToken } from '../utils/auth';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useLocalization from '../hooks/useLocalization';
import ContactForm from '../components/ContactForm';
import Carousel from 'react-bootstrap/Carousel';
import { Container, Typography, Grid, Paper, Button } from '@mui/material';
import Newsletter from "@/components/Newsletter";



export default function Landing({ locale }) {

    const [isClient, setIsClient] = useState(false)

    const [userLoggedIn, setUserLoggedIn] = useState(false);

    const { t, localizedPath } = useLocalization();
    const router = useRouter();



    const handleLogout = async (event) => {
        event.preventDefault();
        const token = getToken();

        if (!token) {
            console.log('No active session or token expired');
            logout();
            setUserLoggedIn(false);
            router.push('/signin');
            return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logout/`, {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Token ${token}`,
            }),
        });

        if (response.ok) {
            logout();
            setUserLoggedIn(false);
            router.push('/signin'); // Redirect to the login page or home page
        } else {
            console.error('Logout failed');
        }

    };


    useEffect(() => {
        setUserLoggedIn(isLoggedIn());
    }, []);


    useEffect(() => {
        setIsClient(true)
    }, [])


    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_DOMAIN_NAME} Landing</title>
                <meta name='description' content='Learn more about us.' />
            </Head>

            <nav className="layout-navbar shadow-none py-0">
                <div className="container">
                    <div className="navbar navbar-expand-lg landing-navbar px-3 px-md-4 ">

                        <div className="navbar-brand app-brand demo d-flex py-0 me-4">

                            <button
                                className="navbar-toggler border-0 px-0 me-2"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#navbarSupportedContent"
                                aria-controls="navbarSupportedContent"
                                aria-expanded="false"
                                aria-label="Toggle navigation"
                            >
                                <i className="tf-icons bx bx-menu bx-sm align-middle" />
                            </button>

                            <a href="" className="app-brand-link">
                                <span className="app-brand-logo demo">
                                    <svg
                                        width={25}
                                        viewBox="0 0 25 42"
                                        version="1.1"
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                    >
                                        <defs>
                                            <path
                                                d="M13.7918663,0.358365126 L3.39788168,7.44174259 C0.566865006,9.69408886 -0.379795268,12.4788597 0.557900856,15.7960551 C0.68998853,16.2305145 1.09562888,17.7872135 3.12357076,19.2293357 C3.8146334,19.7207684 5.32369333,20.3834223 7.65075054,21.2172976 L7.59773219,21.2525164 L2.63468769,24.5493413 C0.445452254,26.3002124 0.0884951797,28.5083815 1.56381646,31.1738486 C2.83770406,32.8170431 5.20850219,33.2640127 7.09180128,32.5391577 C8.347334,32.0559211 11.4559176,30.0011079 16.4175519,26.3747182 C18.0338572,24.4997857 18.6973423,22.4544883 18.4080071,20.2388261 C17.963753,17.5346866 16.1776345,15.5799961 13.0496516,14.3747546 L10.9194936,13.4715819 L18.6192054,7.984237 L13.7918663,0.358365126 Z"
                                                id="path-1"
                                            />
                                            <path
                                                d="M5.47320593,6.00457225 C4.05321814,8.216144 4.36334763,10.0722806 6.40359441,11.5729822 C8.61520715,12.571656 10.0999176,13.2171421 10.8577257,13.5094407 L15.5088241,14.433041 L18.6192054,7.984237 C15.5364148,3.11535317 13.9273018,0.573395879 13.7918663,0.358365126 C13.5790555,0.511491653 10.8061687,2.3935607 5.47320593,6.00457225 Z"
                                                id="path-3"
                                            />
                                            <path
                                                d="M7.50063644,21.2294429 L12.3234468,23.3159332 C14.1688022,24.7579751 14.397098,26.4880487 13.008334,28.506154 C11.6195701,30.5242593 10.3099883,31.790241 9.07958868,32.3040991 C5.78142938,33.4346997 4.13234973,34 4.13234973,34 C4.13234973,34 2.75489982,33.0538207 2.37032616e-14,31.1614621 C-0.55822714,27.8186216 -0.55822714,26.0572515 -4.05231404e-15,25.8773518 C0.83734071,25.6075023 2.77988457,22.8248993 3.3049379,22.52991 C3.65497346,22.3332504 5.05353963,21.8997614 7.50063644,21.2294429 Z"
                                                id="path-4"
                                            />
                                            <path
                                                d="M20.6,7.13333333 L25.6,13.8 C26.2627417,14.6836556 26.0836556,15.9372583 25.2,16.6 C24.8538077,16.8596443 24.4327404,17 24,17 L14,17 C12.8954305,17 12,16.1045695 12,15 C12,14.5672596 12.1403557,14.1461923 12.4,13.8 L17.4,7.13333333 C18.0627417,6.24967773 19.3163444,6.07059163 20.2,6.73333333 C20.3516113,6.84704183 20.4862915,6.981722 20.6,7.13333333 Z"
                                                id="path-5"
                                            />
                                        </defs>
                                        <g
                                            id="g-app-brand"
                                            stroke="none"
                                            strokeWidth={1}
                                            fill="none"
                                            fillRule="evenodd"
                                        >
                                            <g
                                                id="Brand-Logo"
                                                transform="translate(-27.000000, -15.000000)"
                                            >
                                                <g id="Icon" transform="translate(27.000000, 15.000000)">
                                                    <g id="Mask" transform="translate(0.000000, 8.000000)">
                                                        <mask id="mask-2" fill="white">
                                                            <use xlinkHref="#path-1" />
                                                        </mask>
                                                        <use fill="#696cff" xlinkHref="#path-1" />
                                                        <g id="Path-3" mask="url(#mask-2)">
                                                            <use fill="#696cff" xlinkHref="#path-3" />
                                                            <use
                                                                fillOpacity="0.2"
                                                                fill="#FFFFFF"
                                                                xlinkHref="#path-3"
                                                            />
                                                        </g>
                                                        <g id="Path-4" mask="url(#mask-2)">
                                                            <use fill="#696cff" xlinkHref="#path-4" />
                                                            <use
                                                                fillOpacity="0.2"
                                                                fill="#FFFFFF"
                                                                xlinkHref="#path-4"
                                                            />
                                                        </g>
                                                    </g>
                                                    <g
                                                        id="Triangle"
                                                        transform="translate(19.000000, 11.000000) rotate(-300.000000) translate(-19.000000, -11.000000) "
                                                    >
                                                        <use fill="#696cff" xlinkHref="#path-5" />
                                                        <use
                                                            fillOpacity="0.2"
                                                            fill="#FFFFFF"
                                                            xlinkHref="#path-5"
                                                        />
                                                    </g>
                                                </g>
                                            </g>
                                        </g>
                                    </svg>
                                </span>
                                <span className="app-brand-text demo menu-text fw-bold ms-2 ps-1"  style={{ textTransform: "none" }}>
                                    {process.env.NEXT_PUBLIC_DOMAIN_NAME}
                                </span>
                            </a>
                        </div>

                        <div
                            className="collapse navbar-collapse landing-nav-menu"
                            id="navbarSupportedContent"
                        >
                            <button
                                className="navbar-toggler border-0 text-heading position-absolute end-0 top-0 scaleX-n1-rtl"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#navbarSupportedContent"
                                aria-controls="navbarSupportedContent"
                                aria-expanded="false"
                                aria-label="Toggle navigation"
                            >
                                <i className="tf-icons bx bx-x bx-sm" />
                            </button>
                            <ul className="navbar-nav me-auto">
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        aria-current="page"
                                        href="#landingHero"
                                    >
                                        {t('Home')}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        href="#landingFeatures"
                                    >
                                        {t('Features')}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        href="#landingAboutUs"
                                    >
                                        {t('Team')}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        href="#landingFAQ"
                                    >
                                        {t('FAQ')}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        href="#landingContact"
                                    >
                                        {t('Contact Us')}
                                    </a>
                                </li>

                                {userLoggedIn && (
                                    <li className="nav-item">
                                        <a
                                            className="nav-link fw-medium"
                                            href={localizedPath(`${process.env.NEXT_PUBLIC_URL_DASHBOARD}`)}
                                        >
                                            {t('Dashboard')}
                                        </a>
                                    </li>
                                )}


                            </ul>
                        </div>
                        <div className="landing-menu-overlay d-lg-none" />

                        <ul className="navbar-nav flex-row align-items-center ms-auto">

                            <li className="nav-item dropdown-style-switcher dropdown me-2 me-xl-0">
                                <a
                                    className="nav-link dropdown-toggle hide-arrow"
                                    href="#" onClick={(e) => e.preventDefault()}
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bx bx-sm" />
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end dropdown-styles">
                                    <li>
                                        <a
                                            className="dropdown-item"
                                            href="#" onClick={(e) => e.preventDefault()}
                                            data-theme="light"
                                        >
                                            <span className="align-middle">
                                                <i className="bx bx-sun me-2" />
                                                Light
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="dropdown-item"
                                            href="#" onClick={(e) => e.preventDefault()}
                                            data-theme="dark"
                                        >
                                            <span className="align-middle">
                                                <i className="bx bx-moon me-2" />
                                                Dark
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="dropdown-item"
                                            href="#" onClick={(e) => e.preventDefault()}
                                            data-theme="system"
                                        >
                                            <span className="align-middle">
                                                <i className="bx bx-desktop me-2" />
                                                System
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                            </li>

                            <li>

                                <a
                                    href={localizedPath('/org/signup')}
                                    className="btn btn-info"
                                >
                                    <span className="tf-icons bx bxs-school me-md-1" />
                                    <span className="d-none d-md-block">{t('Register Organization')}</span>
                                </a> &nbsp;&nbsp;&nbsp;

                            </li>


                            {!userLoggedIn ? (
                                // Signin/Register button if not logged in
                                <li>

                                    <a
                                        href={localizedPath('/signin')}
                                        className="btn btn-primary"
                                    >
                                        <span className="tf-icons bx bx-user me-md-1" />
                                        <span className="d-none d-md-block">{t('Signin/Register')}</span>
                                    </a>

                                </li>
                            ) : (
                                // Logout button if logged in
                                <li>
                                    <a
                                        href="#"
                                        onClick={handleLogout}
                                        className="btn btn-primary"
                                    >
                                        <span className="tf-icons bx bx-log-out me-md-1" />
                                        <span className="d-none d-md-block">{t('Logout')}</span>
                                    </a>
                                </li>
                            )}



                        </ul>

                    </div>
                </div>
            </nav>

            <div data-bs-spy="scroll" className="scrollspy-example">

                <section id="hero-animation">
                    <Carousel className='h-screen' >
                        <Carousel.Item className='h-screen' >
                            <img className="d-block w-100 h-screen object-cover" src="https://images.pexels.com/photos/1624990/pexels-photo-1624990.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2   " alt="First slide" />
                            <Carousel.Caption style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '20px', borderRadius: '10px', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, 50%)', height: '20%', width: '60%' }}>
                                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>Discover Your Ideal University</h3>
                                <p style={{ color: 'white', fontSize: '1.2rem' }}>Explore top universities worldwide and find the perfect match for your academic journey.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                        <Carousel.Item className='h-screen' >
                            <img className="d-block w-100 h-screen object-cover" src="https://images.pexels.com/photos/556195/pexels-photo-556195.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="First slide" />
                            <Carousel.Caption style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '20px', borderRadius: '10px', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, 50%)', height: '20%', width: '60%' }}>
                                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>Find Leading Professors & Courses</h3>
                                <p style={{ color: 'white', fontSize: '1.2rem' }}>Browse courses and professors to guide your path to academic excellence.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                        <Carousel.Item className='h-screen' >
                            <img className="d-block w-100 h-screen object-cover" src="https://images.pexels.com/photos/3685201/pexels-photo-3685201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="First slide" />
                            <Carousel.Caption style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '20px', borderRadius: '10px', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, 50%)', height: '20%', width: '60%' }}>
                                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>Your Pathway to Admissions</h3>
                                <p style={{ color: 'white', fontSize: '1.2rem' }}>Unlock the doors to higher education with expert admission guidance and scholarship opportunities.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                    </Carousel>

                </section>

                <section id="landingAboutUs" className="section-py bg-light landing-about-us">
                    <div className="container">
                        <div className="text-center mb-3 pb-1">
                            <span className="badge bg-label-primary">{t('About Us')}</span>
                        </div>
                        <h3 className="text-center mb-1">Who We Are</h3>
                        <p className="text-center mb-4 mb-lg-5 pb-md-3">
                            We are dedicated to empowering educational institutions with innovative solutions and support.
                        </p>
                        <div className="row gy-4">
                            <div className="col-lg-6">
                                <div className="about-img-box position-relative border rounded p-2 h-100">
                                    <img
                                        src="../../assets/img/front-pages/landing-page/Dec-Blog-Post-2.png"
                                        alt="About us illustration"
                                        className="about-img w-100 h-100 rounded"
                                    />
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="card">
                                    <div className="card-body">
                                        <h4 className="mb-1">{t('Our Mission')}</h4>
                                        <p className="mb-4">
                                            we are committed to providing top-notch resources and support to educational institutions. Our mission is to enhance the learning experience by offering comprehensive tools and solutions that cater to the unique needs of universities, colleges, and educational organizations.
                                        </p>
                                        <h4 className="mb-1">{t('Our Vision')}</h4>
                                        <p className="mb-4">
                                            We envision a world where educational institutions are seamlessly equipped with the tools and support they need to thrive. By fostering innovation and collaboration, we aim to create a positive impact on the educational landscape, enabling institutions to achieve their goals and drive excellence.
                                        </p>
                                        <h4 className="mb-1">{t('Our Values')}</h4>
                                        <ul className="list-unstyled">
                                            <li className="mb-2">
                                                <i className="bx bx-check-circle me-2" />
                                                Integrity - We uphold the highest standards of honesty and transparency in everything we do.
                                            </li>
                                            <li className="mb-2">
                                                <i className="bx bx-check-circle me-2" />
                                                Innovation - We are committed to constantly improving and delivering cutting-edge solutions.
                                            </li>
                                            <li className="mb-2">
                                                <i className="bx bx-check-circle me-2" />
                                                Collaboration - We believe in the power of partnerships and work closely with our clients to achieve mutual success.
                                            </li>
                                            <li className="mb-2">
                                                <i className="bx bx-check-circle me-2" />
                                                Excellence - We strive for excellence in all aspects of our work, ensuring the highest quality in our services and products.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <section id="landingFeatures" className="section-py landing-features">
                    <div className="container">
                        <div className="text-center mb-3 pb-1">
                            <span className="badge bg-label-primary">Educational Institutions</span>
                        </div>
                        <h3 className="text-center mb-1">
                            Discover the best educational institutions and resources
                        </h3>
                        <p className="text-center mb-3 mb-md-5 pb-3">
                            A comprehensive list of universities, colleges, campuses, and educational organizations.
                        </p>
                        <div className="features-icon-wrapper row gx-0 gy-4 g-sm-5">
                            <div className="col-lg-4 col-sm-6 text-center features-icon-box">
                                <div className="text-center mb-3">
                                    <img className='h-70px'
                                        src="../../assets/img/front-pages/landing-page/university.png"
                                        alt="University"
                                    />
                                </div>
                                <h5 className="mb-3"> <a href="/universities">Top Universities</a></h5>
                                <p className="features-icon-description">
                                    Explore prestigious universities offering a range of programs and research opportunities.
                                </p>
                            </div>
                            <div className="col-lg-4 col-sm-6 text-center features-icon-box">
                                <div className="text-center mb-3">
                                    <img className='h-70px'
                                        src="../../assets/img/front-pages/landing-page/college.png"
                                        alt="College"
                                    />
                                </div>
                                <h5 className="mb-3"> <a href="/college">Top Colleges</a></h5>
                                <p className="features-icon-description">
                                    Find colleges with diverse academic programs and extracurricular activities.
                                </p>
                            </div>
                            <div className="col-lg-4 col-sm-6 text-center features-icon-box">
                                <div className="text-center mb-3">
                                    <img className='h-70px'
                                        src="../../assets/img/front-pages/landing-page/campus.png"
                                        alt="Campus"
                                    />
                                </div>
                                <h5 className="mb-3"> <a href="/">Top Campuses</a></h5>
                                <p className="features-icon-description">
                                    Discover campuses with state-of-the-art facilities and vibrant student life.
                                </p>
                            </div>
                            <div className="col-lg-4 col-sm-6 text-center features-icon-box">
                                <div className="text-center mb-3">
                                    <img className='h-70px'
                                        src="../../assets/img/front-pages/landing-page/funding.png"
                                        alt="Funding"
                                    />
                                </div>
                                <h5 className="mb-3"><a href="/funding">Funding</a></h5>
                                <p className="features-icon-description">
                                    Access information on scholarships, grants, and funding options for education.
                                </p>
                            </div>
                            <div className="col-lg-4 col-sm-6 text-center features-icon-box">
                                <div className="text-center mb-3">
                                    <img className='h-70px'
                                        src="../../assets/img/front-pages/landing-page/collage.png"
                                        alt="Educational Organization"
                                    />
                                </div>
                                <h5 className="mb-3"><a href="/educational_organizations">Educational Organizations</a></h5>
                                <p className="features-icon-description">
                                    Learn about organizations supporting education and professional development.
                                </p>
                            </div>
                            <div className="col-lg-4 col-sm-6 text-center features-icon-box">
                                <div className="text-center mb-3">
                                    <img className='h-70px'
                                        src="../../assets/img/front-pages/landing-page/resource.png"
                                        alt="Educational Resources"
                                    />
                                </div>
                                <h5 className="mb-3"><a href="/">Educational Resources</a></h5>
                                <p className="features-icon-description">
                                    Explore resources like research papers, textbooks, and online courses.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                <section id="landingFAQ" className="section-py bg-body landing-faq">
                    <div className="container">
                        <div className="text-center mb-3 pb-1">
                            <span className="badge bg-label-primary">FAQ</span>
                        </div>
                        <h3 className="text-center mb-1">Frequently Asked Questions</h3>
                        <p className="text-center mb-5 pb-3">
                            Browse through these FAQs to find answers to commonly asked questions about educational institutions.
                        </p>
                        <div className="row gy-5">
                            <div className="col-lg-5 border rounded-4 d-flex align-items-center">
                                <div className="text-center h-75 d-flex justify-content-center w-100 aign-items-center d-flex w-100">
                                    <img
                                        src="../../assets/img/front-pages/landing-page/faq-removebg-preview.png"
                                        alt="FAQ illustration"
                                        className="faq-image"
                                    />
                                </div>
                            </div>
                            <div className="col-lg-7">
                                <div className="accordion" id="accordionExample">
                                    <div className="card accordion-item active">
                                        <h2 className="accordion-header" id="headingOne">
                                            <button
                                                type="button"
                                                className="accordion-button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordionOne"
                                                aria-expanded="true"
                                                aria-controls="accordionOne"
                                            >
                                                What types of educational institutions are listed?
                                            </button>
                                        </h2>
                                        <div
                                            id="accordionOne"
                                            className="accordion-collapse collapse show"
                                            data-bs-parent="#accordionExample"
                                        >
                                            <div className="accordion-body">
                                                Our directory includes universities, colleges, fund campuses, and educational organizations, each offering a variety of programs and resources.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card accordion-item">
                                        <h2 className="accordion-header" id="headingTwo">
                                            <button
                                                type="button"
                                                className="accordion-button collapsed"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordionTwo"
                                                aria-expanded="false"
                                                aria-controls="accordionTwo"
                                            >
                                                Are there any fees to access the information?
                                            </button>
                                        </h2>
                                        <div
                                            id="accordionTwo"
                                            className="accordion-collapse collapse"
                                            aria-labelledby="headingTwo"
                                            data-bs-parent="#accordionExample"
                                        >
                                            <div className="accordion-body">
                                                Access to our directory and basic information is free. However, additional services or premium features may require a fee.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card accordion-item">
                                        <h2 className="accordion-header" id="headingThree">
                                            <button
                                                type="button"
                                                className="accordion-button collapsed"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordionThree"
                                                aria-expanded="false"
                                                aria-controls="accordionThree"
                                            >
                                                How can I update the information for an institution?
                                            </button>
                                        </h2>
                                        <div
                                            id="accordionThree"
                                            className="accordion-collapse collapse"
                                            aria-labelledby="headingThree"
                                            data-bs-parent="#accordionExample"
                                        >
                                            <div className="accordion-body">
                                                To update the information for an institution, please contact our support team with the necessary details and documentation.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card accordion-item">
                                        <h2 className="accordion-header" id="headingFour">
                                            <button
                                                type="button"
                                                className="accordion-button collapsed"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordionFour"
                                                aria-expanded="false"
                                                aria-controls="accordionFour"
                                            >
                                                Can I suggest an institution to be added to the list?
                                            </button>
                                        </h2>
                                        <div
                                            id="accordionFour"
                                            className="accordion-collapse collapse"
                                            aria-labelledby="headingFour"
                                            data-bs-parent="#accordionExample"
                                        >
                                            <div className="accordion-body">
                                                Yes, you can suggest an institution by filling out our suggestion form or contacting our support team with the details.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card accordion-item">
                                        <h2 className="accordion-header" id="headingFive">
                                            <button
                                                type="button"
                                                className="accordion-button collapsed"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordionFive"
                                                aria-expanded="false"
                                                aria-controls="accordionFive"
                                            >
                                                How frequently is the information updated?
                                            </button>
                                        </h2>
                                        <div
                                            id="accordionFive"
                                            className="accordion-collapse collapse"
                                            aria-labelledby="headingFive"
                                            data-bs-parent="#accordionExample"
                                        >
                                            <div className="accordion-body">
                                                We strive to keep the information up-to-date by conducting regular reviews and updates. If you notice any discrepancies, please inform us.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="landingContact" className="section-py bg-body landing-contact">
                    <div className="container">
                        <div className="text-center mb-3 pb-1">
                            <span className="badge bg-label-primary">{t('Contact Us')}</span>
                        </div>
                        <h3 className="text-center mb-1">Get in Touch with Us</h3>
                        <p className="text-center mb-4 mb-lg-5 pb-md-3">
                            Have questions about our services, or need assistance? Reach out to us and we’ll be happy to help.
                        </p>
                        <div className="row gy-4">
                            <div className="col-lg-5">
                                <div className="contact-img-box position-relative border p-2 h-100">
                                    <img
                                        src="../../assets/img/front-pages/icons/contact-border.png"
                                        alt="Contact border decoration"
                                        className="contact-border-img position-absolute d-none d-md-block scaleX-n1-rtl"
                                    />
                                    <img
                                        src="../../assets/img/front-pages/landing-page/contact-customer-service.png"
                                        alt="Customer service illustration"
                                        className="contact-img w-100 scaleX-n1-rtl"
                                    />
                                    <div className="pt-3 px-4 pb-1">
                                        <div className="row gy-3 gx-md-4">
                                            <div className="col-md-6 col-lg-12 col-xl-6">
                                                <div className="d-flex align-items-center">
                                                    <div className="badge bg-label-primary rounded p-2 me-2">
                                                        <i className="bx bx-envelope bx-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="mb-0">Email</p>
                                                        <h5 className="mb-0">
                                                            <a 
                                                                href="mailto:hm_jamil@yahoo.com"
                                                                className="text-heading"
                                                            >
                                                                hm_jamil@yahoo.com
                                                            </a>
                                                        </h5>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-lg-12 col-xl-6">
                                                <div className="d-flex align-items-center">
                                                    <div className="badge bg-label-success rounded p-2 me-2">
                                                        <i className="bx bx-phone-call bx-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="mb-0">Phone</p>
                                                        <h5 className="mb-0">
                                                            <a href="tel:+17349288944" className="text-heading">
                                                            +1734-928-8944
                                                            </a>
                                                        </h5>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-7">
                                <div className="card">
                                    <div className="card-body">
                                        <h4 className="mb-1">{t('Send Us a Message')}</h4>
                                        <p className="mb-4">
                                            Whether you have questions about our university partnerships, need support with our educational tools, or want to discuss collaborations, we’re here to assist.
                                        </p>
                                        <ContactForm t={t} locale={locale} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



            </div>

            <footer className="landing-footer bg-body footer-text">
                <div className="footer-top position-relative overflow-hidden z-1">
                    <img
                        src="../../assets/img/front-pages/backgrounds/footer-bg-light.png"
                        alt="footer bg"
                        className="footer-bg banner-bg-img z-n1"
                        data-app-light-img="front-pages/backgrounds/footer-bg-light.png"
                        data-app-dark-img="front-pages/backgrounds/footer-bg-dark.png"
                    />
                    <div className="container">
                        <div className="row gx-0 gy-4 g-md-5">
                            <div className="col-lg-5">
                                <a href="" className="app-brand-link mb-4">
                                    <span className="app-brand-logo demo">
                                        <svg
                                            width=
                                            {25}

                                            viewBox="0 0 25 42"
                                            version="1.1"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                        >
                                            <defs>
                                                <path
                                                    d="M13.7918663,0.358365126 L3.39788168,7.44174259 C0.566865006,9.69408886 -0.379795268,12.4788597 0.557900856,15.7960551 C0.68998853,16.2305145 1.09562888,17.7872135 3.12357076,19.2293357 C3.8146334,19.7207684 5.32369333,20.3834223 7.65075054,21.2172976 L7.59773219,21.2525164 L2.63468769,24.5493413 C0.445452254,26.3002124 0.0884951797,28.5083815 1.56381646,31.1738486 C2.83770406,32.8170431 5.20850219,33.2640127 7.09180128,32.5391577 C8.347334,32.0559211 11.4559176,30.0011079 16.4175519,26.3747182 C18.0338572,24.4997857 18.6973423,22.4544883 18.4080071,20.2388261 C17.963753,17.5346866 16.1776345,15.5799961 13.0496516,14.3747546 L10.9194936,13.4715819 L18.6192054,7.984237 L13.7918663,0.358365126 Z"
                                                    id="path-1"
                                                />
                                                <path
                                                    d="M5.47320593,6.00457225 C4.05321814,8.216144 4.36334763,10.0722806 6.40359441,11.5729822 C8.61520715,12.571656 10.0999176,13.2171421 10.8577257,13.5094407 L15.5088241,14.433041 L18.6192054,7.984237 C15.5364148,3.11535317 13.9273018,0.573395879 13.7918663,0.358365126 C13.5790555,0.511491653 10.8061687,2.3935607 5.47320593,6.00457225 Z"
                                                    id="path-3"
                                                />
                                                <path
                                                    d="M7.50063644,21.2294429 L12.3234468,23.3159332 C14.1688022,24.7579751 14.397098,26.4880487 13.008334,28.506154 C11.6195701,30.5242593 10.3099883,31.790241 9.07958868,32.3040991 C5.78142938,33.4346997 4.13234973,34 4.13234973,34 C4.13234973,34 2.75489982,33.0538207 2.37032616e-14,31.1614621 C-0.55822714,27.8186216 -0.55822714,26.0572515 -4.05231404e-15,25.8773518 C0.83734071,25.6075023 2.77988457,22.8248993 3.3049379,22.52991 C3.65497346,22.3332504 5.05353963,21.8997614 7.50063644,21.2294429 Z"
                                                    id="path-4"
                                                />
                                                <path
                                                    d="M20.6,7.13333333 L25.6,13.8 C26.2627417,14.6836556 26.0836556,15.9372583 25.2,16.6 C24.8538077,16.8596443 24.4327404,17 24,17 L14,17 C12.8954305,17 12,16.1045695 12,15 C12,14.5672596 12.1403557,14.1461923 12.4,13.8 L17.4,7.13333333 C18.0627417,6.24967773 19.3163444,6.07059163 20.2,6.73333333 C20.3516113,6.84704183 20.4862915,6.981722 20.6,7.13333333 Z"
                                                    id="path-5"
                                                />
                                            </defs>
                                            <g
                                                id="g-app-brand"
                                                stroke="none"
                                                strokeWidth=
                                                {1}

                                                fill="none"
                                                fillRule="evenodd"
                                            >
                                                <g
                                                    id="Brand-Logo"
                                                    transform="translate(-27.000000, -15.000000)"
                                                >
                                                    <g id="Icon" transform="translate(27.000000, 15.000000)">
                                                        <g id="Mask" transform="translate(0.000000, 8.000000)">
                                                            <mask id="mask-2" fill="white">
                                                                <use xlinkHref="#path-1" />
                                                            </mask>
                                                            <use fill="#696cff" xlinkHref="#path-1" />
                                                            <g id="Path-3" mask="url(#mask-2)">
                                                                <use fill="#696cff" xlinkHref="#path-3" />
                                                                <use
                                                                    fillOpacity="0.2"
                                                                    fill="#FFFFFF"
                                                                    xlinkHref="#path-3"
                                                                />
                                                            </g>
                                                            <g id="Path-4" mask="url(#mask-2)">
                                                                <use fill="#696cff" xlinkHref="#path-4" />
                                                                <use
                                                                    fillOpacity="0.2"
                                                                    fill="#FFFFFF"
                                                                    xlinkHref="#path-4"
                                                                />
                                                            </g>
                                                        </g>
                                                        <g
                                                            id="Triangle"
                                                            transform="translate(19.000000, 11.000000) rotate(-300.000000) translate(-19.000000, -11.000000) "
                                                        >
                                                            <use fill="#696cff" xlinkHref="#path-5" />
                                                            <use
                                                                fillOpacity="0.2"
                                                                fill="#FFFFFF"
                                                                xlinkHref="#path-5"
                                                            />
                                                        </g>
                                                    </g>
                                                </g>
                                            </g>
                                        </svg>
                                    </span>
                                    <span className="app-brand-text demo footer-link fw-bold ms-2 ps-1"  style={{ textTransform: "none" }}>
                                        {process.env.NEXT_PUBLIC_DOMAIN_NAME}
                                    </span>
                                </a>
                                <p className="footer-text footer-logo-description mb-4">
                                    Stay in the Loop: Subscribe Now to Receive the Latest Updates Straight to Your Inbox!
                                </p>
                                < Newsletter />
                            </div>
                            <div className="col-lg-2 col-md-4 col-sm-6">
                                <h6 className="footer-title mb-4">Main Pages</h6>
                                <ul className="list-unstyled">

                                    <li className="mb-3">
                                        <a href="#landingAboutUs" className="footer-link">
                                            About Us
                                        </a>
                                    </li>

                                    <li className="mb-3">
                                        <a href="#landingFeatures" className="footer-link">
                                            Features
                                        </a>
                                    </li>

                                </ul>
                            </div>
                            <div className="col-lg-2 col-md-4 col-sm-6">
                                <h6 className="footer-title mb-4">Pages</h6>
                                <ul className="list-unstyled">

                                    <li className="mb-3">
                                        <a href="#landingFAQ" className="footer-link">
                                            Help Center
                                        </a>
                                    </li>
                                    <li className="mb-3">
                                        <a
                                            href="/signin"
                                            target="_blank"
                                            className="footer-link"
                                        >
                                            Signin/Register
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="col-lg-3 col-md-4">
                                <h6 className="footer-title mb-4">Download our app</h6>
                                <a
                                    href="#" onClick={(e) => e.preventDefault()}
                                    className="d-block footer-link mb-3 pb-2"
                                >
                                    <img
                                        src="../../assets/img/front-pages/landing-page/apple-icon.png"
                                        alt="apple icon"
                                    />
                                </a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="d-block footer-link">
                                    <img
                                        src="../../assets/img/front-pages/landing-page/google-play-icon.png"
                                        alt="google play icon"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom py-3">
                    <div className="container d-flex flex-wrap justify-content-between flex-md-row flex-column text-center text-md-start">
                        <div className="mb-2 mb-md-0">
                            <a
                                href="#"
                                target="_blank"
                                className="fw-medium text-white footer-link"
                            >
                                Copyright © 2024-2025 SmartTech LLC.
                            </a>
                        </div>
                        <div>
                            <a
                                href="#"
                                className="footer-link me-3"
                            >
                                <img
                                    src="../../assets/img/front-pages/icons/github-light.png"
                                    alt="github icon"
                                    data-app-light-img="front-pages/icons/github-light.png"
                                    data-app-dark-img="front-pages/icons/github-dark.png"
                                />
                            </a>
                            <a
                                href="#"
                                className="footer-link me-3"
                            >
                                <img
                                    src="../../assets/img/front-pages/icons/facebook-light.png"
                                    alt="facebook icon"
                                    data-app-light-img="front-pages/icons/facebook-light.png"
                                    data-app-dark-img="front-pages/icons/facebook-dark.png"
                                />
                            </a>
                            <a
                                href="#"
                                className="footer-link me-3"
                            >
                                <img
                                    src="../../assets/img/front-pages/icons/twitter-light.png"
                                    alt="twitter icon"
                                    data-app-light-img="front-pages/icons/twitter-light.png"
                                    data-app-dark-img="front-pages/icons/twitter-dark.png"
                                />
                            </a>
                            <a
                                href="#"
                                className="footer-link"
                            >
                                <img
                                    src="../../assets/img/front-pages/icons/instagram-light.png"
                                    alt="google icon"
                                    data-app-light-img="front-pages/icons/instagram-light.png"
                                    data-app-dark-img="front-pages/icons/instagram-dark.png"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

        </Layout>
    );
}

export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])), // Load the 'common' namespace
        },
    };
}

Landing.layout = 'landing';
Landing.requiresReCaptcha = true;