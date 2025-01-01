// pages/profile/subpages/publication.jsx
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

const PublicationHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];
    const [publicationTypes, setPublicationTypes] = useState([]);

    const schema = yup.object().shape({
        title: yup.string().trim().required(t('Title is required')),
        publication_type: yup.string().trim().required(t('Publication Type is required')),
        authors: yup.string().trim().required(t('Authors are required')),
        publication_date: yup.date()
            .required(t('Publication Date is required'))
            .typeError(t('Publication Date must be a valid date')),
        abstract: yup.string().trim().required(t('Abstract is required')),
        name: yup.string().trim().required(t('Name is required')),
        doi_link: yup.string().trim().url(t('DOI Link must be a valid URL')).required(t('DOI Link is required')),
    });

    const fetchPublicationTypes = async (token) => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_PUBLICATION_TYPES,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setPublicationTypes(response.data.data.publication_types || []);
            } else {
                setSuccessMessage('');
                setGlobalError('');
            }

        } catch (error) {
            console.error('Error fetching publication types:', error);
            setGlobalError(t('An error occurred while fetching publication types' + error.message));
            setSuccessMessage('');
        }
    };


    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchPublications(fetchedToken);
            fetchPublicationTypes(fetchedToken); // Fetch publication types
        }
    }, []);

    const fetchPublications = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_PUBLICATIONS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setPublications(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching publications'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error fetching publications:', error);
            setGlobalError(t('An error occurred while fetching publications' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            publication_type: '',
            authors: '',
            publication_date: '',
            abstract: '',
            name: '',
            doi_link: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_PUBLICATIONS}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_PUBLICATIONS}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            // Format dates to YYYY-MM-DD
            const formattedData = {
                ...formData,
                publication_date: format(new Date(formData.publication_date), 'yyyy-MM-dd'),
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
                    setPublications([response.data.data, ...publications]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setPublications(publications.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_PUBLICATIONS}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setPublications(publications.filter(item => item.id !== id));
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
    const [selectedPublication, setSelectedPublication] = useState(null);

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('title', entry.title);
        setValue('publication_type', entry.publication_type);
        setValue('authors', entry.authors);
        setValue('publication_date', entry.publication_date);
        setValue('abstract', entry.abstract);
        setValue('name', entry.name);
        setValue('doi_link', entry.doi_link);
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
                    <div className="col-md-6">
                        <div className="mb-1">
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
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="publication_type" className="form-label">{t('Publication Type')}</label>
                            <select
                                id="publication_type"
                                className={`form-control form-control-sm ${errors.publication_type ? 'is-invalid' : ''}`}
                                {...register('publication_type')}
                            >
                                <option value="">{t('Select publication type')}</option>
                                {Array.isArray(publicationTypes) && publicationTypes.map((type) => (
                                    <option key={type.key} value={type.key}>{t(type.name)}</option>
                                ))}
                            </select>
                            {errors.publication_type && <div className="text-danger">{errors.publication_type.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="authors" className="form-label">{t('Authors')}</label>
                            <textarea
                                id="authors"
                                className={`form-control form-control-sm ${errors.authors ? 'is-invalid' : ''}`}
                                placeholder={t('Write your authors')}
                                {...register('authors')}
                            />
                            {errors.authors && <div className="text-danger">{errors.authors.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="publication_date" className="form-label">{t('Publication Date')}</label>
                            <input
                                type="date"
                                id="publication_date"
                                className={`form-control form-control-sm ${errors.publication_date ? 'is-invalid' : ''}`}
                                {...register('publication_date')}
                            />
                            {errors.publication_date && <div className="text-danger">{errors.publication_date.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="abstract" className="form-label">{t('Abstract')}</label>
                            <textarea
                                id="abstract"
                                className={`form-control form-control-sm ${errors.abstract ? 'is-invalid' : ''}`}
                                placeholder={t('Write your abstract')}
                                {...register('abstract')}
                            />
                            {errors.abstract && <div className="text-danger">{errors.abstract.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="name" className="form-label">{t('Name')}</label>
                            <input
                                type="text"
                                id="name"
                                className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the name of the publication')}
                                {...register('name')}
                            />
                            {errors.name && <div className="text-danger">{errors.name.message}</div>}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="doi_link" className="form-label">{t('DOI Link')}</label>
                            <input
                                type="text"
                                id="doi_link"
                                className={`form-control form-control-sm ${errors.doi_link ? 'is-invalid' : ''}`}
                                placeholder={t('Write the DOI link')}
                                {...register('doi_link')}
                            />
                            {errors.doi_link && <div className="text-danger">{errors.doi_link.message}</div>}
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Publications')}
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

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Publication")} data-tooltip-place="top"  onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Publication')}
                        </button>
                    </div>

                    {publications.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No publications found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {publications.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Title')}: </strong>{entry.title}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Publication Type')}: </strong>{entry.publication_type}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Authors')}: </strong>{entry.authors}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Publication Date')}: </strong>{entry.publication_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Abstract')}: </strong>{entry.abstract}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Name')}: </strong>{entry.name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('DOI Link')}: </strong><a href={entry.doi_link} target="_blank" rel="noopener noreferrer">{entry.doi_link}</a>
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
                        ? t('Add New Publication')
                        : formMode === 'edit'
                            ? t('Update Publication') + ': ' + (selectedPublication ? selectedPublication.name : '')
                            : formMode === 'view'
                                ? t('View Publication') + ': ' + (selectedPublication ? selectedPublication.name : '')
                                : t('View Publication') + ': ' + (selectedPublication ? selectedPublication.name : '')
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

export default PublicationHistory;