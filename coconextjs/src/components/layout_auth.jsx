// components/layout_auth.jsx
import Head from 'next/head';
import React from 'react';
import Navheader from './header.jsx';
import Footer from './footer.jsx';
import Menu from './menu.jsx';
import PerfectScrollbar from 'perfect-scrollbar';
import Script from 'next/script';



export default function Layout( { children }) {
    const localizedPath = (path) => {
        return locale === router.defaultLocale ? path : `/${locale}${path}`;
    };
    return (
            <>
           
            <div className="container-xxl">
                <div className="authentication-wrapper authentication-basic container-p-y">
                    <div className="authentication-inner"  style={{ maxWidth: '500px', margin: '0 auto' }}>
                        {children}
                    </div>
                </div>
            </div>
            
            </>

            );
}
