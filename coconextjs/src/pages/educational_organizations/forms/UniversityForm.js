import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";
import {
  yupResolver,
  executeAjaxOperationStandard,
} from "../../../utils/commonImports";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { useRouter } from "next/router";
import { getToken, useTranslation } from "../../../utils/commonImports";
import useCommonForm from "../../../hooks/useCommonForm";
import {
  fetchCountryList,
  fetchStateList,
  fetchOrganizationCategoryList,
} from "../../../utils/apiService";

const DIVISIONS = [
  { value: 1, label: "Dhaka" },
  { value: 2, label: "Chattogram" },
  { value: 3, label: "Khulna" },
  { value: 4, label: "Rajshahi" },
  { value: 5, label: "Barishal" },
  { value: 6, label: "Sylhet" },
  { value: 7, label: "Rangpur" },
  { value: 8, label: "Mymensingh" },
];

const UniversityForm = forwardRef(
  (
    {
      initialData,
      onSubmit,
      formMode,
      onCancel,
      addRow,
      deleteRow,
      loading,
      setLoading,
    },
    ref
  ) => {
    const {
      t,
      globalError,
      setGlobalError,
      setSuccessMessage,
      token,
      setToken,
    } = useCommonForm();

    const [organizationCategories, setOrganizationCategories] = useState([]);
    const router = useRouter();

    const defaultFormData = {
      name: "",
      under_category: "",
      web_address: "",
      division: "",
      address_line1: "",
      address_line2: "",
      postal_code: "",
      statement: "",
      status: false,
      document_file: null,
      logo_url: "",
      send_approve_mail: false,
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [showFileUpload, setShowFileUpload] = useState(false);

    const schema = yup.object().shape({
      name: yup.string().trim().required(t("Name is required")),
      under_category: yup.string().trim().required(t("Category is required")),
      web_address: yup
        .string()
        .trim()
        .url(t("Invalid URL format"))
        .required(t("Web Address is required")),
      division: yup.string().trim().required(t("Division is required")),
      // city: yup.string().trim().required(t("City is required")),
      address_line1: yup
        .string()
        .trim()
        .required(t("Address Line 1 is required")),
      postal_code: yup.string().trim().required(t("Zip Code is required")),
      email: yup
        .string()
        .trim()
        .email(t("Invalid mail"))
        .required(t("Email is required")),
    });

    const {
      register,
      handleSubmit,
      setValue,
      control,
      formState: { errors },
      watch,
      reset,
      setError,
    } = useForm({
      resolver: yupResolver(schema),
      defaultValues: initialData || formData,
    });

    const [showGlobalError, setShowGlobalError] = useState(true);
    useEffect(() => {
      if (globalError) {
        setShowGlobalError(true);
        const timer = setTimeout(() => {
          setShowGlobalError(false);
          setGlobalError("");
        }, parseInt(process.env.NEXT_PUBLIC_ALERT_TIME));

        return () => clearTimeout(timer);
      }
    }, [globalError]);

    const handleDismissError = () => {
      setShowGlobalError(false);
      setGlobalError("");
    };

    useEffect(() => {
      const fetchedToken = getToken();
      if (!fetchedToken) {
        router.push(process.env.NEXT_PUBLIC_URL_SIGNIN);
      } else {
        setToken(fetchedToken);
      }
    }, [router]);

    useEffect(() => {
      if (token) {
        fetchOrganizationCategoryList(
          token,
          router.locale || "en",
          setGlobalError,
          setSuccessMessage,
          setOrganizationCategories
        );
      }
    }, [token]);

    useEffect(() => {
      setShowFileUpload(false);
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          under_category: initialData.under_category || "",
          web_address: initialData.web_address || "",
          division: initialData.division || "",
          // city: initialData.city || "",
          address_line1: initialData.address_line1 || "",
          address_line2: initialData.address_line2 || "",
          postal_code: initialData.postal_code || "",
          statement: initialData.statement || "",
          email: initialData.email || "",
          status: initialData.status ? true : false,
          document_file: null, // Ensure document_file field is reset
          logo_url: initialData.logo_url || "",
          send_approve_mail: false,
        });

        setValue("name", initialData.name || "");
        setValue("under_category", initialData.under_category || "");
        setValue("web_address", initialData.web_address || "");
        setValue("division", initialData.division || "");
        // setValue("city", initialData.city || "");
        setValue("address_line1", initialData.address_line1 || "");
        setValue("email", initialData.email || "");
        setValue("address_line2", initialData.address_line2 || "");
        setValue("postal_code", initialData.postal_code || "");
        setValue("statement", initialData.statement || "");
        setValue("status", initialData.status ? true : false);
        setValue("logo_url", initialData.logo_url || "");
        setValue("send_approve_mail", false);
      }
    }, [initialData, setValue]);

    const onSubmitForm = async (data) => {
      try {
        const {
          first_name,
          last_name,
          middle_name,
          document,
          document_name,
          ...filteredData
        } = data;
        data = filteredData;

        if (formMode === "create" || formMode === "clone") {
          data.first_name = null;
          data.last_name = null;
          data.middle_name = null;
        }

        const url =
          formMode === "create"
            ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION}`
            : formMode === "edit"
            ? `${process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION}${initialData.id}/`
            : `${process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION}`;
        const method =
          formMode === "create" || formMode === "clone" ? "POST" : "PUT";
        data.status = data.status ? 1 : 0;
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          // Check if the key is 'document_file' and skip it if no file is selected
          if (key === "document_file") {
            if (value && value.length > 0 && value[0]) {
              formData.append("document_file", value[0]);
            }
          } else {
            formData.append(key, value);
          }
        });

        setLoading(true);
        const response = await executeAjaxOperationStandard({
          url: url,
          method: method,
          token,
          formData,
          locale: router.locale || "en",
        });

        if (
          response.status >=
            parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          deleteRow(response.data.id);
          addRow(response.data);
          handleCancelClick();
          onSubmit(
            response.data.message || t("Form submitted successfully."),
            true
          );
        } else {
          if (response.details) {
            Object.keys(response.details).forEach((field) => {
              setError(field, {
                type: "server",
                message: response.details[field][0],
              });
            });
          }
          //setGlobalError(response.message);
          setSuccessMessage("");
        }
      } catch (error) {
        let errorMessage = t("An error occurred while submitting the form.");
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          errorMessage = error.response.data.error;
        }
        setGlobalError(errorMessage);
        setSuccessMessage("");
      } finally {
        setLoading(false);
      }
    };

    const handleCancelClick = () => {
      setFormData(defaultFormData);
      reset(defaultFormData);
      onCancel();
    };

    useImperativeHandle(
      ref,
      () => ({
        handleCancelClick: handleCancelClick,
      }),
      []
    );

    return (
      <form onSubmit={handleSubmit(onSubmitForm)} encType="multipart/form-data">
        {globalError && (
          <div
            className="alert alert-danger alert-dismissible fade show mt-3"
            role="alert"
          >
            <strong>{globalError}</strong>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleDismissError}
            ></button>
          </div>
        )}
        <div className="row">
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Name")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.name ? "is-invalid" : ""
              }`}
              {...register("name")}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name.message}</div>
            )}
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Category")}</label>
            <Controller
              name="under_category"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`form-control form-control-sm ${
                    errors.under_category ? "is-invalid" : ""
                  }`}
                  onChange={(e) => {
                    setValue("under_category", e.target.value);
                    field.onChange(e);
                  }}
                >
                  <option value="">{t("Select Category")}</option>
                  {organizationCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.under_category && (
              <div className="invalid-feedback">
                {errors.under_category.message}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Web Address")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.web_address ? "is-invalid" : ""
              }`}
              {...register("web_address")}
              value={formData.web_address}
              onChange={(e) =>
                setFormData({ ...formData, web_address: e.target.value })
              }
            />
            {errors.web_address && (
              <div className="invalid-feedback">
                {errors.web_address.message}
              </div>
            )}
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Division")}</label>
            <Controller
              name="division"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`form-control form-control-sm ${
                    errors.division ? "is-invalid" : ""
                  }`}
                  onChange={(e) => {
                    setValue("division", e.target.value);
                    field.onChange(e);
                  }}
                >
                  <option value="">{t("Select Division")}</option>
                  {DIVISIONS.map((country) => (
                    <option
                      key={`${country.value}${country.label}`}
                      value={country.value}
                    >
                      {country.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.division && (
              <div className="invalid-feedback">{errors.division.message}</div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Logo")}</label>

            {formMode === "edit" && formData.logo_url && !showFileUpload ? (
              <div className="mb-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${formData.logo_url}`}
                  className="btn btn-xs btn-label-info me-sm-2 me-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("View")}
                </a>
                <button
                  className="btn btn-xs btn-warning"
                  onClick={() => setShowFileUpload(true)}
                >
                  {t("Edit")}
                </button>
              </div>
            ) : (
              <input
                type="file"
                className={`form-control form-control-sm ${
                  errors.document_file ? "is-invalid" : ""
                }`}
                {...register("document_file")}
                onChange={(e) =>
                  setFormData({ ...formData, document_file: e.target.files })
                }
              />
            )}
            {formData.logo_url && showFileUpload && (
              <button
                className="btn btn-outline-danger file_upload_cancel_btn btn-xs me-2 cancelButton"
                onClick={() => setShowFileUpload(false)}
              >
                {t("Cancel")}
              </button>
            )}

            {errors.document_file && (
              <div className="invalid-feedback">
                {errors.document_file.message}
              </div>
            )}
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Email")}</label>
            <input
              type="email"
              className={`form-control form-control-sm ${
                errors.email ? "is-invalid" : ""
              }`}
              {...register("email")}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>
        </div>

        <div className="row">
          {/* <div className="col-md-6 mb-1">
            <label className="form-label">{t("City")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.city ? "is-invalid" : ""
              }`}
              {...register("city")}
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
            {errors.city && (
              <div className="invalid-feedback">{errors.city.message}</div>
            )}
          </div> */}

          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Zip Code")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.postal_code ? "is-invalid" : ""
              }`}
              {...register("postal_code")}
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
            />
            {errors.postal_code && (
              <div className="invalid-feedback">
                {errors.postal_code.message}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Address Line 1")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.address_line1 ? "is-invalid" : ""
              }`}
              {...register("address_line1")}
              value={formData.address_line1}
              onChange={(e) =>
                setFormData({ ...formData, address_line1: e.target.value })
              }
            />
            {errors.address_line1 && (
              <div className="invalid-feedback">
                {errors.address_line1.message}
              </div>
            )}
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Address Line 2")}</label>
            <input
              type="text"
              className="form-control form-control-sm"
              {...register("address_line2")}
              value={formData.address_line2}
              onChange={(e) =>
                setFormData({ ...formData, address_line2: e.target.value })
              }
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12 mb-1">
            <label className="form-label">{t("Statement")}</label>
            <textarea
              className={`form-control form-control-sm ${
                errors.statement ? "is-invalid" : ""
              }`}
              {...register("statement")}
              value={formData.statement}
              onChange={(e) =>
                setFormData({ ...formData, statement: e.target.value })
              }
            />
            {errors.statement && (
              <div className="invalid-feedback">{errors.statement.message}</div>
            )}
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-md-2 mb-1">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="status"
                {...register("status")}
                checked={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.checked })
                }
              />
              <label className="form-check-label" htmlFor="status">
                {t("Status")}
              </label>
            </div>
          </div>

          {formMode === "edit" ? (
            <div className="col-md-3 mb-1">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="send_approve_mail"
                  {...register("send_approve_mail")}
                  checked={formData.send_approve_mail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      send_approve_mail: e.target.checked,
                    })
                  }
                />
                <label className="form-check-label" htmlFor="send_approve_mail">
                  {t("Send Approve Mail")}
                </label>
              </div>
            </div>
          ) : (
            <div className="col-md-3 mb-1"></div>
          )}
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-sm btn-secondary me-2"
            onClick={handleCancelClick}
          >
            {t("Cancel")}
          </button>
          <button type="submit" className="btn btn-sm btn-primary">
            {formMode === "edit"
              ? t("Save")
              : formMode === "clone"
              ? t("Save")
              : t("Save")}
          </button>
        </div>
      </form>
    );
  }
);

UniversityForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  formMode: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default UniversityForm;
