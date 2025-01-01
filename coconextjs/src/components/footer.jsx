import { useState, useEffect } from 'react'
import { i18n, useTranslation } from 'next-i18next';
function Footer() {
    const { t } = useTranslation('common');
return (
        <footer className="content-footer footer bg-footer-theme">
    <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
        <div className="mb-2 mb-md-0">
            
            <a
                href="#"
                target="_blank"
                className="footer-link fw-medium"
                >
                Copyright © 2024-2025 {process.env.NEXT_PUBLIC_COMPANY_NAME}.
            </a>
        </div>
        <div className="d-none d-lg-inline-block">
            <a
                href={`${process.env.NEXT_PUBLIC_MAIN_URL}#landingAboutUs`}
                className="footer-link me-4"
                target="_blank"
                >
                {t('About Us')}
            </a>
            
            <a
                href={`${process.env.NEXT_PUBLIC_MAIN_URL}#landingFeatures`}
                target="_blank"
                className="footer-link me-4"
                >
               {t('Features')}
            </a>
            <a
                href={`${process.env.NEXT_PUBLIC_MAIN_URL}#landingFAQ`}
                target="_blank"
                className="footer-link"
                >
                {t('Support')}
            </a>
        </div>
    </div>
    
</footer>

        );
        }

export default Footer;
