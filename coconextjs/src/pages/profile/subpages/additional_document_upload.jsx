import {
    React,
    useState,
    executeAjaxOperationStandard,
    yup,
    Loader,
} from '../../../utils/commonImports';
import useCommonForm from '../../../hooks/useCommonForm';

const AdditionalDocumentUpload = ({ onReply, token, locale }) => {
    const {
        t,
        formRef,
        loading,
        setLoading,
    } = useCommonForm();

    const [documentError, setDocumentError] = useState('');

    // Validation schema for additional documents
    const documentSchema = yup.object().shape({
        additional_document: yup
            .mixed()
            .test('fileType', t('Please upload a PDF, PNG, JPG, or JPEG file.'), (value) => {
                return !value || ['application/pdf', 'image/png', 'image/jpeg'].includes(value.type);
            })
            .nullable()
            .required(t('Please upload an additional document.')),
    });

    // Handle additional document form submission
    const handleDocumentSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const documentFile = formData.get('additional_document');

        try {
            await documentSchema.validate({ additional_document: documentFile }, { abortEarly: false });
            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_ADDITIONAL_DOCUMENTS,
                method: 'post',
                token,
                formData,
                locale,
            });

            if (response.data) {
                onReply(response.data);
                setDocumentError('');
                formRef.current.reset();
            } else {
                onReply(response);
                if (response.details) {
                    Object.keys(response.details).forEach((field) => {
                        setDocumentError(response.details[field][0]);
                    });
                } else {
                    setDocumentError(response.message || t('An error occurred while uploading the document.'));
                }
            }

        } catch (error) {
            if (error.inner) {
                const validationError = error.inner.find((err) => err.path === 'additional_document');
                if (validationError) {
                    setDocumentError(validationError.message);
                }
            } else {
                setDocumentError(error.message || t('Error uploading the document.'));
            }
            onReply(t('Document upload operation failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form ref={formRef} onSubmit={handleDocumentSubmit}>
            <div className="mb-3">
                <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className={`form-control ${documentError ? 'is-invalid' : ''}`}
                    id="additional_document"
                    name="additional_document"
                />
                {documentError && <div className="text-danger">{documentError}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-sm">{t('Upload Document')}</button>
            {loading && <Loader />}
        </form>
    );
};

export default AdditionalDocumentUpload;
