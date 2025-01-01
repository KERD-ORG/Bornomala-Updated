import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout_auth';
import axios from 'axios';
import { useRouter } from 'next/router';
import Loader from '../../components/Loader';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useLocalization from '../../hooks/useLocalization';
import { FORGOT_PASSWORD_MESSAGES } from '../messages';
import Logo from '../../components/logo';


export default function ForgotPassword( {locale} ) {
    const { t, localizedPath } = useLocalization();
    
    const [email, setEmail] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(false); 

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setMessage('');
            setError('');
            setLoading(true);
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_PASSWORD_RESET}`,
                { email },
                {
                  headers: {
                    'Accept-Language': router.locale || locale,
                  },
                }
            );
            setMessage(t(FORGOT_PASSWORD_MESSAGES.passwordResetLinkSent));
            setIsSent(true);
        } catch (error) {
            setError(t(FORGOT_PASSWORD_MESSAGES.noAccountFound));
        }finally {
            setLoading(false);
        }
    };

    
    return (
        <Layout>
            <Head>
                <title>{t(FORGOT_PASSWORD_MESSAGES.ForgotPassword)}</title>
                <meta name='description' content='Forgot Password Page' />
            </Head>
            <div className="card">
                <div className="card-body">
                    <div className="app-brand justify-content-center">
                        <a href="/" className="app-brand-link gap-2">
                            <span className="app-brand-logo demo">
                                <Logo />
                            </span>
                            <span className="app-brand-text demo text-body fw-bold"  style={{ textTransform: "none" }}>
                                {process.env.NEXT_PUBLIC_DOMAIN_NAME}
                            </span>
                        </a>
                    </div>
                    <h4 className="mb-2">{t('Forgot Password')}? 🔒</h4>
                    {isSent ? (
                        <p className="mb-4">{message}</p>
                    ) : (
                        <React.Fragment>
                            <p className="mb-4">
                                {t(FORGOT_PASSWORD_MESSAGES.enterEmailInstructions)}
                            </p>
                            <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">{t(FORGOT_PASSWORD_MESSAGES.email)}</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder={t('Enter your email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="btn btn-primary d-grid w-100">{t(FORGOT_PASSWORD_MESSAGES.sendResetLink)}</button>
                            </form>
                        </React.Fragment>
                    )}
                    {message && <div className="alert alert-success" role="alert">{message}</div>}
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    <div className="text-center">
                        <a href={localizedPath(`${process.env.NEXT_PUBLIC_URL_SIGNIN}`)} className="d-flex align-items-center justify-content-center">
                            <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm" />
                            {t(FORGOT_PASSWORD_MESSAGES.backToLogin)}
                        </a>
                    </div>
                </div>
            </div>
            {loading && <Loader />}
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

ForgotPassword.layout = 'auth';
