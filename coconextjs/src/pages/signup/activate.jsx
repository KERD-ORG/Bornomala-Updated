// src/pages/signup/activate.jsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Logo from '../../components/logo';
import Layout from '../../components/layout_auth';
import Loader from '../../components/Loader';
import { fetcher } from '../../utils/fetcher';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useLocalization from '../../hooks/useLocalization';
import { SIGNUP_ACTIVATE_MESSAGES } from '../messages';

export default function Activate() {
    const { t, localizedPath } = useLocalization();
    const router = useRouter();
    const { uidb64, token } = router.query;
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (uidb64 && token) {
            const activateAccount = async () => {
                try {

                    setLoading(true);

                    const activateAccountUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_ACTIVATE_ACCOUNT}`
                        .replace('<uidb64>', uidb64)
                        .replace('<token>', token);

                    const response = await fetcher.post(activateAccountUrl, {});

                    if (response.status === 200) {
                        setMessage(t(SIGNUP_ACTIVATE_MESSAGES.success));
                        setStatus('success');
                        setTimeout(() => {
                            router.push('/signin');
                        }, parseInt(process.env.NEXT_PUBLIC_API_ACTIVATE_DIRECT_SIGNINPAGE_TIME));
                    } else {
                        setMessage(response.message || t(SIGNUP_ACTIVATE_MESSAGES.invalidOrExpiredLink));
                        setStatus('error');
                    }
                } catch (error) {
                    setMessage(t(SIGNUP_ACTIVATE_MESSAGES.error));
                    setStatus('error');
                } finally {
                    setLoading(false); // Set loading to false after completing the operation
                }
            };
            activateAccount();
        }
    }, [uidb64, token]);

    return (
        <Layout>
            <Head>
                <title>{t(SIGNUP_ACTIVATE_MESSAGES.activateAccount)}</title>
            </Head>
            <div className="card">
                <div className="card-body">
                    {status === 'loading' && <p>Loading...</p>}
                    {status === 'success' && <p>{message}</p>}
                    {status === 'error' && <p className="text-danger">{message}</p>}
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