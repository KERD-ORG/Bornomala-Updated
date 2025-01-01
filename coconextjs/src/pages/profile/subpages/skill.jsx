// pages/profile/subpages/skill.jsx
import {
    React,
    useRef,
    useState,
    useEffect,
    useRouter,
    getToken,
    AsyncSelect,
    executeAjaxOperationStandard,
    profileTabOrder,
    PrevNextButtons,
    useTranslation,
    useForm,
    yupResolver,
    Loader,
    yup,
    CustomAlert,
    Tooltip
} from '../../../utils/commonImports';

import 'react-tooltip/dist/react-tooltip.css';
import 'react-phone-input-2/lib/style.css';

const Skills = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const { tab } = router.query;
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [originalOptions, setOriginalOptions] = useState([]); // State to store original options
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // State to manage edit mode

    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        skills: yup.array().of(
            yup.object().shape({
                label: yup.string().required(t('Skill is required')),
                value: yup.number().required(t('Skill is required')),
            })
        ).min(1, t('Skill is required')),
    });

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN);
        } else {
            setToken(fetchedToken);
        }
    }, [router]);

    useEffect(() => {
        if (token) {
            fetchSavedOptions();
        }
    }, [token]);

    const fetchSavedOptions = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_USER_SKILLS}`,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });
            if (response.data && response.data.status === 'success') {
                const savedOptions = response.data.data.map(item => ({
                    label: item.skill_option.skill_name,
                    value: item.skill_option.id,
                }));
                setSelectedOptions(savedOptions);
                setOriginalOptions(savedOptions); // Save the original options
                setValue('skills', savedOptions);
                setGlobalError('');
                setSuccessMessage('');
            } else {
                setSuccessMessage('');
                setGlobalError(response.message || t('An error occurred while submitting the form.'));
            }
        } catch (error) {
            setSuccessMessage('');
            setGlobalError(t('An error occurred while submitting the form.'));
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            skills: [],
        },
    });

    const onSubmit = async (formData) => {
        try {
            const skillsData = formData.skills.map(item => ({
                skill_option_id: item.value
            }));
            setLoading(true);
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_SKILLS,
                method: 'post',
                token,
                data: skillsData,
                locale: router.locale || 'en',
            });
            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setGlobalError('');
                setSuccessMessage(response.data.message || t('Form submitted successfully.'));
                formRef.current.reset();
                setIsEditMode(false);
                setOriginalOptions(selectedOptions); // Update original options on successful submission
            } else {
                setSuccessMessage('');
                setGlobalError(response.message);
                if (response.details) {
                    Object.keys(response.details).forEach((field) => {
                        setError(field, {
                            type: 'server',
                            message: response.details[field],
                        });
                    });
                }
            }
        } catch (error) {
            setSuccessMessage('');
            setGlobalError(t('An error occurred while submitting the form.'));
        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = (targetTab) => {
        if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            if (!formRef.current.querySelector(':invalid')) {
                const tabElement = document.querySelector(`[href="#${targetTab}"]`);
                if (tabElement) {
                    tabElement.click();
                }
            }
        }
    };

    const loadOptions = async (inputValue) => {
        try {
            if (!token) return [];
            const response = await executeAjaxOperationStandard({
                url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_SKILL_OPTIONS}?query=${inputValue}`,
                method: 'get',
                token, 
                locale: router.locale || 'en',
            });

            if (response.data && response.data.status === 'success') {
                setGlobalError('');
                setSuccessMessage('');
                if (response.data.data.skills) {
                    return response.data.data.skills.map(item => ({ label: item.skill_name, value: item.id }));
                }
            } else {
                setSuccessMessage('');
                setGlobalError(response.message || t('An error occurred while fetching skill options.'));
            }
        } catch (error) {
            return [];
        }
    };

    const handleChange = (selected) => {
        setSelectedOptions(selected || []);
        setValue('skills', selected || []);
    };

    const handleCancel = () => {
        setSelectedOptions(originalOptions);
        setIsEditMode(false);
    };

    if (!token) {
        return <Loader />;
    }

    return (
        <div>
            <h4 className="mb-4">
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Skills')}
            </h4>
            {globalError && (
                <CustomAlert
                    message={globalError}
                    dismissable={true}
                    timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
                    onClose={() => setGlobalError('')}
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
            <div className="card">
                <div className="card-body">
                    {isEditMode ? (
                        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                            <div className="mb-3">
                                <label htmlFor="skills" className="form-label">{t('Skills')}</label>
                                <AsyncSelect
                                    isMulti
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={loadOptions}
                                    onChange={handleChange}
                                    value={selectedOptions}
                                    inputId="skills"
                                    placeholder={t('Select or type your skills')}
                                    noOptionsMessage={() => t('No options')}
                                    formatCreateLabel={(inputValue) => `${t('Create')} "${inputValue}"`}
                                    createOptionPosition="first"
                                    classNamePrefix="react-select"
                                    className={`react-select ${errors.skills ? 'is-invalid' : ''}`}
                                />
                                {errors.skills && <div className="text-danger">{errors.skills.message}</div>}
                            </div>
                            <button data-tooltip-id="my-tooltip-save" data-tooltip-content={t("Save")} data-tooltip-place="top" type="submit" className="btn btn-primary btn-xs">{t('Save')}</button>
                            <button data-tooltip-id="my-tooltip-cancel" data-tooltip-content={t("Cancel")} data-tooltip-place="top" type="button" className="btn btn-secondary ms-2 btn-xs" onClick={handleCancel}>{t('Cancel')}</button>
                        </form>
                    ) : (
                        <div>
                            <div className="d-flex justify-content-end mb-3">
                                <button data-tooltip-id="my-tooltip-edit" data-tooltip-content={t("Edit")} data-tooltip-place="top" className="btn btn-warning btn-xs" onClick={() => setIsEditMode(true)}>{t('Edit')}</button>
                            </div>
                            <div className="col-sm-12">
                                <p><strong>{t('Skills')}: </strong>
                                    {selectedOptions.length > 0 ? selectedOptions.map(option => option.label).join(', ') : <span className="text-muted">{t('Not provided')}</span>}
                                </p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <PrevNextButtons
                previousTab={previousTab}
                nextTab={nextTab}
                handleNavigation={handleNavigation}
            />

            {loading && <Loader />}
            <Tooltip id="my-tooltip-edit" />
            <Tooltip id="my-tooltip-save" />
            <Tooltip id="my-tooltip-cancel" />
        </div>
    );
};

export default Skills;
