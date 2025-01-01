// pages/profile/subpages/dissertation.jsx
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

const DissertationHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [dissertations, setDissertations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        title: yup.string().trim().required(t('Title is required')),
        academic_level: yup.string().trim().required(t('Academic Level is required')),
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
        abstract: yup.string().trim().required(t('Abstract is required')),
        publications: yup.string().trim().required(t('Publications are required')),
        full_dissertation_link: yup.string().trim().url(t('Full Dissertation Link must be a valid URL')).required(t('Full Dissertation Link is required')),
    });


    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchDissertations(fetchedToken);
        }
    }, []);

    const fetchDissertations = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_DISSERTATIONS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setDissertations(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching dissertations'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error fetching dissertations:', error);
            setGlobalError(t('An error occurred while fetching dissertations' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            academic_level: '',
            start_date: '',
            end_date: '',
            abstract: '',
            publications: '',
            full_dissertation_link: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_DISSERTATIONS}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_DISSERTATIONS}${editId}/`;
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
                    setDissertations([response.data.data, ...dissertations]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setDissertations(dissertations.map(pub => pub.id === editId ? response.data.data : pub));
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
                    const response = await executeAjaxOperationStandard({
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_DISSERTATIONS}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });
                    if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                        setDissertations(dissertations.filter(item => item.id !== id));
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
                            t('Failed to delete. .'),
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
    const [selectedDissertation, setSelectedPublication] = useState(null);
    
    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('title', entry.title);
        setValue('academic_level', entry.academic_level);
        setValue('start_date', entry.start_date);
        setValue('end_date', entry.end_date);
        setValue('abstract', entry.abstract);
        setValue('publications', entry.publications);
        setValue('full_dissertation_link', entry.full_dissertation_link);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedPublication(entry);
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
                        <label htmlFor="academic_level" className="form-label">{t('Academic Level')}</label>
                        <input
                            type="text"
                            id="academic_level"
                            className={`form-control form-control-sm ${errors.academic_level ? 'is-invalid' : ''}`}
                            placeholder={t('Write your academic level')}
                            {...register('academic_level')}
                        />
                        {errors.academic_level && <div className="text-danger">{errors.academic_level.message}</div>}
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
                    <div className="col-md-6 mb-1">
                        <label htmlFor="abstract" className="form-label">{t('Abstract')}</label>
                        <textarea
                            id="abstract"
                            className={`form-control form-control-sm ${errors.abstract ? 'is-invalid' : ''}`}
                            placeholder={t('Write your abstract')}
                            {...register('abstract')}
                        />
                        {errors.abstract && <div className="text-danger">{errors.abstract.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="publications" className="form-label">{t('Publications')}</label>
                        <textarea
                            id="publications"
                            className={`form-control form-control-sm ${errors.publications ? 'is-invalid' : ''}`}
                            placeholder={t('Write your publications')}
                            {...register('publications')}
                        />
                        {errors.publications && <div className="text-danger">{errors.publications.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="full_dissertation_link" className="form-label">{t('Full Dissertation Link')}</label>
                        <input
                            type="url"
                            id="full_dissertation_link"
                            className={`form-control form-control-sm ${errors.full_dissertation_link ? 'is-invalid' : ''}`}
                            placeholder={t('Write your full dissertation link')}
                            {...register('full_dissertation_link')}
                        />
                        {errors.full_dissertation_link && <div className="text-danger">{errors.full_dissertation_link.message}</div>}
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Dissertation')}
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

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Dissertation")} data-tooltip-place="top" onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Dissertation')}
                        </button>
                    </div>

                    {dissertations.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No dissertations found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {dissertations.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Title')}: </strong>{entry.title}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Academic Level')}: </strong>{entry.academic_level}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Start Date')}: </strong>{entry.start_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('End Date')}: </strong>{entry.end_date || t('Present')}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Abstract')}: </strong>{entry.abstract}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Publications')}: </strong>{entry.publications}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Full Dissertation Link')}: </strong>{entry.full_dissertation_link}
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
                        ? t('Add New Dissertation')
                        : formMode === 'edit'
                            ? t('Update Dissertation') + ': ' + (selectedDissertation ? selectedDissertation.title : '')
                            : formMode === 'view'
                                ? t('View Dissertation') + ': ' + (selectedDissertation ? selectedDissertation.title : '')
                                : t('View Dissertation') + ': ' + (selectedDissertation ? selectedDissertation.title : '')
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

export default DissertationHistory;