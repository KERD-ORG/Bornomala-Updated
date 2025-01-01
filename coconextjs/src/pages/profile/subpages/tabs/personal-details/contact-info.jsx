import {
    executeAjaxOperationStandard,
    useForm,
    yupResolver,
    yup,
    React,
    useEffect,
    Select,
    useState,
    classNames
} from '../../../../../utils/commonImports';

import { Controller } from 'react-hook-form';

const ContactInfo = ({ states, countries, contactInfoDetails, setLoading, setGlobalError, setSuccessMessage, token, t, router }) => {
    const [showPermanentAddress, setShowPermanentAddress] = useState(contactInfoDetails?.permanent_address_status === false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [initialValues, setInitialValues] = useState({});

    const schema = yup.object().shape({
        current_address_line1: yup.string().required(t('Current Address Line 1 is required')),
        current_address_line2: yup.string(),
        current_city: yup.string().required(t('Current City is required')),
        current_postal_code: yup.string().required(t('Current Postal Code is required')),
        current_country: yup.string().required(t('Current Country is required')),

        current_state_province: yup.string().when('current_country', (current_country, schema) => {
            if (states.some(state => state.country_code === current_country[0])) {
                return schema.required(t('Current State/Province is required'));
            } else {
                return schema.notRequired();
            }
        }),

        permanent_address_line1: yup.string().when("permanent_address_status", (val, schema) => {
            if (!val[0]) return yup.string().required(t('Permanent Address Line 1 is required'));
            else return yup.string().notRequired();
        }),

        permanent_address_line2: yup.string(),

        permanent_city: yup.string().when("permanent_address_status", (val, schema) => {
            if (!val[0]) return yup.string().required(t('Permanent City is required'));
            else return yup.string().notRequired();
        }),

        permanent_state_province: yup.string().when(['permanent_address_status', 'permanent_country'], {
            is: (permanent_address_status, permanent_country) => {
                if (!permanent_address_status) {
                    if (states.some(state => state.country_code === permanent_country)) {
                        return true;
                    }
                }
            },
            then: (schema) =>
                schema.required(t('Permanent State/Province is required'))
        }),

        permanent_postal_code: yup.string().when("permanent_address_status", (val, schema) => {
            if (!val[0]) return yup.string().required(t('Permanent Postal Code is required'));
            else return yup.string().notRequired();
        }),

        permanent_country: yup.string().when("permanent_address_status", (val, schema) => {
            if (!val[0]) return yup.string().required(t('Permanent Country is required'));
            else return yup.string().notRequired();
        }),

    });


    const { register, handleSubmit, setValue, clearErrors, control, formState: { errors, isValid }, watch } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            current_address_line1: contactInfoDetails?.current_address_line1 || '',
            current_address_line2: contactInfoDetails?.current_address_line2 || '',
            current_city: contactInfoDetails?.current_city || '',
            current_state_province: contactInfoDetails?.current_state_province || '',
            current_postal_code: contactInfoDetails?.current_postal_code || '',
            current_country: contactInfoDetails?.current_country || '',
            permanent_address_line1: contactInfoDetails?.permanent_address_line1 || '',
            permanent_address_line2: contactInfoDetails?.permanent_address_line2 || '',
            permanent_city: contactInfoDetails?.permanent_city || '',
            permanent_state_province: contactInfoDetails?.permanent_state_province || '',
            permanent_postal_code: contactInfoDetails?.permanent_postal_code || '',
            permanent_country: contactInfoDetails?.permanent_country || '',
            permanent_address_status: contactInfoDetails?.permanent_address_status || false,
        }
    });


    const watchCurrentCountry = watch('current_country');
    const watchPermanentCountry = watch('permanent_country');


    useEffect(() => {
        // Register 'permanent_address_status' field
        register('permanent_address_status');

        // Populate form fields with initial values from contactInfoDetails
        if (contactInfoDetails) {

            const {
                current_address_line1,
                current_address_line2,
                current_city,
                current_state_province,
                current_state_province_name,
                current_postal_code,
                current_country,
                current_country_name,
                permanent_address_line1,
                permanent_address_line2,
                permanent_city,
                permanent_state_province,
                permanent_state_province_name,
                permanent_postal_code,
                permanent_country,
                permanent_country_name,
                permanent_address_status
            } = contactInfoDetails;

            togglePermanentAddress(permanent_address_status);

            // Set values using setValue
            setValue('current_address_line1', current_address_line1 || '');
            setValue('current_address_line2', current_address_line2 || '');
            setValue('current_city', current_city || '');
            setValue('current_state_province', current_state_province || '');
            setValue('current_state_province_name', current_state_province_name || '');
            setValue('current_postal_code', current_postal_code || '');
            setValue('current_country', current_country || '');
            setValue('current_country_name', current_country_name || '');
            setValue('permanent_address_line1', permanent_address_line1 || '');
            setValue('permanent_address_line2', permanent_address_line2 || '');
            setValue('permanent_city', permanent_city || '');
            setValue('permanent_state_province', permanent_state_province || '');
            setValue('permanent_state_province_name', permanent_state_province_name || '');
            setValue('permanent_postal_code', permanent_postal_code || '');
            setValue('permanent_country', permanent_country || '');
            setValue('permanent_country_name', permanent_country_name || '');
            setValue('permanent_address_status', permanent_address_status || false);

            // Set initial values state
            setInitialValues({
                current_address_line1: current_address_line1 || '',
                current_address_line2: current_address_line2 || '',
                current_city: current_city || '',
                current_state_province: current_state_province || '',
                current_state_province_name: current_state_province_name || '',
                current_postal_code: current_postal_code || '',
                current_country: current_country || '',
                current_country_name: current_country_name || '',
                permanent_address_line1: permanent_address_line1 || '',
                permanent_address_line2: permanent_address_line2 || '',
                permanent_city: permanent_city || '',
                permanent_state_province: permanent_state_province || '',
                permanent_state_province_name: permanent_state_province_name || '',
                permanent_postal_code: permanent_postal_code || '',
                permanent_country: permanent_country || '',
                permanent_country_name: permanent_country_name || '',
                permanent_address_status: permanent_address_status || false,
            });


        }
    }, [contactInfoDetails, register, setValue, setInitialValues]);


    const togglePermanentAddress = (value) => {
        const isPermanent = value === 'yes';
        setShowPermanentAddress(!isPermanent);
        setValue('permanent_address_status', isPermanent);
    };

    const handleBlur = (e) => {
        setValue(e.target.name, e.target.value.trim());
    };

    const onSubmit = async (data) => {
        try {
            console.log(data.permanent_address_status)
            if (!data.permanent_state_province.trim()) {
                data.permanent_state_province = null;
            }
            if (!data.current_state_province.trim()) {
                data.current_state_province = null;
            }

            if (!data.permanent_address_status) {
                data.permanent_address_status = 1;
            } else {
                data.permanent_address_status = 0;
            }

            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_CONTACT_INFO_DETAILS,
                method: 'put',
                token,
                data,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setSuccessMessage(response.data.message || t('Form submitted successfully.'));
                setGlobalError('');
                setInitialValues(response.data.data); // Update initialValues with the latest saved data
                setIsEditMode(false);
                //console.log(response.data.data.permanent_address_status)
                setShowPermanentAddress(true);
                console.log(showPermanentAddress);
                console.log(response.data.data.permanent_address_status)
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
            console.log(error)
            let errorMessage = t('An error occurred while submitting the form.');
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            setGlobalError(errorMessage);
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditMode(false);
        clearErrors();


    };

    return (
        <div>
            {!isEditMode && (
                <div>

                    <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-warning btn-sm" onClick={() => setIsEditMode(true)}>{t('Edit')}</button>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <p><strong>{t('Current Address Line 1')}: </strong>{initialValues?.current_address_line1}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Current Address Line 2')}: </strong>{initialValues?.current_address_line2}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Current City')}: </strong>{initialValues?.current_city}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Current State/Province')}: </strong>{initialValues?.current_state_province_name}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Current Postal Code')}: </strong>{initialValues?.current_postal_code}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Current Country')}: </strong>{initialValues?.current_country_name}</p>
                            <hr className="my-1" />
                        </div>
                        {!initialValues?.permanent_address_status && showPermanentAddress && (
                            <>
                                <div className="col-sm-6">
                                    <p><strong>{t('Permanent Address Line 1')}: </strong>{initialValues?.permanent_address_line1}</p>
                                    <hr className="my-1" />
                                </div>
                                <div className="col-sm-6">
                                    <p><strong>{t('Permanent Address Line 2')}: </strong>{initialValues?.permanent_address_line2}</p>
                                    <hr className="my-1" />
                                </div>
                                <div className="col-sm-6">
                                    <p><strong>{t('Permanent City')}: </strong>{initialValues?.permanent_city}</p>
                                    <hr className="my-1" />
                                </div>
                                <div className="col-sm-6">
                                    <p><strong>{t('Permanent State/Province')}: </strong>{initialValues?.permanent_state_province_name}</p>
                                    <hr className="my-1" />
                                </div>
                                <div className="col-sm-6">
                                    <p><strong>{t('Permanent Postal Code')}: </strong>{initialValues?.permanent_postal_code}</p>
                                    <hr className="my-1" />
                                </div>
                                <div className="col-sm-6">
                                    <p><strong>{t('Permanent Country')}: </strong>{initialValues?.permanent_country_name}</p>
                                    <hr className="my-1" />
                                </div>
                            </>
                        )}
                    </div>

                </div>
            )}

            {isEditMode && (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="">

                        <div className="row g-2">

                            <div className="col-sm-6">
                                <label className="form-label">{t('Current Country')}</label>
                                <Controller
                                    name="current_country"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className={`form-control ${errors.current_country ? 'is-invalid' : ''}`}
                                            onChange={(e) => {
                                                const selectedCountry = e.target.value;
                                                setValue('current_state_province', ''); // Reset state/province field
                                                setValue('current_country', selectedCountry);
                                            }}
                                        >
                                            <option value="">{t('Select Country')}</option>
                                            {countries.map(country => (
                                                <option key={country.value} value={country.value}>
                                                    {country.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />

                                {errors.current_country && (
                                    <div className="invalid-feedback">{errors.current_country.message}</div>
                                )}
                            </div>

                            <div className="col-sm-6">
                                <label className="form-label">{t('Current State/Province')}</label>
                                <Controller
                                    name="current_state_province"
                                    control={control}
                                    rules={{
                                        required: {
                                            value: !!watchCurrentCountry,
                                            message: 'Current State/Province is required',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            disabled={!watchCurrentCountry}
                                            className={`form-select ${errors.current_state_province ? 'is-invalid' : ''}`}
                                        >
                                            <option value="">{watchCurrentCountry ? t('Select State/Province') : t('Select Country First')}</option>
                                            {states
                                                .filter(state => state.country_code === watchCurrentCountry)
                                                .map(state => (
                                                    <option key={state.value} value={state.value}>
                                                        {state.label}
                                                    </option>
                                                ))}
                                        </select>
                                    )}
                                />
                                {errors.current_state_province && (
                                    <div className="invalid-feedback">{errors.current_state_province.message}</div>
                                )}
                            </div>

                            <div className="col-sm-6">
                                <label className="form-label">{t('Current Address Line 1')}</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.current_address_line1 ? 'is-invalid' : ''}`}
                                    placeholder={t('Current Address Line 1')}
                                    {...register('current_address_line1')}
                                    onBlur={handleBlur}
                                />
                                {errors.current_address_line1 && (
                                    <div className="invalid-feedback">{errors.current_address_line1.message}</div>
                                )}
                            </div>
                            <div className="col-sm-6">
                                <label className="form-label">{t('Current Address Line 2')}</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.current_address_line2 ? 'is-invalid' : ''}`}
                                    placeholder={t('Current Address Line 2')}
                                    {...register('current_address_line2')}
                                    onBlur={handleBlur}
                                />
                                {errors.current_address_line2 && (
                                    <div className="invalid-feedback">{errors.current_address_line2.message}</div>
                                )}
                            </div>
                            <div className="col-sm-6">
                                <label className="form-label">{t('Current City')}</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.current_city ? 'is-invalid' : ''}`}
                                    placeholder={t('Current City')}
                                    {...register('current_city')}
                                    onBlur={handleBlur}
                                />
                                {errors.current_city && (
                                    <div className="invalid-feedback">{errors.current_city.message}</div>
                                )}
                            </div>

                            <div className="col-sm-6">
                                <label className="form-label">{t('Current Postal Code')}</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.current_postal_code ? 'is-invalid' : ''}`}
                                    placeholder={t('Current Postal Code')}
                                    {...register('current_postal_code')}
                                    onBlur={handleBlur}
                                />
                                {errors.current_postal_code && (
                                    <div className="invalid-feedback">{errors.current_postal_code.message}</div>
                                )}
                            </div>

                            <div className="col-sm-12 mb-3">
                                <label className="form-label">{t('Is this your permanent address?')}</label>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        id="permanent_address_status_yes"
                                        name="permanent_address_status"
                                        className="form-check-input"
                                        value="yes"
                                        checked={!showPermanentAddress}
                                        onChange={() => togglePermanentAddress('yes')}
                                    />
                                    <label className="form-check-label ms-2" htmlFor="permanent_address_status_yes">{t('Yes')}</label>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        id="permanent_address_status_no"
                                        name="permanent_address_status"
                                        className="form-check-input"
                                        value="no"
                                        checked={showPermanentAddress}
                                        onChange={() => togglePermanentAddress('no')}
                                    />
                                    <label className="form-check-label ms-2" htmlFor="permanent_address_status_no">{t('No')}</label>
                                </div>
                                {errors.permanent_address_status && (
                                    <div className="text-danger">{errors.permanent_address_status.message}</div>
                                )}
                            </div>
                            {showPermanentAddress && (
                                <>
                                    <div className="col-sm-6">
                                        <label className="form-label">{t('Permanent Country')}</label>
                                        <Controller
                                            name="permanent_country"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    className={`form-control ${errors.permanent_country ? 'is-invalid' : ''}`}
                                                    onChange={(e) => {
                                                        const selectedCountry = e.target.value;
                                                        setValue('permanent_state_province', ''); // Reset state/province field
                                                        setValue('permanent_country', selectedCountry);
                                                    }}
                                                >
                                                    <option value="">{t('Select Country')}</option>
                                                    {countries.map(country => (
                                                        <option key={country.value} value={country.value}>
                                                            {country.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        />

                                        {errors.permanent_country && (
                                            <div className="invalid-feedback">{errors.permanent_country.message}</div>
                                        )}
                                    </div>


                                    <div className="col-sm-6">
                                        <label className="form-label">{t('Permanent State/Province')}</label>

                                        <Controller
                                            name="permanent_state_province"
                                            control={control}
                                            rules={{
                                                required: {
                                                    value: !!watchPermanentCountry,
                                                    message: 'Permanent State/Province is required',
                                                },
                                            }}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    disabled={!watchPermanentCountry}
                                                    className={`form-select ${errors.permanent_state_province ? 'is-invalid' : ''}`}
                                                >
                                                    <option value="">{watchPermanentCountry ? t('Select State/Province') : t('Select Country First')}</option>
                                                    {states
                                                        .filter(state => state.country_code === watchPermanentCountry)
                                                        .map(state => (
                                                            <option key={state.value} value={state.value}>
                                                                {state.label}
                                                            </option>
                                                        ))}
                                                </select>
                                            )}
                                        />

                                        {errors.permanent_state_province && (
                                            <div className="invalid-feedback">{errors.permanent_state_province.message}</div>
                                        )}
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">{t('Permanent Address Line 1')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.permanent_address_line1 ? 'is-invalid' : ''}`}
                                            placeholder={t('Permanent Address Line 1')}
                                            {...register('permanent_address_line1')}
                                            onBlur={handleBlur}
                                        />
                                        {errors.permanent_address_line1 && (
                                            <div className="invalid-feedback">{errors.permanent_address_line1.message}</div>
                                        )}
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="form-label">{t('Permanent Address Line 2')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.permanent_address_line2 ? 'is-invalid' : ''}`}
                                            placeholder={t('Permanent Address Line 2')}
                                            {...register('permanent_address_line2')}
                                            onBlur={handleBlur}
                                        />
                                        {errors.permanent_address_line2 && (
                                            <div className="invalid-feedback">{errors.permanent_address_line2.message}</div>
                                        )}
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="form-label">{t('Permanent City')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.permanent_city ? 'is-invalid' : ''}`}
                                            placeholder={t('Permanent City')}
                                            {...register('permanent_city')}
                                            onBlur={handleBlur}
                                        />
                                        {errors.permanent_city && (
                                            <div className="invalid-feedback">{errors.permanent_city.message}</div>
                                        )}
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">{t('Permanent Postal Code')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.permanent_postal_code ? 'is-invalid' : ''}`}
                                            placeholder={t('Permanent Postal Code')}
                                            {...register('permanent_postal_code')}
                                            onBlur={handleBlur}
                                        />
                                        {errors.permanent_postal_code && (
                                            <div className="invalid-feedback">{errors.permanent_postal_code.message}</div>
                                        )}
                                    </div>

                                </>
                            )}
                        </div>
                        <div className="mt-3">
                            <button type="submit" className="btn btn-primary btn-sm me-2">{t('Save')}</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel}>{t('Cancel')}</button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ContactInfo;
