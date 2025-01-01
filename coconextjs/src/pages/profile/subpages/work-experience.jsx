// pages/profile/subpages/work-experience.jsx
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

const WorkExperienceHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [workExperiences, setWorkExperiences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        position_title: yup.string().trim().required(t('Position title is required')),
        company_name: yup.string().trim().required(t('Company name is required')),
        location: yup.string().trim().required(t('Location is required')),
        start_date: yup.date()
            .required(t('Start date is required'))
            .typeError(t('Start date must be a valid date')),
        end_date: yup.date()
            .nullable()
            .typeError(t('End date must be a valid date'))
            .test('end_date', t('End date must be greater than start date.'), function (value) {
                const { start_date } = this.parent;
                return !value || !start_date || value > start_date;
            }),
        description_of_duties: yup.string().trim().required(t('Description of duties is required')),
    });

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchWorkExperiences(fetchedToken);
        }
    }, []);

    const fetchWorkExperiences = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_WORK_EXPERIENCES,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setWorkExperiences(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching workExperiences'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error fetching workExperiences:', error);
            setGlobalError(t('An error occurred while fetching workExperiences' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            position_title: '',
            company_name: '',
            location: '',
            start_date: '',
            end_date: '',
            description_of_duties: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_WORK_EXPERIENCES}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_WORK_EXPERIENCES}${editId}/`;
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
                    setWorkExperiences([response.data.data, ...workExperiences]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setWorkExperiences(workExperiences.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_WORK_EXPERIENCES}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setWorkExperiences(workExperiences.filter(item => item.id !== id));
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
    const [selectedWorkExperience, setSelectedWorkExperience] = useState(null);

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('position_title', entry.position_title);
        setValue('company_name', entry.company_name);
        setValue('location', entry.location);
        setValue('start_date', entry.start_date);
        setValue('end_date', entry.end_date);
        setValue('description_of_duties', entry.description_of_duties);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedWorkExperience(entry);
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
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="position_title" className="form-label">{t('Position Title')}</label>
                            <input
                                type="text"
                                id="position_title"
                                className={`form-control form-control-sm ${errors.position_title ? 'is-invalid' : ''}`}
                                placeholder={t('Write your position title')}
                                {...register('position_title')}
                            />
                            {errors.position_title && <div className="text-danger">{errors.position_title.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="company_name" className="form-label">{t('Company Name')}</label>
                            <input
                                type="text"
                                id="company_name"
                                className={`form-control form-control-sm ${errors.company_name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the company name')}
                                {...register('company_name')}
                            />
                            {errors.company_name && <div className="text-danger">{errors.company_name.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="location" className="form-label">{t('Location')}</label>
                            <input
                                type="text"
                                id="location"
                                className={`form-control form-control-sm ${errors.location ? 'is-invalid' : ''}`}
                                placeholder={t('Write the location')}
                                {...register('location')}
                            />
                            {errors.location && <div className="text-danger">{errors.location.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="start_date" className="form-label">{t('Start Date')}</label>
                            <input
                                type="date"
                                id="start_date"
                                className={`form-control form-control-sm ${errors.start_date ? 'is-invalid' : ''}`}
                                {...register('start_date')}
                            />
                            {errors.start_date && <div className="text-danger">{errors.start_date.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="end_date" className="form-label">{t('End Date')}</label>
                            <input
                                type="date"
                                id="end_date"
                                className={`form-control form-control-sm ${errors.end_date ? 'is-invalid' : ''}`}
                                {...register('end_date')}
                            />
                            {errors.end_date && <div className="text-danger">{errors.end_date.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="description_of_duties" className="form-label">{t('Description of Duties')}</label>
                            <textarea
                                id="description_of_duties"
                                className={`form-control form-control-sm ${errors.description_of_duties ? 'is-invalid' : ''}`}
                                placeholder={t('Write your description of duties')}
                                {...register('description_of_duties')}
                            />
                            {errors.description_of_duties && <div className="text-danger">{errors.description_of_duties.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary btn-sm mt-3">{t('Save')}</button>
                    <button type="button" className="btn btn-secondary btn-sm mt-3 ms-2" onClick={handleCancelEdit}>{t('Cancel')}</button>
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Work Experiences')}
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

                        <button data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Work Experience")} data-tooltip-place="top"  onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Work Experience')}
                        </button>
                    </div>

                    {workExperiences.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No work experiences records are found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {workExperiences.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Position Title')}: </strong>{entry.position_title}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Company Name')}: </strong>{entry.company_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Location')}: </strong>{entry.location}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Start Date')}: </strong>{entry.start_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('End Date')}: </strong>{entry.end_date || t('Present')}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Description of Duties')}: </strong>{entry.description_of_duties}
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
                        ? t('Add New Work Experience')
                        : formMode === 'edit'
                            ? t('Update Work Experience') + ': ' + (selectedWorkExperience ? selectedWorkExperience.position_title : '')
                            : formMode === 'view'
                                ? t('View WorkExperience') + ': ' + (selectedWorkExperience ? selectedWorkExperience.position_title : '')
                                : t('View WorkExperience') + ': ' + (selectedWorkExperience ? selectedWorkExperience.position_title : '')
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

export default WorkExperienceHistory;