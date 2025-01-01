import Head from 'next/head';
import Script from 'next/script';
import React, { useState } from 'react';
import Navheader from './header';
import Footer from './footer';
import Menu from './menu';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function Layout({ children }) {
  const [menuLoaded, setMenuLoaded] = useState(false);

  return (
    <>
      <Head>
        
      </Head>

      <Script src="/assets/vendor/js/helpers.js" strategy="beforeInteractive" />
      <Script src="/assets/vendor/js/template-customizer.js" strategy="beforeInteractive" />
      <Script src="/assets/js/config.js" strategy="beforeInteractive" />

      <div className="layout-wrapper layout-content-navbar">
        <div className="layout-container">
          <Menu />
          <div className="layout-page">
            <Navheader />

            <div className="content-wrapper">
              <div className="container-xxl flex-grow-1 container-p-y">
                {children}
              </div>
              <Footer />
              <div className="content-backdrop fade" />
            </div>
          </div>
        </div>
        <div className="layout-overlay layout-menu-toggle"></div>
        <div className="drag-target"></div>
      </div>
    </>
  );
}
