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
  CustomAlert,
} from "../../../utils/commonImports";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { useRouter } from "next/router";
import { getToken } from "../../../utils/commonImports";
import useCommonForm from "../../../hooks/useCommonForm";
import {
  fetchCircularCategory,
  fetchEducationalOrganizations,
} from "../../../utils/apiService";
import { Button } from "react-bootstrap";

function formatToYYYYMMDD(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return value; // Let the backend reject it or handle it
  }
  // Convert to UTC or local depending on your use-case
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const CircularForm = forwardRef(
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

    const schema = yup
      .object()
      .shape({
        title: yup.string().required(t("Title is required")),
        category_id: yup
          .number()
          .typeError(t("Category is required"))
          .required(t("Category is required")),
        description: yup.string().required(t("Description is required")),
        organization: yup
          .number()
          .typeError(t("Organization is required"))
          .required(t("Organization is required")),
        publication_date: yup
          .date()
          .typeError(t("Invalid publication date"))
          .required(t("Publication date is required")),
        deadline: yup
          .date()
          .typeError(t("Invalid deadline"))
          .required(t("Deadline is required")),
        start_date: yup
          .date()
          .typeError(t("Invalid start date"))
          .required(t("Start date is required")),
        end_date: yup
          .date()
          .typeError(t("Invalid end date"))
          .required(t("End date is required")),
        location: yup.string().required(t("Location is required")),
        eligibility_criteria: yup
          .string()
          .required(t("Eligibility Criteria is required")),
        status: yup
          .string()
          .oneOf(["Open", "Closed", "Upcoming"], t("Invalid status"))
          .required(t("Status is required")),
        link_to_circular: yup
          .string()
          .url(t("Invalid URL"))
          .required(t("Link to circular is required.")),
        attachment: yup
          .mixed()
          .test(
            "fileSize",
            t("File too large"),
            // Example file size limit = 2MB
            (value) => !value || (value && value.size <= 2 * 1024 * 1024)
          )
          .nullable(),
      })
      // Custom test to ensure start_date <= end_date if both exist
      .test(
        "startDateBeforeEndDate",
        "Start date must be before end date",
        function (value) {
          const { start_date, end_date } = value;
          if (!start_date || !end_date) return true; // Skip if either is missing
          if (new Date(start_date) <= new Date(end_date)) {
            return true;
          }
          // If test fails, create an error on end_date
          return this.createError({
            path: "end_date",
            message: "Start date must be before end date",
          });
        }
      );

    const [categoryList, setCategoryList] = useState([]);
    const [organizationList, setOrganizationList] = useState([]);
    const router = useRouter();

    const defaultFormData = {
      title: "",
      category_id: "",
      description: "",
      organization: "",
      publication_date: "",
      deadline: "",
      start_date: "",
      end_date: "",
      location: "",
      eligibility_criteria: "",
      status: "",
      link_to_circular: "",
      attachment: null,
    };
    const [formData, setFormData] = useState(defaultFormData);
    const [showFileUpload, setShowFileUpload] = useState(true);

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
        fetchEducationalOrganizations(
          token,
          router.locale || "en",
          setGlobalError,
          setSuccessMessage,
          setOrganizationList
        );
        fetchCircularCategory(
          token,
          router.locale || "en",
          setGlobalError,
          setSuccessMessage,
          setCategoryList
        );
      }
    }, [token]);

    useEffect(() => {
      if (initialData) {
        if (initialData?.attachment_url) {
          setShowFileUpload(false);
        }
        const newFormData = {
          title: initialData.title || "",
          category_id: initialData.category.id || "",
          description: initialData.description || "",
          organization: initialData.organization || "",
          publication_date: initialData.publication_date || "",
          deadline: initialData.deadline || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          location: initialData.location || "",
          eligibility_criteria: initialData.eligibility_criteria || "",
          status: initialData.status || "",
          link_to_circular: initialData.link_to_circular || "",
          attachment: null, // We'll reset the file input
        };
        setFormData(newFormData);

        // also update react-hook-form
        Object.keys(newFormData).forEach((key) => {
          setValue(key, newFormData[key]);
        });
      } else {
        // If no initialData, just reset to defaults
        setFormData(defaultFormData);
        reset(defaultFormData);
      }
    }, [initialData, setValue]);

    const onSubmitForm = async (data) => {
      setLoading(true);
      try {
        data.publication_date = formatToYYYYMMDD(data.publication_date);
        data.deadline = formatToYYYYMMDD(data.deadline);
        data.start_date = formatToYYYYMMDD(data.start_date);
        data.end_date = formatToYYYYMMDD(data.end_date);
        let url = `${process.env.NEXT_PUBLIC_API_ENDPOINT_CIRCULARS}`;
        let method = "POST";
        if (formMode === "edit" && initialData && initialData.id) {
          url = `${process.env.NEXT_PUBLIC_API_ENDPOINT_CIRCULARS}${initialData.id}/`;
          method = "PUT";
        }

        // Build FormData for file upload
        const formDataObj = new FormData();
        // Move all fields into FormData
        Object.entries(data).forEach(([key, value]) => {
          if (key === "attachment") {
            // Only append if user selected a file
            if (value && value[0] instanceof File) {
              formDataObj.append("attachment", value[0]);
            }
          } else {
            // For the rest, just append as text
            formDataObj.append(key, value);
          }
        });

        const response = await executeAjaxOperationStandard({
          url,
          method,
          token,
          formData: formDataObj, // pass the FormData
          locale: router.locale || "en",
        });

        if (
          response.status >=
            parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          if (formMode === "edit") {
            deleteRow(response.data.id);
          }
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
          <CustomAlert
            type={"danger"}
            message={globalError}
            onClose={() => setGlobalError("")}
            dismissable
            timer={5000}
          />
        )}
        <div className="row">
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Title")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.title ? "is-invalid" : ""
              }`}
              {...register("title")}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            {errors.title && (
              <div className="invalid-feedback">{errors.title.message}</div>
            )}
          </div>
          <div className="col-md-6">
            <label className="form-label">{t("Link to Circular")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.link_to_circular ? "is-invalid" : ""
              }`}
              {...register("link_to_circular")}
              value={formData.link_to_circular}
              onChange={(e) =>
                setFormData({ ...formData, link_to_circular: e.target.value })
              }
            />
            {errors.link_to_circular && (
              <div className="invalid-feedback">
                {errors.link_to_circular.message}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Category")}</label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`form-control form-control-sm ${
                    errors.category_id ? "is-invalid" : ""
                  }`}
                  onChange={(e) => {
                    setValue("category_id", e.target.value);
                    field.onChange(e);
                  }}
                >
                  <option value="">{t("Select Category")}</option>
                  {categoryList.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category_id && (
              <div className="invalid-feedback">
                {errors.category_id.message}
              </div>
            )}
          </div>
          <div className="col-md-6 mb-1">
            <label className="form-label">{t("Organization")}</label>
            <Controller
              name="organization"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`form-control form-control-sm ${
                    errors.organization ? "is-invalid" : ""
                  }`}
                  onChange={(e) => {
                    setValue("organization", e.target.value);
                    setFormData({ ...formData, organization: e.target.value });
                    field.onChange(e);
                  }}
                >
                  <option value="">{t("Select Organization")}</option>
                  {organizationList.map((org) => (
                    <option key={org.value} value={org.value}>
                      {org.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.organization && (
              <div className="invalid-feedback">
                {errors.organization.message}
              </div>
            )}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-12">
            <label className="form-label">{t("Description")}</label>
            <textarea
              className={`form-control form-control-sm ${
                errors.description ? "is-invalid" : ""
              }`}
              {...register("description")}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            {errors.description && (
              <div className="invalid-feedback">
                {errors.description.message}
              </div>
            )}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <label className="form-label">{t("Publication Date")}</label>
            <input
              type="date"
              className={`form-control form-control-sm ${
                errors.publication_date ? "is-invalid" : ""
              }`}
              {...register("publication_date")}
              value={formData.publication_date}
              onChange={(e) =>
                setFormData({ ...formData, publication_date: e.target.value })
              }
            />
            {errors.publication_date && (
              <div className="invalid-feedback">
                {errors.publication_date.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label">{t("Deadline")}</label>
            <input
              type="date"
              className={`form-control form-control-sm ${
                errors.deadline ? "is-invalid" : ""
              }`}
              {...register("deadline")}
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />
            {errors.deadline && (
              <div className="invalid-feedback">{errors.deadline.message}</div>
            )}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <label className="form-label">{t("Start Date")}</label>
            <input
              type="date"
              className={`form-control form-control-sm ${
                errors.start_date ? "is-invalid" : ""
              }`}
              {...register("start_date")}
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
            />
            {errors.start_date && (
              <div className="invalid-feedback">
                {errors.start_date.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label">{t("End Date")}</label>
            <input
              type="date"
              className={`form-control form-control-sm ${
                errors.end_date ? "is-invalid" : ""
              }`}
              {...register("end_date")}
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
            />
            {errors.end_date && (
              <div className="invalid-feedback">{errors.end_date.message}</div>
            )}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-12">
            <label className="form-label">{t("Eligibility Criteria")}</label>
            <textarea
              className={`form-control form-control-sm ${
                errors.eligibility_criteria ? "is-invalid" : ""
              }`}
              {...register("eligibility_criteria")}
              value={formData.eligibility_criteria}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  eligibility_criteria: e.target.value,
                })
              }
            />
            {errors.eligibility_criteria && (
              <div className="invalid-feedback">
                {errors.eligibility_criteria.message}
              </div>
            )}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <label className="form-label">{t("Status")}</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`form-control form-control-sm ${
                    errors.status ? "is-invalid" : ""
                  }`}
                  onChange={(e) => {
                    setValue("status", e.target.value);
                    setFormData({ ...formData, status: e.target.value });
                    field.onChange(e);
                  }}
                >
                  <option value="">{t("Select Status")}</option>
                  <option value="Open">{t("Open")}</option>
                  <option value="Closed">{t("Closed")}</option>
                  <option value="Upcoming">{t("Upcoming")}</option>
                </select>
              )}
            />
            {errors.status && (
              <div className="invalid-feedback">{errors.status.message}</div>
            )}
          </div>
          <div className="col-md-6">
            <label className="form-label">{t("Location")}</label>
            <input
              type="text"
              className={`form-control form-control-sm ${
                errors.location ? "is-invalid" : ""
              }`}
              {...register("location")}
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
            {errors.location && (
              <div className="invalid-feedback">{errors.location.message}</div>
            )}
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-12">
            <label className="form-label">{t("Attachment (Optional)")}</label>
            {formMode === "edit" &&
              !showFileUpload &&
              initialData?.attachment_url && (
                <div className="d-flex align-items-center mb-2">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${initialData.attachment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="me-3"
                  >
                    {t("Click here to see the file content")}
                  </a>
                  {/** Secondary button from react-bootstrap in the same row */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFileUpload(true)}
                  >
                    {t("Change")}
                  </Button>
                </div>
              )}
            {showFileUpload && (
              <input
                type="file"
                className={`form-control form-control-sm ${
                  errors.attachment ? "is-invalid" : ""
                }`}
                {...register("attachment")}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, attachment: file });
                }}
              />
            )}
            {errors.attachment && (
              <div className="invalid-feedback">
                {errors.attachment.message}
              </div>
            )}
          </div>
        </div>

        <div
          className="d-flex justify-content-end"
          style={{ marginTop: "40px" }}
        >
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

CircularForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  formMode: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CircularForm;
