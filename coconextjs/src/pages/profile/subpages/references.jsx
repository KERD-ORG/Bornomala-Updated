// pages/profile/subpages/references.jsx
import {
    React,
    useRef,
    useState,
    useEffect,
    useRouter,
    getToken,
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
    Controller,
    PhoneInput,
    Tooltip
} from '../../../utils/commonImports';

import 'react-tooltip/dist/react-tooltip.css';
import 'react-phone-input-2/lib/style.css';

const References = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];
    const handlePhoneChange = (value) => {
        setValue('contact_number', `+${value}`);
    };
    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [selectedReference, setSelectedReference] = useState(null);
    const [titles, setTitles] = useState([]);

    const schema = yup.object().shape({
        title: yup.string().trim().required(t('Title is required')),
        first_name: yup.string().trim().required(t('First name is required')),
        middle_name: yup.string().trim(),
        last_name: yup.string().trim().required(t('Last name is required')),
        organization_name: yup.string().trim().required(t('Organization name is required')),
        designation: yup.string().trim().required(t('Designation is required')),
        contact_number: yup.string().trim().required(t('Contact number is required')),
        email_address: yup.string().trim().email(t('Email address must be a valid email')).required(t('Email address is required')),
        relationship: yup.string().trim().required(t('Relationship is required')),
    });

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset, getValues, control } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            first_name: '',
            middle_name: '',
            last_name: '',
            organization_name: '',
            designation: '',
            contact_number: '',
            email_address: '',
            relationship: '',
        },
    });
    
    const fetchTitleList = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_TITLE_LIST,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
                setGlobalError('');
                setSuccessMessage('');
                if (response.data.data.titles) {
                    const titleArray = response.data.data.titles;
                    const titleOptions = titleArray.map(title => ({
                        label: title.name,
                        value: title.id,
                    }));
                    setTitles(titleOptions);
                } else {
                    setTitles([]);
                }
            } else {
                setSuccessMessage('');
                setGlobalError(response.message || t('An error occurred while fetching titles.'));
            }
        } catch (error) {
            setSuccessMessage('');
            setGlobalError(t('An error occurred while ssd fetching titles.'));
        }
    };

    const fetchReferences = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_REFERENCES,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setReferences(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching references'));
                setSuccessMessage('');
            }
        } catch (error) {
            setGlobalError(t('An error occurred while fetching references' + error.message));
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
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_REFERENCES}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_REFERENCES}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            const response = await executeAjaxOperationStandard({
                url,
                method,
                token,
                data: formData,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                if (formMode === "create") {
                    setReferences([response.data.data, ...references]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setReferences(references.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_REFERENCES}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                        setReferences(references.filter(item => item.id !== id));
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

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('title', entry.title);
        setValue('first_name', entry.first_name);
        setValue('middle_name', entry.middle_name || '');
        setValue('last_name', entry.last_name);
        setValue('organization_name', entry.organization_name);
        setValue('designation', entry.designation);
        setValue('contact_number', entry.contact_number);
        setValue('email_address', entry.email_address);
        setValue('relationship', entry.relationship);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedReference(entry);
        setShowModal(true);
    };

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchTitleList();
            fetchReferences(fetchedToken);
        }
    }, []);

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
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className={`form-control form-control-sm ${errors.title ? 'is-invalid' : ''}`}>
                                        <option value="">{t('Select Title')}</option>
                                        {titles.map(option => (
                                            <option key={option.value} value={option.value}>{t(option.label)}</option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.title && <div className="text-danger">{errors.title.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="first_name" className="form-label">{t('First Name')}</label>
                            <input
                                type="text"
                                id="first_name"
                                className={`form-control form-control-sm ${errors.first_name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the first name')}
                                {...register('first_name')}
                            />
                            {errors.first_name && <div className="text-danger">{errors.first_name.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="middle_name" className="form-label">{t('Middle Name')}</label>
                            <input
                                type="text"
                                id="middle_name"
                                className={`form-control form-control-sm ${errors.middle_name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the middle name')}
                                {...register('middle_name')}
                            />
                            {errors.middle_name && <div className="text-danger">{errors.middle_name.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="last_name" className="form-label">{t('Last Name')}</label>
                            <input
                                type="text"
                                id="last_name"
                                className={`form-control form-control-sm ${errors.last_name ? 'is-invalid' : ''}`}
                                placeholder={t('Write the last name')}
                                {...register('last_name')}
                            />
                            {errors.last_name && <div className="text-danger">{errors.last_name.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
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
                        <div className="mb-1">
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
                        <div className="mb-1">
                            <label htmlFor="contact_number" className="form-label">{t('Contact Number')}</label>
                            <PhoneInput
                                country={'us'}
                                value={getValues('contact_number')}
                                onChange={handlePhoneChange}
                                inputStyle={{ width: '100%' }}
                                containerClass={`${errors.contact_number ? 'is-invalid' : ''}`}
                                inputClass={`form-control-sm ${errors.contact_number ? 'is-invalid' : ''}`}
                            />

                            {errors.contact_number && <div className="text-danger">{errors.contact_number.message}</div>}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="email_address" className="form-label">{t('Email Address')}</label>
                            <input
                                type="email"
                                id="email_address"
                                className={`form-control form-control-sm ${errors.email_address ? 'is-invalid' : ''}`}
                                placeholder={t('Write the email address')}
                                {...register('email_address')}
                            />
                            {errors.email_address && <div className="text-danger">{errors.email_address.message}</div>}
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="mb-1">
                            <label htmlFor="relationship" className="form-label">{t('Relationship')}</label>
                            <input
                                type="text"
                                id="relationship"
                                className={`form-control form-control-sm ${errors.relationship ? 'is-invalid' : ''}`}
                                placeholder={t('Write the relationship')}
                                {...register('relationship')}
                            />
                            {errors.relationship && <div className="text-danger">{errors.relationship.message}</div>}
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('References')}
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

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Reference")} data-tooltip-place="top"  onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Reference')}
                        </button>
                    </div>

                    {references.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No references found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {references.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Title')}: </strong>{entry.title}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('First Name')}: </strong>{entry.first_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Middle Name')}: </strong>{entry.middle_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Last Name')}: </strong>{entry.last_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Organization Name')}: </strong>{entry.organization_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Designation')}: </strong>{entry.designation}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Contact Number')}: </strong>{entry.contact_number}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Email Address')}: </strong>{entry.email_address}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Relationship')}: </strong>{entry.relationship}
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
                        ? t('Add New Reference')
                        : formMode === 'edit'
                            ? t('Update Reference') + ': ' + (selectedReference ? selectedReference.title : '')
                            : formMode === 'view'
                                ? t('View Reference') + ': ' + (selectedReference ? selectedReference.title : '')
                                : t('View Reference') + ': ' + (selectedReference ? selectedReference.title : '')
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

export default References;