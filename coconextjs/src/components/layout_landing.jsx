// components/layout.jsx
import Head from 'next/head';
import React from 'react';
import Navheader from './header';
import Footer from './footer';
import Menu from './menu';
import Script from "next/script";
import Link from 'next/link';
import { isLoggedIn, logout, getToken } from '../utils/auth';
import { useRouter } from 'next/router';
import PerfectScrollbar from 'perfect-scrollbar';

import { useState, useEffect } from 'react'
import { i18n, useTranslation } from 'next-i18next'

import './../styles/vendor/css/pages/front-page.module.css';
import './../styles/vendor/css/pages/front-page-landing.module.css';

//styles/vendor/css/pages/front-page.module.css

export default function Layout({ children }) {




    return (
        <>

            <Head>

            </Head>

            {children}

            <Script src="/assets/vendor/js/helpers.js" strategy="beforeInteractive" />
            <Script src="/assets/js/front-config.js" strategy="beforeInteractive" />
            <Script src="/assets/vendor/js/dropdown-hover.js" strategy="beforeInteractive" />
            <Script src="/assets/vendor/js/mega-dropdown.js" strategy="beforeInteractive" />


            <Script src="/assets/vendor/libs/popper/popper.js" strategy="beforeInteractive" />
            <Script src="/assets/vendor/js/bootstrap.js" strategy="beforeInteractive" />
            <Script src="/assets/vendor/libs/nouislider/nouislider.js" strategy="beforeInteractive" />
            <Script src="/assets/vendor/libs/swiper/swiper.js" strategy="beforeInteractive" />
          



        </>
    );
}
