import React, { useEffect, useState } from 'react';
import {
    executeAjaxOperationStandard,
    useForm,
    yupResolver,
    yup
} from '../../../../../utils/commonImports';

const EthnicityInfo = ({ ethnicitys, ethnicityInfoDetails, setLoading, setGlobalError, setSuccessMessage, token, t, router }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [initialValues, setInitialValues] = useState({});
    
    // Validation schema
    const schema = yup.object().shape({
        ethnicity: yup.string().required(t('Ethnicity is required')),
        ethnicity_details: yup.string().trim(),
        ethnicity_origin: yup.string().required(t('This field is required')),
        ethnicity_reporting: yup.string().required(t('Preference on Ethnicity Reporting is required')),
    });
    
    const { register, handleSubmit, setError, clearErrors, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            ethnicity: '',
            ethnicity_details: '',
            ethnicity_origin: '',
            ethnicity_reporting: '',
        },
    });

    useEffect(() => {
        if (ethnicityInfoDetails) {
            setValue('ethnicity', ethnicityInfoDetails.ethnicity || '');
            setValue('ethnicity_details', ethnicityInfoDetails.ethnicity_details || '');
            setValue('ethnicity_origin', ethnicityInfoDetails.ethnicity_origin?.toString() || '');
            setValue('ethnicity_reporting', ethnicityInfoDetails.ethnicity_reporting?.toString() || '');
            setInitialValues({
                ethnicity: ethnicityInfoDetails.ethnicity || '',
                ethnicity_details: ethnicityInfoDetails.ethnicity_details || '',
                ethnicity_origin: ethnicityInfoDetails.ethnicity_origin?.toString() || '',
                ethnicity_reporting: ethnicityInfoDetails.ethnicity_reporting?.toString() || '',
            });
        }
    }, [ethnicityInfoDetails, setValue]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_ETHNICITY_INFO_DETAILS,
                method: 'put',
                token,
                data,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setSuccessMessage(response.data.message || t('Form submitted successfully.'));
                setGlobalError('');
                setInitialValues(data); // Update initialValues with the latest saved data
                setIsEditMode(false);
            } else {
                setSuccessMessage('');
                setGlobalError(t(response.message)); // Ensure to access the correct message field
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
        clearErrors(); // Clear all validation errors
        setValue('ethnicity', initialValues.ethnicity || '');
        setValue('ethnicity_details', initialValues.ethnicity_details || '');
        setValue('ethnicity_origin', initialValues.ethnicity_origin?.toString() || '');
        setValue('ethnicity_reporting', initialValues.ethnicity_reporting?.toString() || '');
    };

    return (
        <div>
            {isEditMode ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="row g-2">
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="ethnicity">{t('Select Ethnicity')}</label>
                            <select
                                id="ethnicity"
                                {...register('ethnicity')}
                                className={`form-control ${errors.ethnicity ? 'is-invalid' : ''}`}
                                onBlur={(e) => setValue('ethnicity', e.target.value)}
                            >
                                {ethnicitys.map((ethnicity) => (
                                    <option key={ethnicity.value} value={ethnicity.value}>{t(ethnicity.label)}</option>
                                ))}
                            </select>
                            {errors.ethnicity && <div className="text-danger">{errors.ethnicity.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="ethnicity_details">{t('Ethnicity Details (optional)')}</label>
                            <input
                                type="text"
                                id="ethnicity_details"
                                {...register('ethnicity_details')}
                                className={`form-control ${errors.ethnicity_details ? 'is-invalid' : ''}`}
                                placeholder={t('Specify details if applicable')}
                                onBlur={(e) => setValue('ethnicity_details', e.target.value.trim())}
                            />
                            {errors.ethnicity_details && <div className="text-danger">{errors.ethnicity_details.message}</div>}
                        </div>
                        <div className="col-sm-6 mt-3">
                            <label className="form-label">{t('Are you of Hispanic/Latino/Spanish origin?')}</label><br />
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="ethnicity_originYes"
                                    {...register('ethnicity_origin')}
                                    value="1"
                                    defaultChecked={initialValues.ethnicity_origin === "1"}
                                    onChange={() => setValue('ethnicity_origin', "1")}
                                />
                                <label className="form-check-label" htmlFor="ethnicity_originYes">{t('Yes')}</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="ethnicity_originNo"
                                    {...register('ethnicity_origin')}
                                    value="0"
                                    defaultChecked={initialValues.ethnicity_origin === "0"}
                                    onChange={() => setValue('ethnicity_origin', "0")}
                                />
                                <label className="form-check-label" htmlFor="ethnicity_originNo">{t('No')}</label>
                            </div>
                            {errors.ethnicity_origin && <div className="text-danger">{errors.ethnicity_origin.message}</div>}
                        </div>
                        <div className="col-sm-6 mt-3">
                            <label className="form-label">{t('Preference on Ethnicity Reporting')}</label><br />
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="ethnicity_reportingYes"
                                    {...register('ethnicity_reporting')}
                                    value="1"
                                    defaultChecked={initialValues.ethnicity_reporting === "1"}
                                    onChange={() => setValue('ethnicity_reporting', "1")}
                                />
                                <label className="form-check-label" htmlFor="ethnicity_reportingYes">{t('Yes')}</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="ethnicity_reportingNo"
                                    {...register('ethnicity_reporting')}
                                    value="0"
                                    defaultChecked={initialValues.ethnicity_reporting === "0"}
                                    onChange={() => setValue('ethnicity_reporting', "0")}
                                />
                                <label className="form-check-label" htmlFor="ethnicity_reportingNo">{t('No')}</label>
                            </div>
                            {errors.ethnicity_reporting && <div className="text-danger">{errors.ethnicity_reporting.message}</div>}
                        </div>
                    </div>
                    <div className="mt-3">
                        <button type="submit" className="btn btn-primary btn-sm me-2">{t('Save')}</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel}>{t('Cancel')}</button>
                    </div>
                </form>
            ) : (
                <div>
                    <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-warning btn-sm" onClick={() => setIsEditMode(true)}>{t('Edit')}</button>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <p><strong>{t('Selected Ethnicity')}: </strong> {initialValues.ethnicity || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        {initialValues.ethnicity_details &&
                            <div className="col-sm-6">
                                <p><strong>{t('Ethnicity Details')}: </strong> {initialValues.ethnicity_details}</p>
                                <hr className="my-1" />
                            </div>
                        }
                        <div className="col-sm-6">
                            <p><strong>{t('Hispanic/Latino/Spanish origin')}: </strong> {initialValues.ethnicity_origin === null ? <span className="text-muted">{t('Not provided')}</span> : initialValues.ethnicity_origin === "1" ? t('Yes') : t('No')}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Preference on Ethnicity Reporting')}: </strong> {initialValues.ethnicity_reporting === null ? <span className="text-muted">{t('Not provided')}</span> : initialValues.ethnicity_reporting === "1" ? t('Yes') : t('No')}</p>
                            <hr className="my-1" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EthnicityInfo;
