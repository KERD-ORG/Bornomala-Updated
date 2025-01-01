// pages/profile/subpages/test-score.jsx
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

const TestScores = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { tab } = router.query;
    const formContainerRef = useRef(null); // Reference for the form container
    const formRef = useRef(null);
    const [token, setToken] = useState(null);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [testScores, setTestScores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const schema = yup.object().shape({
        test_name: yup.string().trim().required(t('Test name is required')),
        score: yup.number().required(t('Score is required')).test('is-valid-score', t('Invalid score'), function (value) {
            const testName = this.parent.test_name;
            let min, max;

            switch (testName) {
                case 'IELTS':
                    min = 0;
                    max = 9;
                    break;
                case 'TOEFL':
                    min = 0;
                    max = 120;
                    break;
                case 'SAT':
                    min = 400;
                    max = 1600;
                    break;
                case 'GRE':
                    min = 260;
                    max = 340;
                    break;
                case 'DUOLINGO':
                    min = 10;
                    max = 160;
                    break;
                case 'PTE':
                    min = 10;
                    max = 90;
                    break;
                default:
                    return true; // If testName is not recognized, do not apply any validation
            }

            if (value < min || value > max) {
                return this.createError({
                    message: `${t(testName)} score must be between ${min} and ${max}`,
                });
            }

            return true;
        }),
        date_taken: yup.date().required(t('Date taken is required')).typeError(t('Date taken must be a valid date')),
        test_document: yup
            .mixed()
            .test('fileType', t('Please upload a PDF file.'), (value) => {
                if (!value) return true;
                return value && value.type === 'application/pdf';
            })
            .nullable(),
    });

    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchTestScores(fetchedToken);
        }
    }, []);

    const fetchTestScores = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_TEST_SCORES,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setTestScores(response.data.data || []);
            } else {
                setGlobalError(response.error.message || t('An error occurred while fetching test scores'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error fetching test scores:', error);
            setGlobalError(t('An error occurred while fetching test scores' + error.message));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const { handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            test_name: '',
            score: '',
            date_taken: '',
            test_document: null,
        },
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_TEST_SCORES}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_TEST_SCORES}${editId}/`;

            const method = formMode === "create" ? "POST" : "PUT";
            const formData = new FormData();

            // Loop through the form data and append to formData
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'test_document' && value === null) {
                    formData.append('test_document', '');
                }
                else if (key === 'test_document' && value && value[0]) {
                    formData.append('test_document', value[0]);
                } else {
                    formData.append(key, value);
                }
            });

            if (formData.get('date_taken')) {
                const formattedDate = format(new Date(formData.get('date_taken')), 'yyyy-MM-dd');
                formData.set('date_taken', formattedDate);
            }

            const response = await executeAjaxOperationStandard({
                url: url,
                method: method,
                token,
                formData,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                if (formMode === "create") {
                    setTestScores([response.data.data, ...testScores]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'));
                    setGlobalError('');
                } else {
                    setTestScores(testScores.map(pub => pub.id === editId ? response.data.data : pub));
                    setSuccessMessage(t(response.data.message || 'Saved successfully!'));
                    setGlobalError('');
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_TEST_SCORES}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setTestScores(testScores.filter(item => item.id !== id));
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
    const [selectedTestScore, setSelectedTestScore] = useState(null);

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue('test_name', entry.test_name);
        setValue('score', entry.score);
        setValue('date_taken', entry.date_taken);
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedTestScore(entry);
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
                    <div className="col-md-6 mb-3">
                        <label htmlFor="test_name" className="form-label">{t('Test Name')}</label>
                        <select
                            id="test_name"
                            name="test_name"
                            className={`form-control form-control-sm ${errors.test_name ? 'is-invalid' : ''}`}
                            {...register('test_name')}
                        >
                            <option value="">{t('Select Test')}</option>
                            <option value="IELTS">{t('IELTS')}</option>
                            <option value="TOEFL">{t('TOEFL')}</option>
                            <option value="SAT">{t('SAT')}</option>
                            <option value="GRE">{t('GRE')}</option>
                            <option value="DUOLINGO">{t('DUOLINGO')}</option>
                            <option value="PTE">{t('PTE')}</option>
                        </select>
                        {errors.test_name && <div className="text-danger">{errors.test_name.message}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="score" className="form-label">{t('Score')}</label>
                        <input
                            type="number"
                            step="0.1"
                            id="score"
                            name="score"
                            className={`form-control form-control-sm ${errors.score ? 'is-invalid' : ''}`}
                            placeholder={t('Enter your score')}
                            {...register('score')}
                        />
                        {errors.score && <div className="text-danger">{errors.score.message}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="date_taken" className="form-label">{t('Date Taken')}</label>
                        <input
                            type="date"
                            id="date_taken"
                            name="date_taken"
                            className={`form-control form-control-sm ${errors.date_taken ? 'is-invalid' : ''}`}
                            placeholder={t('Enter the date taken')}
                            {...register('date_taken')}
                        />
                        {errors.date_taken && <div className="text-danger">{errors.date_taken.message}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="test_document" className="form-label">{t('Upload Test Document')}</label>
                        <input
                            type="file"
                            accept=".pdf"
                            className={`form-control form-control-sm ${errors.test_document ? 'is-invalid' : ''}`}
                            id="test_document"
                            name="test_document"
                            onChange={(e) => setValue('test_document', e.target.files[0])} // Ensure file input is correctly handled
                        />
                        {errors.test_document && <div className="text-danger">{errors.test_document.message}</div>}
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
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Test Score')}
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

                        <button data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New Test Score")} data-tooltip-place="top" onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                            {t('Add New Test Score')}
                        </button>
                    </div>

                    {testScores.length === 0 && (
                        <div className="row">
                            <div className="col-md-12">
                                <p><strong>{t('No test scores found.')}</strong></p>
                                <hr className="my-1" />
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {testScores.map((entry, index) => (
                            <div className='col-md-6 mt-3' key={entry.id}>

                                <div className="list-group">

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Test Name')}: </strong>{entry.test_name}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Score')}: </strong>{entry.score}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Date Taken')}: </strong>{entry.date_taken}
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Verified')}: </strong>{entry.verified ? t('Yes') : t('No')}
                                    </li>

                                    <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                        <strong>{t('Document')}: </strong>
                                        {entry.file_name ? (
                                            <div className="mb-2">
                                                <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${entry.file_url}`} className='btn btn-xs btn-label-info me-sm-2 me-1' target="_blank" rel="noopener noreferrer">
                                                    {t('View Document')}
                                                </a>
                                            </div>
                                        ) : (
                                            "N/A"
                                        )}
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
                        ? t('Add New Test Score')
                        : formMode === 'edit'
                            ? t('Update Test Score') + ': ' + (selectedTestScore ? selectedTestScore.test_name : '')
                            : formMode === 'view'
                                ? t('View Test Score') + ': ' + (selectedTestScore ? selectedTestScore.test_name : '')
                                : t('View Test Score') + ': ' + (selectedTestScore ? selectedTestScore.test_name : '')
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

export default TestScores;