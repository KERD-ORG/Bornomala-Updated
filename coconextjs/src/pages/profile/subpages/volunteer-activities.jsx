// pages/profile/subpages/volunteer-activities.jsx
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

const VolunteerActivityHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [volunteerActivities, setVolunteerActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        organization_name: yup.string().trim().required(t('Organization name is required')),
        designation: yup.string().trim().required(t('Designation is required')),
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
        role_description: yup.string().trim().required(t('Role description is required')),
    });

    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [selectedVolunteerActivitiy, setSelectedVolunteerActivitiy] = useState(null);

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

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchVolunteerActivities(fetchedToken);
        }
    }, []);

    const fetchVolunteerActivities = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_VOLUNTEER_ACTIVITIES,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setVolunteerActivities(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching volunteer activities'));
                setSuccessMessage('');
            }
        } catch (error) {
            setGlobalError(t('An error occurred while fetching volunteer activities' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };


    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_VOLUNTEER_ACTIVITIES}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_VOLUNTEER_ACTIVITIES}${editId}/`;
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
                    setVolunteerActivities([response.data.data, ...volunteerActivities]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setVolunteerActivities(volunteerActivities.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_VOLUNTEER_ACTIVITIES}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setVolunteerActivities(volunteerActivities.filter(item => item.id !== id));
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

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('organization_name', entry.organization_name);
        setValue('designation', entry.designation);
        setValue('start_date', entry.start_date);
        setValue('end_date', entry.end_date);
        setValue('role_description', entry.role_description);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedVolunteerActivitiy(entry);
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
                        <div className="mb-3">
                            <label htmlFor="organization_name" className="form-label">{t('Organization Name')}</label>
                            <input
                                type="text"
                                id="organization_name"
                                className={`form-control form-control-sm ${errors.organization_name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the organization name')}
                                {...register('organization_name')}
                            />
                            {errors.organization_name && <div className="text-danger">{errors.organization_name.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label htmlFor="designation" className="form-label">{t('Designation')}</label>
                            <input
                                type="text"
                                id="designation"
                                className={`form-control form-control-sm ${errors.designation ? 'is-invalid' : ''}`}
                                placeholder={t('Write the designation')}
                                {...register('designation')}
                            />
                            {errors.designation && <div className="text-danger">{errors.designation.message}</div>}
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="mb-3">
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
                    <div className="col-md-6">
                        <div className="mb-3">
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


                    <div className="col-md-12">
                        <div className="mb-3">
                            <label htmlFor="role_description" className="form-label">{t('Role Description')}</label>
                            <textarea
                                id="role_description"
                                className={`form-control form-control-sm ${errors.role_description ? 'is-invalid' : ''}`}
                                placeholder={t('Write your role description')}
                                {...register('role_description')}
                            />
                            {errors.role_description && <div className="text-danger">{errors.role_description.message}</div>}
                        </div>
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Volunteer Activities')}
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

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Volunteer Activity")} data-tooltip-place="top" onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Volunteer Activity')}
                        </button>
                    </div>

                    {volunteerActivities.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No volunteer activities found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {volunteerActivities.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Organization Name')}: </strong>{entry.organization_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Designation')}: </strong>{entry.designation}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Start Date')}: </strong>{entry.start_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('End Date')}: </strong>{entry.end_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Role Description')}: </strong>{entry.role_description}
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
                        ? t('Add New Volunteer Activity')
                        : formMode === 'edit'
                            ? t('Update Volunteer Activity') + ': ' + (selectedVolunteerActivitiy ? selectedVolunteerActivitiy.organization_name : '')
                            : formMode === 'view'
                                ? t('View Volunteer Activity') + ': ' + (selectedVolunteerActivitiy ? selectedVolunteerActivitiy.organization_name : '')
                                : t('View Volunteer Activity') + ': ' + (selectedVolunteerActivitiy ? selectedVolunteerActivitiy.organization_name : '')
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

export default VolunteerActivityHistory;