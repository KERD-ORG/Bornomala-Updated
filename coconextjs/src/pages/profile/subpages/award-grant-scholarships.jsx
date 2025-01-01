// pages/profile/subpages/award-grant-scholarships.jsx
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

const AwardsGrantsScholarships = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [awardsGrantsScholarships, setAwardsGrantsScholarships] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];



    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [selectedAwardsGrantsScholarship, setSelectedAwardsGrantsScholarship] = useState(null);




    const schema = yup.object().shape({
        name: yup.string().trim().required(t('Name is required')),
        awarding_organization: yup.string().trim().required(t('Awarding organization is required')),
        date_received: yup.date()
            .required(t('Date received is required'))
            .typeError(t('Date received must be a valid date')),
        description: yup.string().trim().required(t('Description is required')),
    });


    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchAwardsGrantsScholarships(fetchedToken);
        }
    }, []);

    const fetchAwardsGrantsScholarships = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_AWARDS_GRANTS_SCHOLARSHIPS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setAwardsGrantsScholarships(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching awards grants scholarships'));
                setSuccessMessage('');
            }
            
        } catch (error) {
            setGlobalError(t('An error occurred while fetching awardsGrantsScholarships' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            awarding_organization: '',
            date_received: '',
            description: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_AWARDS_GRANTS_SCHOLARSHIPS}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_AWARDS_GRANTS_SCHOLARSHIPS}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            const formattedData = {
                ...formData,
                date_received: formData.date_received ? format(new Date(formData.date_received), 'yyyy-MM-dd') : null,
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
                    setAwardsGrantsScholarships([response.data.data, ...awardsGrantsScholarships]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setAwardsGrantsScholarships(awardsGrantsScholarships.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_AWARDS_GRANTS_SCHOLARSHIPS}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setAwardsGrantsScholarships(awardsGrantsScholarships.filter(item => item.id !== id));
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
        setValue('name', entry.name);
        setValue('awarding_organization', entry.awarding_organization);
        setValue('date_received', entry.date_received);
        setValue('description', entry.description);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedAwardsGrantsScholarship(entry);
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
                            <label htmlFor="name" className="form-label">{t('Name')}</label>
                            <input
                                type="text"
                                id="name"
                                className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the name')}
                                {...register('name')}
                            />
                            {errors.name && <div className="text-danger">{errors.name.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="awarding_organization" className="form-label">{t('Awarding Organization')}</label>
                            <input
                                type="text"
                                id="awarding_organization"
                                className={`form-control form-control-sm ${errors.awarding_organization ? 'is-invalid' : ''}`}
                                placeholder={t('Write the awarding organization')}
                                {...register('awarding_organization')}
                            />
                            {errors.awarding_organization && <div className="text-danger">{errors.awarding_organization.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="date_received" className="form-label">{t('Date Received')}</label>
                            <input
                                type="date"
                                id="date_received"
                                className={`form-control form-control-sm ${errors.date_received ? 'is-invalid' : ''}`}
                                {...register('date_received')}
                            />
                            {errors.date_received && <div className="text-danger">{errors.date_received.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="description" className="form-label">{t('Description')}</label>
                            <textarea
                                id="description"
                                className={`form-control form-control-sm ${errors.description ? 'is-invalid' : ''}`}
                                placeholder={t('Write the description')}
                                {...register('description')}
                            />
                            {errors.description && <div className="text-danger">{errors.description.message}</div>}
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Awards, Grants, and Scholarships')}
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
                        <button data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Award, Grant, or Scholarship")} data-tooltip-place="top" className="btn btn-primary btn-sm mb-1" type="button" onClick={handleAddNew} >
                            {t('Add New Award, Grant, or Scholarship')}
                        </button>
                    </div>

                    {awardsGrantsScholarships.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No award, grant, or scholarship records are found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {awardsGrantsScholarships.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Name')}: </strong>{entry.name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Awarding Organization')}: </strong>{entry.awarding_organization}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Date Received')}: </strong>{entry.date_received}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Description')}: </strong>{entry.description}
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
                        ? t('Add New Awards, Grants, and Scholarship')
                        : formMode === 'edit'
                            ? t('Update Awards, Grants, and Scholarship') + ': ' + (selectedAwardsGrantsScholarship ? selectedAwardsGrantsScholarship.name : '')
                            : formMode === 'view'
                                ? t('View Awards, Grants, and Scholarship') + ': ' + (selectedAwardsGrantsScholarship ? selectedAwardsGrantsScholarship.name : '')
                                : t('View Awards, Grants, and Scholarship') + ': ' + (selectedAwardsGrantsScholarship ? selectedAwardsGrantsScholarship.name : '')
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

export default AwardsGrantsScholarships;