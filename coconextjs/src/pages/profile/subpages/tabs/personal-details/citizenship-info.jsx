import {
    executeAjaxOperation,
    executeAjaxOperationStandard,
    useForm,
    yupResolver,
    yup,
    React,
    useEffect,
    useState,
    useRef,
    Swal,
    CommonModal,
    Tooltip,
    Controller
} from '../../../../../utils/commonImports';
import {
    fetchCountryList,
    fetchStateList,
} from "../../../../../utils/apiService";

import 'react-tooltip/dist/react-tooltip.css';
import 'react-phone-input-2/lib/style.css';

const CitizenshipInfo = ({setLoading, setGlobalError, setSuccessMessage, token, t, router }) => {

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const formRef = useRef(null);
    const [editId, setEditId] = useState(null);
    const [citizenshipInfos, setCitizenshipInfos] = useState([]);

    const schema = yup.object().shape({
        country_code: yup.string().trim().required(t("Country is required")),
        state_province: yup
            .string()
            .when("country_code", (country_code, schema) => {
                if (states.some((state) => state.country_code === country_code[0])) {
                    return schema.required(t("Current State/Province is required"));
                } else {
                    return schema.notRequired();
                }
            }),
    });

    const { control, watch, handleSubmit, formState: { errors }, setValue, setError, register, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            country_code: "",
            state_province: "",
        },
    });

    const watchCountry = watch("country_code");

    useEffect(() => {
        if (token) {
            fetchCountryList(
                token,
                router.locale || "en",
                setGlobalError,
                setSuccessMessage,
                setCountries
            );
            fetchStateList(
                token,
                router.locale || "en",
                setGlobalError,
                setSuccessMessage,
                setStates
            );
            fetchCitizenshipInfos(token);
        }
    }, [token]);


    const fetchCitizenshipInfos = async (token) => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_CITIZENSHIP_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)) {
                setCitizenshipInfos(response.data.data || []);
                console.log(response.data.data);
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

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const url =
                formMode === "create"
                    ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_USER_CITIZENSHIP_INFO_DETAILS}`
                    : `${process.env.NEXT_PUBLIC_API_ENDPOINT_USER_CITIZENSHIP_INFO_DETAILS}${editId}/`;
            const method = formMode === "create" ? "POST" : "PUT";

            // Format dates to YYYY-MM-DD
            const formattedData = {
                ...formData
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
                    setCitizenshipInfos([response.data.data, ...citizenshipInfos]);
                    setSuccessMessage(t(response.data.message || 'Updated successfully!'))
                    setGlobalError('')
                } else {
                    setCitizenshipInfos(citizenshipInfos.map(pub => pub.id === editId ? response.data.data : pub));
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
                        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_USER_CITIZENSHIP_INFO_DETAILS}${id}/`,
                        method: 'delete',
                        token,
                        locale: router.locale || 'en',
                    });

                    if (response.success) {
                        setCitizenshipInfos(citizenshipInfos.filter(item => item.id !== id));
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
    const [selectedCitizenship, setSelectedCitizenship] = useState(null);

    const openEditForm = (entry) => {
        setFormMode("edit");
        setValue("country_code", entry.country_code || "");
        setValue("state_province", entry.state_province || "");
        setEditId(entry.id);
        setFormMode("edit");
        setSelectedCitizenship(entry);
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
                        <label className="form-label">{t("Country")}</label>
                        <Controller
                            name="country_code"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control form-control-sm ${errors.country_code ? "is-invalid" : ""
                                        }`}
                                    onChange={(e) => {
                                        setValue("country_code", e.target.value);
                                        setValue("state_province", "");
                                        field.onChange(e);
                                    }}
                                >
                                    <option value="">{t("Select Country")}</option>
                                    {countries.map((country) => (
                                        <option key={country.value} value={country.value}>
                                            {country.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.country_code && (
                            <div className="invalid-feedback">
                                {errors.country_code.message}
                            </div>
                        )}
                    </div>

                    <div className="col-md-6 mb-1">
                        <label className="form-label">{t("State/Province")}</label>

                        <Controller
                            name="state_province"
                            control={control}
                            rules={{
                                required: {
                                    value: !!watchCountry,
                                    message: "Current State/Province is required",
                                },
                            }}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    disabled={!watchCountry}
                                    className={`form-select ${errors.state_province ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="">
                                        {watchCountry
                                            ? t("Select State/Province")
                                            : t("Select Country First")}
                                    </option>
                                    {states
                                        .filter((state) => state.country_code === watchCountry)
                                        .map((state) => (
                                            <option key={state.value} value={state.value}>
                                                {state.label}
                                            </option>
                                        ))}
                                </select>
                            )}
                        />

                        {errors.state_province && (
                            <div className="invalid-feedback">
                                {errors.state_province.message}
                            </div>
                        )}
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary btn-sm mt-3">{t('Save')}</button>
                    <button type="button" className="btn btn-secondary btn-sm mt-3 ms-2" onClick={handleCancelEdit}>{t('Cancel')}</button>
                </div>
            </form>
        </div>


    );

    return (
        <div>
            <div className="d-flex justify-content-end">

                <button data-tooltip-id="my-tooltip-add" data-tooltip-content={t("Add New CitizenshipInfo")} data-tooltip-place="top" onClick={handleAddNew} className="btn btn-primary btn-sm mb-1">
                    {t('Add New Citizenship Information')}
                </button>
            </div>

            {citizenshipInfos.length === 0 && (
                <div className="row">
                    <div className="col-md-12">
                        <p><strong>{t('No citizenships found.')}</strong></p>
                        <hr className="my-1" />
                    </div>
                </div>
            )}

            <div className="row">
                {citizenshipInfos.map((entry, index) => (
                    <div className='col-md-6 mt-3' key={entry.id}>

                        <div className="list-group">

                            <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                <strong>{t('Country')}: </strong> {entry.country_name}
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center dfmod">
                                <strong>{t('State')}: </strong> {entry.state_province_name}
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

            <CommonModal
                title={
                    formMode === 'create'
                        ? t('Add New CitizenshipInfo')
                        : formMode === 'edit'
                            ? t('Update CitizenshipInfo') + ': ' + (selectedCitizenship ? selectedCitizenship.country_name : '')
                            : formMode === 'view'
                                ? t('View CitizenshipInfo') + ': ' + (selectedCitizenship ? selectedCitizenship.country_name : '')
                                : t('View CitizenshipInfo') + ': ' + (selectedCitizenship ? selectedCitizenship.country_name : '')
                }
                formComponent={formComponent}
                showModal={showModal}
                closeModal={handleCancelEdit}
            />

            <Tooltip id="my-tooltip-add" />
            <Tooltip id="my-tooltip-edit" />
            <Tooltip id="my-tooltip-delete" />

        </div>
    );

};

export default CitizenshipInfo;
