// pages/profile/subpages/resume.jsx

import {
    React,
    useState,
    executeAjaxOperationStandard,
    yup,
    Loader,
} from '../../../utils/commonImports';

import useCommonForm from '../../../hooks/useCommonForm';

const Resume = ({ onReply, token, locale }) => {

    const {
        t,
        formRef,
        loading,
        setLoading,
    } = useCommonForm();

    const [resumeError, setResumeError] = useState('');

    // Validation schema for Resume
    const resumeSchema = yup.object().shape({
        resume: yup
            .mixed()
            .test('fileType', t('Please upload a PDF file for Resume.'), (value) => !value || value.type === 'application/pdf')
            .nullable()
            .required(t('Please upload a Resume file.')),
    });


    // Handle Resume form submission
    const onSubmit = async (formData) => {
        try {
            await resumeSchema.validate({ resume: formData.get('resume') }, { abortEarly: false });

            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_RESUME_INFO_DETAILS,
                method: 'post',
                token,
                formData,
                locale,
            });

            if (response.data) {
                onReply(response.data);
                setResumeError('');
                formRef.current.reset();
            } else {
                onReply(response);
                if (response.details) {
                    Object.keys(response.details).forEach((field) => {
                        setResumeError(response.details[field][0]);
                    });
                } else {
                    setResumeError(response.message || t('An error occurred while uploading Resume.'));
                }
            }
        } catch (error) {
            if (error.inner) {
                const validationError = error.inner.find((err) => err.path === 'resume');
                if (validationError) {
                    setResumeError(validationError.message);
                }
            } else {
                setResumeError(error.message || t('Error uploading Resume.'));
            }
            onReply(t('Resume upload operation is failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form ref={formRef} onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(formRef.current));
        }}>
            <div className="mb-3">
                <input
                    type="file"
                    accept=".pdf"
                    className={`form-control ${resumeError ? 'is-invalid' : ''}`}
                    id="resume"
                    name="resume"
                />
                {resumeError && <div className="text-danger">{resumeError}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-sm">{t('Upload Resume')}</button>
            {loading && <Loader />}
        </form>
    );
};

export default Resume;