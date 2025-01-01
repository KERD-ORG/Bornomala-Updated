import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { executeAjaxOperationStandard } from '../../../../../utils/commonImports';

const AcknowledgementInfo = ({ acknowledgementInfoDetails, setLoading, setGlobalError, setSuccessMessage, token, t, router }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [acknowledgement, setAcknowledgement] = useState(false); // State to hold acknowledgment status

    const schema = yup.object().shape({
        acknowledgement: yup.boolean().required(t('Acknowledgement is required')),
    });

    const { register, handleSubmit, setError, clearErrors, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            acknowledgement: false,
        },
    });

    useEffect(() => {
        if (acknowledgementInfoDetails) {
            setValue('acknowledgement', acknowledgementInfoDetails.acknowledgement || false);
            setAcknowledgement(acknowledgementInfoDetails.acknowledgement || false); // Update state with acknowledgment status
        }
    }, [acknowledgementInfoDetails, setValue]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_ACKNOWLEDGEMENT_INFO_DETAILS,
                method: 'put',
                token,
                data: {
                    acknowledgement: data.acknowledgement ? 1 : 0,
                },
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setSuccessMessage(response.data.message || t('Acknowledgement submitted successfully.'));
                setGlobalError('');
                setIsEditMode(false);

                // Update local state with the new acknowledgment status
                setAcknowledgement(data.acknowledgement);
            } else {
                setSuccessMessage('');
                setGlobalError(t(response.message));
                if (response.details) {
                    Object.keys(response.details).forEach((field) => {
                        setError(field, {
                            type: 'server',
                            message: response.details[field][0],
                        });
                    });
                }
            }

        } catch (error) {
            console.log(error);
            setGlobalError(t('An error occurred while submitting the form.'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditMode(false);
        clearErrors();
        setValue('acknowledgement', acknowledgementInfoDetails.acknowledgement || false);
    };

    return (
        <div>
            {isEditMode ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="acknowledgement"
                            {...register('acknowledgement')}
                        />
                        <label className="form-check-label" htmlFor="acknowledgement">
                            {t('I acknowledge that all the information I have provided is accurate.')}
                        </label>
                        {errors.acknowledgement && <div className="text-danger">{errors.acknowledgement.message}</div>}
                    </div>
                    <div className="mt-3">
                        <button type="submit" className="btn btn-primary btn-sm me-2">{t('Submit')}</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel}>{t('Cancel')}</button>
                    </div>
                </form>
            ) : (
                <div>
                    <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-warning btn-sm" onClick={() => setIsEditMode(true)}>{t('Edit')}</button>
                    </div>
                    <div>
                        <p>
                            <strong>{t('I acknowledge that all the information I have provided is accurate.')}:</strong> {acknowledgement ? t('Yes') : t('No')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcknowledgementInfo;
