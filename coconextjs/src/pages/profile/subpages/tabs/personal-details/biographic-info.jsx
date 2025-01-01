import {
    executeAjaxOperation,
    executeAjaxOperationStandard,
    useForm,
    yupResolver,
    yup,
    React,
    useEffect,
    useState
} from '../../../../../utils/commonImports';

const BiographicInfo = ({ biographicInfoDetails, setLoading, setGlobalError, setSuccessMessage, token, t, router }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [initialValues, setInitialValues] = useState({});
    const MIN_DATE_OF_BIRTH = parseInt(process.env.NEXT_PUBLIC_MIN_DATE_OF_BIRTH || '16');

    // Validation schema with translation and trimming
    const dateOfBirthValidation = yup.date()
        .typeError(t('Date of Birth must be a valid date'))
        .required(t('Date of Birth is required'))
        .test(
            'age',
            t(`You must be at least ${MIN_DATE_OF_BIRTH} years old.`),
            function (value) {
                if (!value) return false;
                const today = new Date();
                const birthDate = new Date(value);
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();

                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                    return age - 1 >= MIN_DATE_OF_BIRTH;
                }
                return age >= MIN_DATE_OF_BIRTH;
            }
        );

    // Validation schema with translation and trimming
    const schema = yup.object().shape({
        first_name: yup.string().trim().required(t('First Name is required')),
        last_name: yup.string().trim().required(t('Last Name is required')),
        middle_name: yup.string().trim(),
        date_of_birth: dateOfBirthValidation,
        city_of_birth: yup.string().trim(),
        country_of_birth: yup.string().trim()
    });

    const { register, handleSubmit, setError, clearErrors, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            first_name: '',
            last_name: '',
            middle_name: '',
            date_of_birth: '',
            city_of_birth: '',
            country_of_birth: '',
        },
    });

    useEffect(() => {
        if (biographicInfoDetails) {
            setValue('first_name', biographicInfoDetails.first_name?.trim() || '');
            setValue('last_name', biographicInfoDetails.last_name?.trim() || '');
            setValue('middle_name', biographicInfoDetails.middle_name?.trim() || '');
            setValue('date_of_birth', biographicInfoDetails.date_of_birth || '');
            setValue('city_of_birth', biographicInfoDetails.city_of_birth?.trim() || '');
            setValue('country_of_birth', biographicInfoDetails.country_of_birth?.trim() || '');
            setInitialValues({
                first_name: biographicInfoDetails.first_name?.trim() || '',
                last_name: biographicInfoDetails.last_name?.trim() || '',
                middle_name: biographicInfoDetails.middle_name?.trim() || '',
                date_of_birth: biographicInfoDetails.date_of_birth || '',
                city_of_birth: biographicInfoDetails.city_of_birth?.trim() || '',
                country_of_birth: biographicInfoDetails.country_of_birth?.trim() || ''
            });
        }
    }, [biographicInfoDetails, setValue]);

    const trimValue = (name, value) => {
        setValue(name, value.trim());
    };

    const onSubmit = async (data) => {
        try {
            if (data.date_of_birth) {
                const date = new Date(data.date_of_birth);
                const formattedDate = date.toISOString().split('T')[0];
                data.date_of_birth = formattedDate;
            }
        } catch (error) {
            setSuccessMessage('');
            setGlobalError(t('An error occurred while submitting the form.'));
        }

        try {
            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_BIOGRAPHIC_INFO_DETAILS,
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
        setValue('first_name', initialValues.first_name);
        setValue('last_name', initialValues.last_name);
        setValue('middle_name', initialValues.middle_name);
        setValue('date_of_birth', initialValues.date_of_birth);
        setValue('city_of_birth', initialValues.city_of_birth);
        setValue('country_of_birth', initialValues.country_of_birth);
    };

    return (
        <div>
            {isEditMode ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="row g-2">
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="first-name">{t('First Name')}</label>
                            <input
                                type="text"
                                id="first-name"
                                {...register('first_name')}
                                className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                                placeholder={t('First Name')}
                                onBlur={(e) => trimValue('first_name', e.target.value)}
                            />
                            {errors.first_name && <div className="text-danger">{errors.first_name.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="last-name">{t('Last Name')}</label>
                            <input
                                type="text"
                                id="last-name"
                                {...register('last_name')}
                                className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                                placeholder={t('Last Name')}
                                onBlur={(e) => trimValue('last_name', e.target.value)}
                            />
                            {errors.last_name && <div className="text-danger">{errors.last_name.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="middle-name">{t('Middle Name')}</label>
                            <input
                                type="text"
                                id="middle-name"
                                {...register('middle_name')}
                                className={`form-control ${errors.middle_name ? 'is-invalid' : ''}`}
                                placeholder={t('Middle Name')}
                                onBlur={(e) => trimValue('middle_name', e.target.value)}
                            />
                            {errors.middle_name && <div className="text-danger">{errors.middle_name.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="date-of-birth">{t('Date of Birth')}</label>
                            <input
                                type="date"
                                id="date-of-birth"
                                {...register('date_of_birth')}
                                className={`form-control ${errors.date_of_birth ? 'is-invalid' : ''}`}
                                onBlur={(e) => trimValue('date_of_birth', e.target.value)}
                            />
                            {errors.date_of_birth && <div className="text-danger">{errors.date_of_birth.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="city-of-birth">{t('City of Birth')}</label>
                            <input
                                type="text"
                                id="city-of-birth"
                                {...register('city_of_birth')}
                                className={`form-control ${errors.city_of_birth ? 'is-invalid' : ''}`}
                                placeholder={t('City of Birth')}
                                onBlur={(e) => trimValue('city_of_birth', e.target.value)}
                            />
                            {errors.city_of_birth && <div className="text-danger">{errors.city_of_birth.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="country-of-birth">{t('Country of Birth')}</label>
                            <input
                                type="text"
                                id="country-of-birth"
                                {...register('country_of_birth')}
                                className={`form-control ${errors.country_of_birth ? 'is-invalid' : ''}`}
                                placeholder={t('Country of Birth')}
                                onBlur={(e) => trimValue('country_of_birth', e.target.value)}
                            />
                            {errors.country_of_birth && <div className="text-danger">{errors.country_of_birth.message}</div>}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm mt-3">{t('Save')}</button>
                    <button type="button" className="btn btn-secondary btn-sm mt-3 ms-2" onClick={handleCancel}>{t('Cancel')}</button>
                </form>
            ) : (
                <div>
                    <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-warning btn-sm" onClick={() => setIsEditMode(true)}>{t('Edit')}</button>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <p><strong>{t('First Name')}:</strong> {initialValues.first_name || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Last Name')}:</strong> {initialValues.last_name || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p className='mt-2'><strong>{t('Middle Name')}:</strong> {initialValues.middle_name || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p className='mt-2'><strong>{t('Date of Birth')}:</strong> {initialValues.date_of_birth || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p className='mt-2'><strong>{t('City of Birth')}:</strong> {initialValues.city_of_birth || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p className='mt-2'><strong>{t('Country of Birth')}:</strong> {initialValues.country_of_birth || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BiographicInfo;
