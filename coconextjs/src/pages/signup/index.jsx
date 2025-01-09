// src/pages/signup/index.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link';
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import Loader from '../../components/Loader';
import Logo from '../../components/logo';
import Layout from '../../components/layout_auth';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useLocalization from '../../hooks/useLocalization';
import { SIGNUP_MESSAGES } from '../messages';


export default function Signup({ locale }) {

    const { t, localizedPath } = useLocalization();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [firstName, setFirstname] = useState('');
    const [middleName, setMiddlename] = useState('');
    const [lastName, setLastname] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [roles, setRoles] = useState([]);
    const [errors, setErrors] = useState({});
    const [agreeTerms, setAgreeTerms] = useState(false);


    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);



    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setPasswordVisible(!passwordVisible);
        } else if (field === 'confirmPassword') {
            setConfirmPasswordVisible(!confirmPasswordVisible);
        }
    };

    const { executeRecaptcha } = useGoogleReCaptcha();

    const validate = () => {
        let tempErrors = {};
        //tempErrors.email = /$^|.+@.+..+/.test(email) ? "" : "Enter a valid email address.";
        tempErrors.confirmPassword = password === confirmPassword ? "" : t(SIGNUP_MESSAGES.passwordsDoNotMatch);
        tempErrors.agreeTerms = agreeTerms ? "" : t(SIGNUP_MESSAGES.pleaseAgree);
        setErrors(tempErrors);

        return Object.values(tempErrors).every(x => x === "");
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_ROLES}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch roles');
                }
                const data = await response.json();
                setRoles(data.roles);
            } catch (error) {
                setErrors(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);



    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!executeRecaptcha) {
            return;
        }
        const gReCaptchaToken = await executeRecaptcha();

        //console.log(gReCaptchaToken, "response Google reCaptcha server");

        if (!validate()) return;

        setLoading(true);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_REGISTER}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': router.locale || locale,
            },
            body: JSON.stringify({
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                username,
                email,
                password,
                role,
                gRecaptchaToken: gReCaptchaToken
            }),
        });

        const data = await response.json();

        setLoading(false); // Hide loader

        if (response.ok) {
            setFirstname('');
            setMiddlename('');
            setLastname('');
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRole('');
            setErrors({});
            sessionStorage.setItem('registered', 'true');
            router.push('/signin');
        } else {
            const newErrors = {};
            if (data.username) newErrors.username = data.username.join(' ');
            if (data.email) newErrors.email = data.email.join(' ');
            if (data.password) newErrors.password = data.password.join(' ');
            if (data.first_name) newErrors.firstName = data.first_name.join(' ');
            if (data.middle_name) newErrors.middleName = data.middle_name.join(' ');
            if (data.last_name) newErrors.lastName = data.last_name.join(' ');
            if (data.role) newErrors.role = data.role.join(' ');
            setErrors(newErrors);
        }
    };



    return (
        <Layout>
            <Head>
                <title>{t(SIGNUP_MESSAGES.signUp)}</title>
                <meta name='description' content='Learn more about us.' />
            </Head>
            <div className="card">
                <div className="card-body">



                    <div className="app-brand justify-content-center">
                        <a href={localizedPath('/')} className="app-brand-link gap-2">
                            <span className="app-brand-logo demo">
                                <Logo />
                            </span>
                            <span className="app-brand-text demo text-body fw-bold"  style={{ textTransform: "none" }}>{process.env.NEXT_PUBLIC_DOMAIN_NAME}</span>
                        </a>
                    </div>

                    <h4 className="mb-2">{t(SIGNUP_MESSAGES.startYourJourney)}</h4>
                    <p className="mb-4">{t(SIGNUP_MESSAGES.joinOurPlatform)}!</p>



                    <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>

                        <div className="row">
                            <div className="col-md-6">

                                <div className="mb-3">
                                    <label htmlFor="first_name" className="form-label">
                                        {t(SIGNUP_MESSAGES.firstName)}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="first_name"
                                        name="first_name"
                                        placeholder={t('Enter your first name')}
                                        autoFocus=""
                                        value={firstName}
                                        onChange={e => setFirstname(e.target.value)}
                                    />
                                    {errors.firstName && <div className="text-danger">{errors.firstName}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="last_name" className="form-label">
                                        {t(SIGNUP_MESSAGES.lastName)}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="last_name"
                                        name="last_name"
                                        placeholder={t('Enter your last name')}
                                        autoFocus=""
                                        value={lastName}
                                        onChange={e => setLastname(e.target.value)}
                                    />
                                    {errors.lastName && <div className="text-danger">{errors.lastName}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        {t(SIGNUP_MESSAGES.email)}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder={t('Enter your email')}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    {errors.email && <div className="text-danger">{errors.email}</div>}
                                </div>





                                <div className="mb-3 form-password-toggle">
                                    <label className="form-label" htmlFor="password">
                                        {t(SIGNUP_MESSAGES.password)}
                                    </label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type={passwordVisible ? "text" : "password"}
                                            id="password"
                                            className="form-control"
                                            name="password"
                                            placeholder="············"
                                            aria-describedby="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                        <span className="input-group-text cursor-pointer" onClick={() => togglePasswordVisibility('password')}>
                                            <i className={`bx ${passwordVisible ? "bx-show" : "bx-hide"}`} />
                                        </span>
                                    </div>
                                    {errors.password && <div className="text-danger">{errors.password}</div>}
                                </div>


                            </div>
                            <div className="col-md-6">

                                <div className="mb-3">
                                    <label htmlFor="last_name" className="form-label">
                                        {t(SIGNUP_MESSAGES.middleName)}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="middle_name"
                                        name="middle_name"
                                        placeholder={t('Enter your middle name')}
                                        autoFocus=""
                                        value={middleName}
                                        onChange={e => setMiddlename(e.target.value)}
                                    />
                                    {errors.middleName && <div className="text-danger">{errors.middleName}</div>}
                                </div>



                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">
                                        {t(SIGNUP_MESSAGES.username)}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        name="username"
                                        placeholder={t('Enter your username')}
                                        autoFocus=""
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                    {errors.username && <div className="text-danger">{errors.username}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">{t('Role')}</label>
                                    <select
                                        className="form-control"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                    >
                                        <option value="">{t('Select your role')}</option>
                                        {/* Only show the "Student" option */}
                                        {roles
                                            // .filter((roleName) => roleName === 'Student')
                                            .map((roleName) => (
                                                <option key={roleName} value={roleName}>
                                                    {roleName}
                                                </option>
                                            ))}
                                    </select>
                                    {errors.role && <div className="text-danger">{errors.role}</div>}
                                </div>


                                <div className="mb-3 form-password-toggle">
                                    <label className="form-label" htmlFor="confirm_password">
                                        {t(SIGNUP_MESSAGES.confirmPassword)}
                                    </label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type={confirmPasswordVisible ? "text" : "password"}
                                            id="confirm_password"
                                            className="form-control"
                                            name="confirm_password"
                                            placeholder="············"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <span className="input-group-text cursor-pointer" onClick={() => togglePasswordVisibility('confirmPassword')}>
                                            <i className={`bx ${confirmPasswordVisible ? "bx-show" : "bx-hide"}`} />
                                        </span>
                                    </div>
                                    {errors.confirmPassword && <div className="text-danger">{errors.confirmPassword}</div>}
                                </div>


                            </div>

                        </div>

                        <div className="mb-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="terms-conditions"
                                    name="terms"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="terms-conditions">
                                    {t(SIGNUP_MESSAGES.agreeToTerms)} <a href="#">{t(SIGNUP_MESSAGES.privacyPolicyAndTerms)}</a>
                                </label>
                                {errors.agreeTerms && <div className="text-danger">{errors.agreeTerms}</div>}
                            </div>
                        </div>




                        <button className="btn btn-primary d-grid w-100">{t(SIGNUP_MESSAGES.signUp)}</button>
                    </form>
                    <p className="text-center">
                        <span>{t(SIGNUP_MESSAGES.alreadyHaveAnAccount)} </span>
                        <a href={localizedPath(`${process.env.NEXT_PUBLIC_URL_SIGNIN}`)}>
                            <span>{t(SIGNUP_MESSAGES.signInInstead)}</span>
                        </a>
                    </p>
                    <p className="text-center">
                        <span>Need to register your organization?</span>
                        <a href={localizedPath('/org/signup')}>
                            <span> Register</span>
                        </a>
                    </p>

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

Signup.layout = 'auth';
Signup.requiresReCaptcha = true;