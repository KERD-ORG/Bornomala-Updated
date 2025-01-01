// pages/profile/subpages/research-experience.jsx
import {
    React,
    useRef,
    useState,
    useEffect,
    useRouter,
    getToken,
    executeAjaxOperation,
    executeAjaxOperationStandard,
    profileTabOrder,
    PrevNextButtons,
    useTranslation,
    useForm,
    yupResolver,
    Loader,
    yup,
    CustomAlert,
    Swal,
    CommonModal,
    Tooltip,
    format
} from '../../../utils/commonImports';

import 'react-tooltip/dist/react-tooltip.css';
import 'react-phone-input-2/lib/style.css';

const ResearchExperienceHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [researchExperiences, setResearchExperiences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        title: yup.string().trim().required(t('Title is required')),
        description: yup.string().trim().required(t('Description is required')),
        supervisor: yup.string().trim().required(t('Supervisor is required')),
        organization: yup.string().trim().required(t('Organization is required')),
        start_date: yup.date()
            .required(t('Start Date is required'))
            .typeError(t('Start Date must be a valid date')),
        end_date: yup.date()
            .nullable()
            .typeError(t('End Date must be a valid date'))
            .test('end_date', t('End Date must be greater than Start Date.'), function (value) {
                const { start_date } = this.parent;
                return !value || !start_date || value > start_date;
            }),
    });

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchResearchExperiences(fetchedToken);
        }
    }, []);


    const fetchResearchExperiences = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_RESEARCH_EXPERIENCES,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setResearchExperiences(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching research experiences'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error fetching research experiences:', error);
            setGlobalError(t('An error occurred while fetching research experiences' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            description: '',
            supervisor: '',
            organization: '',
            start_date: '',
            end_date: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_RESEARCH_EXPERIENCES}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_RESEARCH_EXPERIENCES}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            // Format dates to YYYY-MM-DD
            const formattedData = {
                ...formData,
                start_date: formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : null,
                end_date: formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : null,
            };

            const response = await executeAjaxOperationStandard({
                url,
                method,
                token,
                data: formattedData,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                if (formMode === "create") {
                    setResearchExperiences([response.data.data, ...researchExperiences]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setResearchExperiences(researchExperiences.map(pub => pub.id === editId ? response.data.data : pub));
                    setSuccessMessage(t(response.data.message || 'Saved successfully!'))
                    setGlobalError('')
                }
                setGlobalError('');
                reset();
                setEditId(null);
                setShowModal(false);
            } else {
                if (response.details) {
                    Object.keys(response.details).forEach((field) => {
                        setError(field, {
                            type: 'server',
                            message: response.details[field][0],
                        });
                    });
                }
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setGlobalError(t('An error occurred while submitting the form.'));
            setSuccessMessage('');
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

    const confirmDelete = (id) => {

        Swal.fire({
            title: t('Are you sure?'),
            text: t('You will not be able to recover this!'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('Yes, delete it!'),
            cancelButtonText: t('Cancel'),
            customClass: {
                popup: 'my-swal',
                confirmButton: 'my-swal-confirm-button',
                cancelButton: 'my-swal-cancel-button',
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                try {
                    const response = await executeAjaxOperation({
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_RESEARCH_EXPERIENCES}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setResearchExperiences(researchExperiences.filter(item => item.id !== id));
                        setSuccessMessage('');
                        setGlobalError('');

                        Swal.fire({
                            text: response.message,
                            confirmButtonText: t('OK'),
                            title: t('Deleted!')
                        }
                        );

                    } else {
                        setGlobalError('');
                        setSuccessMessage('');
                        Swal.fire(
                            t('Failed!'),
                            error.message || t('Failed to delete. .'),
                            'error'
                        );
                    }
                } catch (error) {

                    setGlobalError('');
                    setSuccessMessage(''); // Clear any previous success messages
                    Swal.fire(
                        t('Failed!'),
                        error.message || t('An error occurred while deleting the entry'),
                        'error'
                    );
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [selectedResearchExperience, setSelectedResearchExperience] = useState(null);

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('title', entry.title);
        setValue('description', entry.description);
        setValue('supervisor', entry.supervisor);
        setValue('organization', entry.organization);
        setValue('start_date', entry.start_date);
        setValue('end_date', entry.end_date);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedResearchExperience(entry);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setFormMode("create");
        reset();
        setShowModal(true);
        setEditId(null);
    };

    const handleCancelEdit = () => {
        reset();
        setEditId(null);
        setShowModal(false);
    };


    const formComponent = (
        <div className="com-md-12">
            <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <div className="row">
                    <div className="col-md-6 mb-1">
                        <label htmlFor="title" className="form-label">{t('Title')}</label>
                        <input
                            type="text"
                            id="title"
                            className={`form-control form-control-sm ${errors.title ? 'is-invalid' : ''}`}
                            placeholder={t('Write your title')}
                            {...register('title')}
                        />
                        {errors.title && <div className="text-danger">{errors.title.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="description" className="form-label">{t('Description')}</label>
                        <textarea
                            id="description"
                            className={`form-control form-control-sm ${errors.description ? 'is-invalid' : ''}`}
                            placeholder={t('Write your description')}
                            {...register('description')}
                        />
                        {errors.description && <div className="text-danger">{errors.description.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="supervisor" className="form-label">{t('Supervisor')}</label>
                        <input
                            type="text"
                            id="supervisor"
                            className={`form-control form-control-sm ${errors.supervisor ? 'is-invalid' : ''}`}
                            placeholder={t('Write your supervisor')}
                            {...register('supervisor')}
                        />
                        {errors.supervisor && <div className="text-danger">{errors.supervisor.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="organization" className="form-label">{t('Organization')}</label>
                        <input
                            type="text"
                            id="organization"
                            className={`form-control form-control-sm ${errors.organization ? 'is-invalid' : ''}`}
                            placeholder={t('Write your organization')}
                            {...register('organization')}
                        />
                        {errors.organization && <div className="text-danger">{errors.organization.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="start_date" className="form-label">{t('Start Date')}</label>
                        <input
                            type="date"
                            id="start_date"
                            className={`form-control form-control-sm ${errors.start_date ? 'is-invalid' : ''}`}
                            {...register('start_date')}
                        />
                        {errors.start_date && <div className="text-danger">{errors.start_date.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="end_date" className="form-label">{t('End Date')}</label>
                        <input
                            type="date"
                            id="end_date"
                            className={`form-control form-control-sm ${errors.end_date ? 'is-invalid' : ''}`}
                            {...register('end_date')}
                        />
                        {errors.end_date && <div className="text-danger">{errors.end_date.message}</div>}
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary btn-sm mt-3">{t('Save')}</button>
                        <button type="button" className="btn btn-secondary btn-sm mt-3 ms-2" onClick={handleCancelEdit}>{t('Cancel')}</button>
                    </div>
                </div>
            </form>
        </div>


    );


    if (!token) {
        return <Loader />; // Or any loading indicator
    }

    return (
        <div>
            <h4 className="mb-4">
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Research Experience')}
            </h4>
            <div className="card">
                <div className="card-body" ref={formContainerRef}>
                    {globalError && (
                        <CustomAlert
                            type="danger"
                            message={globalError}
                            dismissable={true}
                            timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
                            onClose={() => setGlobalError('')}
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
                    <div className="d-flex justify-content-end">

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Research Experience")} data-tooltip-place="top" onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Research Experience')}
                        </button>
                    </div>

                    {researchExperiences.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No research experiences found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {researchExperiences.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Title')}: </strong>{entry.title}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Description')}: </strong>{entry.description}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Supervisor')}: </strong>{entry.supervisor}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Organization')}: </strong>{entry.organization}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Start Date')}: </strong>{entry.start_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('End Date')}: </strong>{entry.end_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <button data-tooltip-id="my-tooltip-edit" data-tooltip-content={t("Edit")} data-tooltip-place="top" className="btn btn-warning btn-xs me-2" onClick={() => openEditForm(entry)}>{t('Edit')}</button>
                                            <button data-tooltip-id="my-tooltip-delete" data-tooltip-content={t("Delete")} data-tooltip-place="top" className="btn btn-danger btn-xs" onClick={() => confirmDelete(entry.id)}>{t('Delete')}</button>
                                        </div>
                                    </li>


                                </div>

                            </div>
                        ))}

                    </div>
                </div>
            </div>
            <PrevNextButtons
                previousTab={previousTab}
                nextTab={nextTab}
                handleNavigation={handleNavigation}
            />

            <CommonModal
                title={
                    formMode === 'create'
                        ? t('Add New Research Experience')
                        : formMode === 'edit'
                            ? t('Update Research Experience') + ': ' + (selectedResearchExperience ? selectedResearchExperience.title : '')
                            : formMode === 'view'
                                ? t('View Research Experience') + ': ' + (selectedResearchExperience ? selectedResearchExperience.title : '')
                                : t('View Research Experience') + ': ' + (selectedResearchExperience ? selectedResearchExperience.title : '')
                }
                formComponent={formComponent}
                showModal={showModal}
                closeModal={handleCancelEdit}
            />

            {loading && <Loader />}
            <Tooltip id="my-tooltip-add" />
            <Tooltip id="my-tooltip-edit" />
            <Tooltip id="my-tooltip-delete" />

        </div>
    );

};

export default ResearchExperienceHistory;