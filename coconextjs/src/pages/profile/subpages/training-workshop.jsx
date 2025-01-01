// pages/profile/subpages/training-workshop.jsx
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

const TrainingWorkshopHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [trainingWorkshops, setTrainingWorkshops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        name: yup.string().trim().required(t('Name is required')),
        organizer: yup.string().trim().required(t('Organizer is required')),
        location: yup.string().trim().required(t('Location is required')),
        start_date: yup.date()
            .required(t('Start date is required'))
            .typeError(t('Start date must be a valid date')),
        completion_date: yup.date()
            .nullable()
            .typeError(t('Completion date must be a valid date'))
            .test('completion_date', t('Completion date must be greater than start date.'), function (value) {
                const { start_date } = this.parent;
                return !value || !start_date || value > start_date;
            }),
        certificate: yup.string().trim().required(t('Certificate is required')),
    });


    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchTrainingWorkshops(fetchedToken);
        }
    }, []);


    const fetchTrainingWorkshops = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_TRAINING_WORKSHOPS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setTrainingWorkshops(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching trainingWorkshops'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error fetching trainingWorkshops:', error);
            setGlobalError(t('An error occurred while fetching trainingWorkshops' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            organizer: '',
            location: '',
            start_date: '',
            completion_date: '',
            certificate: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_TRAINING_WORKSHOPS}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_TRAINING_WORKSHOPS}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            // Format dates to YYYY-MM-DD
            const formattedData = {
                ...formData,
                start_date: formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : null,
                completion_date: formData.completion_date ? format(new Date(formData.completion_date), 'yyyy-MM-dd') : null,
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
                    setTrainingWorkshops([response.data.data, ...trainingWorkshops]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setTrainingWorkshops(trainingWorkshops.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_TRAINING_WORKSHOPS}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setTrainingWorkshops(trainingWorkshops.filter(item => item.id !== id));
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
    const [selectedTrainingWorkshop, setSelectedTrainingWorkshop] = useState(null);
  
    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('name', entry.name);
        setValue('organizer', entry.organizer);
        setValue('location', entry.location);
        setValue('start_date', entry.start_date);
        setValue('completion_date', entry.completion_date);
        setValue('certificate', entry.certificate);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedTrainingWorkshop(entry);
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
                            <label htmlFor="organizer" className="form-label">{t('Organizer')}</label>
                            <input
                                type="text"
                                id="organizer"
                                className={`form-control form-control-sm ${errors.organizer ? 'is-invalid' : ''}`}
                                placeholder={t('Write the organizer')}
                                {...register('organizer')}
                            />
                            {errors.organizer && <div className="text-danger">{errors.organizer.message}</div>}
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
                            <label htmlFor="completion_date" className="form-label">{t('Completion Date')}</label>
                            <input
                                type="date"
                                id="completion_date"
                                className={`form-control form-control-sm ${errors.completion_date ? 'is-invalid' : ''}`}
                                {...register('completion_date')}
                            />
                            {errors.completion_date && <div className="text-danger">{errors.completion_date.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="certificate" className="form-label">{t('Certificate')}</label>
                            <textarea
                                id="certificate"
                                className={`form-control form-control-sm ${errors.certificate ? 'is-invalid' : ''}`}
                                placeholder={t('Write your certificate details')}
                                {...register('certificate')}
                            />
                            {errors.certificate && <div className="text-danger">{errors.certificate.message}</div>}
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Training Workshops')}
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

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Training Workshop'")} data-tooltip-place="top" onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Training Workshop')}
                        </button>
                    </div>

                    {trainingWorkshops.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No training workshops records are found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {trainingWorkshops.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Name')}: </strong>{entry.name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Organizer')}: </strong>{entry.organizer}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Location')}: </strong>{entry.location}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Start Date')}: </strong>{entry.start_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Completion Date')}: </strong>{entry.completion_date || t('Present')}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Certificate')}: </strong>{entry.certificate}
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
                        ? t('Add New Training Workshop')
                        : formMode === 'edit'
                            ? t('Update Training Workshop') + ': ' + (selectedTrainingWorkshop ? selectedTrainingWorkshop.name : '')
                            : formMode === 'view'
                                ? t('View Training Workshop') + ': ' + (selectedTrainingWorkshop ? selectedTrainingWorkshop.name : '')
                                : t('View Training Workshop') + ': ' + (selectedTrainingWorkshop ? selectedTrainingWorkshop.name : '')
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

export default TrainingWorkshopHistory;