// pages/profile/subpages/sop.jsx

import {
    React,
    useState,
    executeAjaxOperationStandard,
    yup,
    Loader,
} from '../../../utils/commonImports';

import useCommonForm from '../../../hooks/useCommonForm';

const SOP = ({ onReply, token, locale }) => {

    const {
        t,
        formRef,
        loading,
        setLoading,
    } = useCommonForm();

    const [sopError, setSopError] = useState('');

    // Validation schema for SOP
    const sopSchema = yup.object().shape({
        sop: yup
            .mixed()
            .test('fileType', t('Please upload a PDF file for SOP.'), (value) => !value || value.type === 'application/pdf')
            .nullable()
            .required(t('Please upload a SOP file.')),
    });

    // Handle SOP form submission
    const handleSopSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const sopFile = formData.get('sop');

        try {
            await sopSchema.validate({ sop: sopFile }, { abortEarly: false });
            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_SOP_INFO_DETAILS,
                method: 'post',
                token,
                formData,
                locale,
            });

            if (response.data) {
                onReply(response.data);
                setSopError('');
                formRef.current.reset();
            } else {
                onReply(response);
                if (response.details) {
                    Object.keys(response.details).forEach((field) => {
                        setSopError(response.details[field][0]);
                    });
                } else {
                    setSopError(response.message || t('An error occurred while uploading SOP.'));
                }
            }

        } catch (error) {
            if (error.inner) {
                const validationError = error.inner.find((err) => err.path === 'sop');
                if (validationError) {
                    setSopError(validationError.message);
                }
            } else {
                setSopError(error.message || t('Error uploading SOP.'));
            }
            onReply(t('SOP upload operation is failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form ref={formRef} onSubmit={handleSopSubmit}>
            <div className="mb-3">
                <input
                    type="file"
                    accept=".pdf"
                    className={`form-control ${sopError ? 'is-invalid' : ''}`}
                    id="sop"
                    name="sop"
                />
                {sopError && <div className="text-danger">{sopError}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-sm">{t('Upload SOP')}</button>
            {loading && <Loader />}
        </form>
    );
};

export default SOP;
