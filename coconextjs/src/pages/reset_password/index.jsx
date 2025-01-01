import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout_auth';
import Loader from '../../components/Loader';
import Logo from '../../components/logo'
import axios from 'axios';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useLocalization from '../../hooks/useLocalization';
import { RESET_PASSWORD_MESSAGES } from '../messages';

export default function ResetPassword({ token, locale }) {
    const { t, localizedPath } = useLocalization();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [showFields, setShowFields] = useState(true);
    const [errorToken, setErrorToken] = useState(false);
    const [loading, setLoading] = useState(false);


    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setPasswordVisible(!passwordVisible);
        } else if (field === 'confirmPassword') {
            setConfirmPasswordVisible(!confirmPasswordVisible);
        }
    };


    useEffect(() => {
        setLoading(true);
        axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_PASSWORD_RESET_VALIDATE_TOKEN}`, { token }, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
            .then(response => {

                setShowFields(true);
                setError('');
            })
            .catch(error => {

                setError(t(RESET_PASSWORD_MESSAGES.invalidToken));
                setShowFields(false);
                setErrorToken(true);

            }).finally(() => {

                setLoading(false);
            });

    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setMessage('');
            setError('');
            setErrors({});
            setErrorToken(false);


            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_PASSWORD_RESET_CONFIRM}`,
                {
                    token,
                    password,
                    confirm_password: confirmPassword
                },
                {
                    headers: {
                        'Accept-Language': router.locale || locale,
                    },
                }
            );

            setMessage(t(RESET_PASSWORD_MESSAGES.passwordResetSuccess));
            setShowFields(false);
        } catch (error) {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                setErrors(errorData);

                let errorMessage = t(RESET_PASSWORD_MESSAGES.fixErrors);
                for (const field in errorData) {
                    errorMessage += ` ${errorData[field].join(' ')}`;
                }
                setError(errorMessage);
            } else {
                setError(t(RESET_PASSWORD_MESSAGES.errorResettingPassword));
            }
        }
    };




    const getCookie = (name) => {
        const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return cookieValue ? cookieValue.pop() : '';
    };

    return (
        <Layout>
            <Head>
                <title>{t(RESET_PASSWORD_MESSAGES.resetPasswordButton)}</title>
                <meta name='description' content='Reset Password Page' />
            </Head>
            <div className="card">
                <div className="card-body">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    {!errorToken && !message && (
                        <React.Fragment>
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
                            <h4 className="mb-2">{t(RESET_PASSWORD_MESSAGES.resetPasswordButton)} 🔒</h4>
                            <form onSubmit={handleSubmit}>


                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">{t(RESET_PASSWORD_MESSAGES.newPasswordLabel)}</label>

                                    <div className="input-group input-group-merge">
                                        <input
                                            type={passwordVisible ? "text" : "password"}
                                            className="form-control"
                                            id="password"
                                            name="password"
                                            placeholder={t('Enter your new password')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <span className="input-group-text cursor-pointer" onClick={() => togglePasswordVisibility('password')}>
                                            <i className={`bx ${passwordVisible ? "bx-show" : "bx-hide"}`} />
                                        </span>

                                    </div>

                                </div>
                                <div className="mb-3">
                                    <label htmlFor="confirmPassword" className="form-label">{t(RESET_PASSWORD_MESSAGES.confirmPasswordLabel)}</label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type={confirmPasswordVisible ? "text" : "password"}
                                            className="form-control"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Confirm your new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />

                                        <span className="input-group-text cursor-pointer" onClick={() => togglePasswordVisibility('confirmPassword')}>
                                            <i className={`bx ${confirmPasswordVisible ? "bx-show" : "bx-hide"}`} />
                                        </span>
                                    </div>

                                </div>

                                <button className="btn btn-primary d-grid w-100">{t('Reset Password')}</button>
                            </form>
                        </React.Fragment>
                    )}
                    {message && <div className="alert alert-success" role="alert">{message}</div>}
                </div>
            </div>
            {loading && <Loader />}
        </Layout>
    );
}


ResetPassword.layout = 'auth';

export async function getServerSideProps(context) {
    const { token, locale } = context.query;
    let translations = {};
    if (context.locale) {
        translations = await serverSideTranslations(context.locale, ['common']);
    }
    return {
        props: { token, ...translations }
    };
}
