import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Controller } from 'react-hook-form';

import {
    executeAjaxOperationStandard,
    useForm,
    yupResolver,
    yup
} from '../../../../../utils/commonImports';

const OtherInfo = ({ languages, otherInfoDetails, setLoading, setGlobalError, setSuccessMessage, token, t, router }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [first_language_name, setFirstLanguageName] = useState('');
    const [additionalLanguagesNames, setAdditionalLanguagesNames] = useState([]);

    const [initialValues, setInitialValues] = useState({
        first_language: '',
        languages: [],
        parent_education: '',
        other_languages: '',
    });


    const schema = yup.object().shape({
        
        parent_education: yup.string().required(t('Parent education is required')),
    });

    const { register, handleSubmit, setError, clearErrors, setValue, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            first_language: '',
            languages: [],
            parent_education: '',
            other_languages: '',
        },
    });

    useEffect(() => {
        if (otherInfoDetails) {
            setValue('first_language', otherInfoDetails.first_language || '');
            setValue('languages', otherInfoDetails.languages || []);
            setValue('parent_education', otherInfoDetails.parental_college_graduation_status ? "1" : "0");
            setValue('other_languages', otherInfoDetails.other_languages || ''); // Ensure it's set as string

            setInitialValues({
                first_language: otherInfoDetails.first_language || '',
                languages: otherInfoDetails.languages || [],
                parent_education: otherInfoDetails.parental_college_graduation_status ? "1" : "0",
                other_languages: otherInfoDetails.other_languages || '', // Database field name as string
            });

            // Set initial value of first_language_name using getLanguageNameById
            if (otherInfoDetails.first_language) {
                const languageName = getLanguageNameById(otherInfoDetails.first_language);
                setFirstLanguageName(languageName || '');
            } else {
                setFirstLanguageName('');
            }

            // Set initial value of additionalLanguagesNames using getLanguageNameById for each language ID
            if (otherInfoDetails.other_languages) {
                const languageIds = otherInfoDetails.other_languages.split(',').map(id => id.trim());
                const names = languageIds.map(langId => getLanguageNameById(langId));
                setAdditionalLanguagesNames(names);
            } else {
                setAdditionalLanguagesNames([]);
            }
        }
    }, [otherInfoDetails, setValue]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Ensure other_languages is submitted as a string
            const otherLanguagesString = data.other_languages || '';

            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_OTHER_INFO_DETAILS,
                method: 'put',
                token,
                data: {
                    ...data,
                    languages: data.languages.map(lang => lang.value),
                    other_languages: otherLanguagesString, // Ensure other_languages is submitted as string
                    parental_college_graduation_status: data.parent_education === "1" ? 1 : 0,
                },
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setSuccessMessage(response.data.message || t('Form submitted successfully.'));
                setGlobalError('');

                // Update initialValues with the latest saved data
                setInitialValues(data);

                // Update first_language_name using getLanguageNameById
                if (data.first_language) {
                    const languageName = getLanguageNameById(data.first_language);
                    setFirstLanguageName(languageName || '');
                } else {
                    setFirstLanguageName('');
                }

                // Update additionalLanguagesNames using getLanguageNameById for each language ID
                if (otherLanguagesString) {
                    const languageIds = otherLanguagesString.split(',');
                    const names = languageIds.map(langId => getLanguageNameById(langId.trim()));
                    setAdditionalLanguagesNames(names);
                } else {
                    setAdditionalLanguagesNames([]);
                }

                setIsEditMode(false);
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
        clearErrors(); // Clear all validation errors
        setValue('first_language', initialValues.first_language);
        setValue('languages', initialValues.languages);
        setValue('parent_education', initialValues.parent_education);
        setValue('other_languages', initialValues.other_languages); // Database field name as string
    };

    // Function to get language name by ID (assuming it is implemented elsewhere)
    const getLanguageNameById = (id) => {
        const language = languages.find(lang => lang.value === parseInt(id));
        return language ? t(language.label) : '';
    };

    return (
        <div>
            {isEditMode ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="row g-2">
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="first_language">{t('First Language')}</label>
                            <select
                                id="first_language"
                                {...register('first_language')}
                                className={`form-control ${errors.first_language ? 'is-invalid' : ''}`}
                                onBlur={(e) => setValue('first_language', e.target.value)}
                            >
                                <option value="">{t('Select Language')}</option>
                                {languages.map((language) => (
                                    <option key={language.value} value={language.value}>{t(language.label)}</option>
                                ))}
                            </select>
                            {errors.first_language && <div className="text-danger">{errors.first_language.message}</div>}
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="other_languages">{t('Additional Languages')}</label>
                            <Controller
                                control={control}
                                name="other_languages" // Database field name as string
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={languages.map(lang => ({ value: lang.value, label: t(lang.label) }))}
                                        isMulti
                                        className={`react-select ${errors.other_languages ? 'is-invalid' : ''}`}
                                        classNamePrefix="react-select"
                                        value={field.value ? field.value.split(',').map(langId => ({ value: langId.trim(), label: getLanguageNameById(langId.trim()) })) : []} // Ensure initial values are set with labels
                                        onChange={(selectedOptions) => {
                                            // Convert selected options to comma-separated string for form submission
                                            const selectedValues = selectedOptions.map(option => option.value).join(',');
                                            field.onChange(selectedValues);
                                        }}
                                    />
                                )}
                            />
                            {errors.other_languages && <div className="text-danger">{errors.other_languages.message}</div>}
                        </div>
                        <div className="col-sm-12 mt-3">
                            <label className="form-label">{t('Did either of your parents graduate from a 3-year school or university?')}</label><br />
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="parent_educationYes"
                                    {...register('parent_education')}
                                    value="1"
                                    defaultChecked={initialValues.parent_education === "1"}
                                    onChange={() => setValue('parent_education', "1")}
                                />
                                <label className="form-check-label" htmlFor="parent_educationYes">{t('Yes')}</label>

                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="parent_educationNo"
                                    {...register('parent_education')}
                                    value="0"
                                    defaultChecked={initialValues.parent_education === "0"} // Check against string "0"
                                    onChange={() => setValue('parent_education', "0")} // Set as string "0"
                                />
                                <label className="form-check-label" htmlFor="parent_educationNo">{t('No')}</label>
                            </div>
                            {errors.parent_education && <div className="text-danger">{errors.parent_education.message}</div>}
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
                            <p><strong>{t('First Language')}: </strong> {first_language_name || <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-6">
                            <p><strong>{t('Additional Languages')}: </strong> {additionalLanguagesNames && additionalLanguagesNames.length > 0 ?
                                additionalLanguagesNames.join(', ') : <span className="text-muted">{t('Not provided')}</span>}</p>
                            <hr className="my-1" />
                        </div>
                        <div className="col-sm-12">
                            <p><strong>{t('Did either of your parents graduate from a 3-year school or university?')}: </strong> {initialValues.parent_education === null ? <span className="text-muted">{t('Not provided')}</span> : initialValues.parent_education === "1" ? t('Yes') : t('No')}</p>
                            <hr className="my-1" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OtherInfo;
