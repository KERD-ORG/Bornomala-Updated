import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import Loader from '../../components/Loader';
import { useTranslation } from 'next-i18next';
import { executeAjaxOperation } from '../../utils/fetcher';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useLocalization from '../../hooks/useLocalization';
import { SETUP_OTP_MESSAGES } from '../messages';

const SetupOTP = ({ locale }) => {
    const { t, localizedPath } = useLocalization();
    const router = useRouter();
    const [error, setError] = useState(null);
    const [otpUri, setOtpUri] = useState(null);
    const [token, setToken] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [otpSetup, setOtpSetup] = useState(false); // Added state to track OTP setup status
    const [otpVerified, setOtpVerified] = useState(false); // Added state to track OTP verification status
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push('/signin'); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            checkOtpSetup(fetchedToken); // Call checkOtpSetup with the fetchedToken
        }
    }, []);

    const checkOtpSetup = async (fetchedToken) => {
        try {
            setLoading(true);

            const response = await executeAjaxOperation({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_CHECK_OTP_SETUP,
                method: 'get',
                token: fetchedToken,
                locale: router.locale || locale,
            });

            if (response.success && response.data.otp_setup) {
                // OTP is already set up
                setOtpUri(response.data.otp_uri);
                setOtpSetup(true);
                setOtpVerified(response.data.verified);
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleEnableOTP = async () => {
        try {
            setLoading(true);

            const response = await executeAjaxOperation({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_OTP,
                method: 'post',
                token,
                locale: router.locale || locale,
            });

            if (response.success) {
                setOtpUri(response.data.otp_uri);
                setOtpSetup(true);
                setOtpVerified(response.data.verified);
            } else {
                setError(response.error || 'An error occurred while enabling OTP.');
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };




    const handleVerifyOTP = async () => {
        try {
            setLoading(true);

            const response = await executeAjaxOperation({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_VERIFY_OTP,
                method: 'post',
                token,
                data: { token: otpCode },
                locale: router.locale || locale,
            });

            if (response.success && response.data.verified) {
                setOtpUri(response.data.otp_uri);
                setOtpSetup(true);
                setOtpVerified(response.data.verified);
                setIsSuccess(true);
                setSuccessMessage(response.data.message);
                setError('');
            } else {
                setError(t(SETUP_OTP_MESSAGES.invalidOTP));
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisableOTP = async () => {
        try {
            setLoading(true);

            const response = await executeAjaxOperation({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_DISABLE_OTP,
                method: 'post',
                token,
                locale: router.locale || locale,
            });

            if (response.success && response.data.success) {
                // Show success message and reset state
                setIsSuccess(true);
                setSuccessMessage(response.data.message);
                setOtpUri(null);
                setOtpSetup(false);
                setOtpVerified(false);
                setError('');
            } else {
                setError(response.error || t(SETUP_OTP_MESSAGES.failedToDisableOTP));
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message || t(SETUP_OTP_MESSAGES.errorOccurred));
        } finally {
            setLoading(false);
        }
    };


    return (
        <Layout>
            <Head>
                <title>{t(SETUP_OTP_MESSAGES.setupOTP)}</title>
                <meta name='description' content='t("SETUP_OTP_MESSAGES.setupOTPForSecurity")' />
            </Head>

            <div className="row">
                <div className="col-lg-12 mb-4 order-0">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title text-primary">
                                {t(SETUP_OTP_MESSAGES.setupOTPForSecurity)}
                            </h5>
                            <p className="mb-4">
                            </p>
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            {isSuccess && (
                                <div className="alert alert-success" role="alert">
                                    {successMessage}
                                </div>
                            )}
                            {otpSetup ? ( // Check if OTP is already set up
                                <>
                                    {otpVerified ? (
                                        <>
                                            <p>{t(SETUP_OTP_MESSAGES.yourOTPSetupComplete)}</p>
                                            <button onClick={handleDisableOTP} className="btn btn-sm btn-danger mt-3">
                                                {t('Disable OTP')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p>{t(SETUP_OTP_MESSAGES.otpSetupNotVerified)}</p>
                                            <p>{t(SETUP_OTP_MESSAGES.scanQRCode)}</p>

                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_QR_SERVER_URL}${encodeURIComponent(otpUri)}`}
                                                alt="OTP QR Code"
                                            />

                                            <p>{t('Or use this secret:')} {otpUri}</p>
                                            <div className="form-group">
                                                <label htmlFor="otpCode">{t('Enter OTP Code:')}</label>
                                                <input
                                                    type="text"
                                                    id="otpCode"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    className="form-control"
                                                />
                                            </div>
                                            <button onClick={handleVerifyOTP} className="btn btn-sm btn-primary mt-3">
                                                {t(SETUP_OTP_MESSAGES.verifyOTP)}
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <button onClick={handleEnableOTP} className="btn btn-sm btn-primary">
                                    {t(SETUP_OTP_MESSAGES.enableOTP)}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {loading && <Loader />}
        </Layout>
    );
};

export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}

SetupOTP.layout = 'default';

export default SetupOTP;
