// pages/profile/subpages/academic-history.jsx
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

const AcademicHistory = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [academicRecords, setAcademicRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        institution_name: yup.string().trim().required(t('Institution name is required')),
        institution_address: yup.string().trim().required(t('Institution address is required')),
        start_date: yup.date().required(t('Start date is required')).typeError(t('Start date must be a valid date')),
        end_date: yup.date()
            .nullable()
            .typeError(t('End date must be a valid date'))
            .test('end_date', t('End date must be greater than start date.'), function (value) {
                const { start_date } = this.parent;
                return !value || !start_date || value > start_date;
            }),
        degree_date: yup.date()
            .nullable()
            .typeError(t('Degree date must be a valid date'))
            .test('degree_date', t('Degree date must be greater than start date.'), function (value) {
                const { start_date } = this.parent;
                return !value || !start_date || value > start_date;
            })
            .test('degree_date', t('Degree date must be greater than end date.'), function (value) {
                const { end_date } = this.parent;
                return !value || !end_date || value > end_date;
            }),
        degree_expected: yup.boolean(),
        major: yup.string().trim().required(t('Major is required')),
    });

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchAcademicRecords(fetchedToken);
        }
    }, []);

    const fetchAcademicRecords = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_ACADEMIC_HISTORY,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setAcademicRecords(response.data.data || []);
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
            institution_name: '',
            institution_address: '',
            start_date: '',
            end_date: '',
            degree_expected: false,
            degree_date: '',
            major: '',
        },
    });

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_ACADEMIC_HISTORY}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_ACADEMIC_HISTORY}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            // Format dates to YYYY-MM-DD
            const formattedData = {
                ...formData,
                start_date: formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : null,
                end_date: formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : null,
                degree_date: formData.degree_date ? format(new Date(formData.degree_date), 'yyyy-MM-dd') : null,
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
                    setAcademicRecords([response.data.data, ...academicRecords]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setAcademicRecords(academicRecords.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_ACADEMIC_HISTORY}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setAcademicRecords(academicRecords.filter(item => item.id !== id));
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
    const [selectedAcademicRecord, setSelectedPublication] = useState(null);
  

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('institution_name', entry.institution_name);
        setValue('institution_address', entry.institution_address);
        setValue('start_date', entry.start_date);
        setValue('end_date', entry.end_date);
        setValue('degree_expected', entry.degree_expected);
        setValue('degree_date', entry.degree_date);
        setValue('major', entry.major);
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
                        <label htmlFor="institution_name" className="form-label">{t('Institution Name')}</label>
                        <input
                            type="text"
                            id="institution_name"
                            className={`form-control form-control-sm ${errors.institution_name ? 'is-invalid' : ''}`}
                            placeholder={t('Write your institution name')}
                            {...register('institution_name')}
                        />
                        {errors.institution_name && <div className="text-danger">{errors.institution_name.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="institution_address" className="form-label">{t('Institution Address')}</label>
                        <input
                            type="text"
                            id="institution_address"
                            className={`form-control form-control-sm ${errors.institution_address ? 'is-invalid' : ''}`}
                            placeholder={t('Write your institution address')}
                            {...register('institution_address')}
                        />
                        {errors.institution_address && <div className="text-danger">{errors.institution_address.message}</div>}
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
                        <label htmlFor="degree_date" className="form-label">{t('Degree Date')}</label>
                        <input
                            type="date"
                            id="degree_date"
                            className={`form-control form-control-sm ${errors.degree_date ? 'is-invalid' : ''}`}
                            {...register('degree_date')}
                        />
                        {errors.degree_date && <div className="text-danger">{errors.degree_date.message}</div>}
                    </div>
                    <div className="col-md-6 mb-1">
                        <label htmlFor="major" className="form-label">{t('Major')}</label>
                        <input
                            type="text"
                            id="major"
                            className={`form-control form-control-sm ${errors.major ? 'is-invalid' : ''}`}
                            placeholder={t('Write your major')}
                            {...register('major')}
                        />
                        {errors.major && <div className="text-danger">{errors.major.message}</div>}
                    </div>

                    <div className="col-md-12 mb-1 mt-2">
                       
                        <div className="form-check">
                        <input
                            type="checkbox"
                            id="degree_expected"
                            className="form-check-input"
                            {...register('degree_expected')}
                        />
                            <label htmlFor="degree_expected" className="form-check-label">{t('Degree Expected')}</label>
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Academic History')}
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

                        <button  data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Academic Record")} data-tooltip-place="top"  onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Academic Record')}
                        </button>
                    </div>

                    {academicRecords.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No research experiences found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {academicRecords.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Institution Name')}: </strong>{entry.institution_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Institution Address')}: </strong>{entry.institution_address}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Major')}: </strong>{entry.major}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('From')}: </strong>{entry.start_date}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('To')}: </strong>{entry.end_date || t('Present')}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Degree Expected')}: </strong>{entry.degree_expected ? t('Yes') : t('No')}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Degree Date')}: </strong>{entry.degree_date}
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
                        ? t('Add New Academic Record')
                        : formMode === 'edit'
                            ? t('Update Academic Record') + ': ' + (selectedAcademicRecord ? selectedAcademicRecord.institution_name : '')
                            : formMode === 'view'
                                ? t('View Academic Record') + ': ' + (selectedAcademicRecord ? selectedAcademicRecord.institution_name : '')
                                : t('View Academic Record') + ': ' + (selectedAcademicRecord ? selectedAcademicRecord.institution_name : '')
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

export default AcademicHistory;