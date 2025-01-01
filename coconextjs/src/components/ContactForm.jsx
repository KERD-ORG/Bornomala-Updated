import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { React, useRef, useState, useCallback, useEffect, useRouter, axios, getToken, executeAjaxOperation, profileTabOrder, PrevNextButtons, Select, CreatableSelect, useTranslation, Loader, CustomAlert } from '../utils/commonImports';

const ContactForm = ({ t, locale }) => {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { executeRecaptcha } = useGoogleReCaptcha(); 

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        if (!executeRecaptcha) {
            setErrorMessage('ReCAPTCHA is not ready.');
            return;
        }
        const gReCaptchaToken = await executeRecaptcha();
        const data = { full_name: fullName, email, message, gReCaptchaToken };
        
        try {
            // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_CONTACT}`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(data),
            // });
            const response = await executeAjaxOperation({
                url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_CONTACT}`,
                method: 'post',
                data: JSON.stringify(data),
                locale: router.locale || locale,
            });
            setLoading(false);

            if (!response.success) {
                throw new Error(t(error.message));
            }
            setSuccessMessage(t(response.data.message || 'Message sent successfully!'));
            setFullName('');
            setEmail('');
            setMessage('');
        } catch (error) {
            setErrorMessage(t("An error occurred."));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {errorMessage && (
                <CustomAlert
                    message={errorMessage}
                    dismissable={true}
                    timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
                    onClose={() => setErrorMessage('')}
                    type="danger"
                />
            )}
            {successMessage && (
                <CustomAlert
                    message={successMessage}
                    dismissable={true}
                    timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
                    onClose={() => setSuccessMessage('')}
                    type="success"
                />
            )}
            <div className="row g-4">
                <div className="col-md-6">
                    <label className="form-label" htmlFor="contact-form-fullname">
                        {t('Full Name')}
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="contact-form-fullname"
                        placeholder="john"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="contact-form-email">
                        {t('Email')}
                    </label>
                    <input
                        type="email"
                        id="contact-form-email"
                        className="form-control"
                        placeholder="johndoe@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="contact-form-message">
                        {t('Message')}
                    </label>
                    <textarea
                        id="contact-form-message"
                        className="form-control"
                        rows={9}
                        placeholder="Write a message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                </div>
                <div className="col-12">
                    <button type="submit" className="btn btn-primary">
                        {t('Send Message')}
                    </button>
                </div>
                {loading && <Loader />}
            </div>
        </form>
    );
};

export default ContactForm;