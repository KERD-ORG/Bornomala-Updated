import { useState, useEffect, useRef } from "react";
import ComboBoxFreeSolo from "./ComboBoxFreeSolo";
import { getToken } from "@/utils/auth";
import axios from "axios";
import { executeAjaxOperation } from "@/utils/fetcher";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import useLocalization from "@/hooks/useLocalization";
import { useTranslation } from "next-i18next";
import CustomAlert from "@/utils/CustomAlert";


export default function EducationalOrganizationForm({
  mode,
  onSubmit,
  initialData,
  errors,
  errorMessage,
  setError,
  setErrorMessage,
  success,
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    geo_admin_1: { code: "", name: "", id: "" },
    under_category: { code: "", name: "", id: "" },
    country: { code: "", name: "", id: "" },
    status: "",
    web_address: "",
    statement: "",
    file: null,
  });
  const { t } = useTranslation("common");
  const fileRef = useRef(null);
  const [currentLogo, setCurrentLogo] = useState(undefined);

  const [dropdownData, setDropdownData] = useState({
    countries: [],
    categories: [],
    states: [],
  });

  const [loading, setLoading] = useState(false);
  const token = getToken();
  const [keepExistingLogo, setKeepExistingLogo] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        // Fetch countries
        const countriesRes = await executeAjaxOperation({
          url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_COUNTRY}`,
          token,
          locale: router.locale,
        });

        // Handle countries response
        if (countriesRes.success) {
          setDropdownData((prevState) => ({
            ...prevState,
            countries: countriesRes.data.map(
              ({ country_code, country_name, id }) => ({
                code: country_code,
                name: country_name,
                id,
              })
            ),
          }));
        } else {
          toast.error(countriesRes.error);
        }

        // Fetch categories
        const categoriesRes = await executeAjaxOperation({
          url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION_CATEGORY}`,
          token,
          locale: router.locale,
        });
        console.log(categoriesRes);

        // Handle categories response
        if (categoriesRes.success) {
          setDropdownData((prevState) => ({
            ...prevState,
            categories: categoriesRes.data.map(({ description, id, name }) => ({
              name,
              code: description,
              id,
            })),
          }));
        } else {
          toast.error(categoriesRes.error);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, [token]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      const loadInitialData = async () => {
        try {
          setLoading(true);
          const [stateRes, categoryRes] = await Promise.allSettled([
            executeAjaxOperation({
              url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_GEO_ADMIN_1}?country=${initialData.country}`,
              token,
              locale: router.locale,
            }),
            executeAjaxOperation({
              url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION_CATEGORY}${initialData.under_category}/`,
              token,
              locale: router.locale,
            }),
          ]);

          const updatedDropdownData = { ...dropdownData };

          if (stateRes.status === "fulfilled" && stateRes.value.success) {
            updatedDropdownData.states = stateRes.value.data.map(
              ({ geo_admin_1_code, geo_admin_1_name, id }) => ({
                code: geo_admin_1_code,
                name: geo_admin_1_name,
                id,
              })
            );
          }

          let tempCat = { id: "", name: "", code: "" };

          if (categoryRes.status === "fulfilled" && categoryRes.value.success) {
            tempCat = categoryRes.value.data;
          }

          const countryData = updatedDropdownData.countries.find(
            (c) => c.id === initialData.country
          );
          const stateData = updatedDropdownData.states.find(
            (s) => s.id === initialData.geo_admin_1
          );

          let tempFormData = {
            name: initialData.name,
            statement: initialData.statement,
            status: initialData.status ? "active" : "inactive",
            country: countryData || { id: "", name: "", code: "" },
            geo_admin_1: stateData || { id: "", name: "", code: "" },
            under_category: tempCat || { id: "", name: "", code: "" },
            web_address: initialData.web_address,
            file: null,
          };
          if (initialData.document) {
            tempFormData = { ...tempFormData, document: initialData.document };
            const res = await executeAjaxOperation({
              url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_UPLOAD_DOCUMENTS}${initialData.document}/`,
              token: getToken(),
              locale: router.locale,
            });
            if (res.success) {
              setKeepExistingLogo(true);
              setCurrentLogo(res.data.image);
            } else {
              console.log(res.error);
              toast.error(res.error);
            }
          }

          setFormData(tempFormData);
        } catch (error) {
          console.error("Error loading initial data:", error);
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();
    } else {
      setKeepExistingLogo(false);
      resetForm();
    }
  }, [mode, initialData, token]);

  const resetForm = () => {
    if (mode === "edit") return;
    setDropdownData({ ...dropdownData, states: [] });

    setFormData({
      name: "",
      geo_admin_1: { code: "", name: "", id: "" },
      under_category: { code: "", name: "", id: "" },
      country: { code: "", name: "", id: "" },
      status: "",
      web_address: "",
      statement: "",
      file: null,
    });

    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    if (success) resetForm();
  }, [success]);

  const handleChange = (field, value) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { name, country, geo_admin_1, under_category, status, web_address } =
      formData;
    const err = {};
    if (!name) {
      err.name = [t("Name is required")];
    } else if (name.length > 255) {
      err.name = [t("Name cannot exceed 255 characters")];
    }

    if (!country || !country.id) {
      err.country = [t("Country is required")];
    }

    if (!geo_admin_1 || !geo_admin_1.id) {
      err.geo_admin_1 = [t("State is required")];
    }

    if (!under_category || !under_category.id) {
      err.under_category = [t("Educational organization is required")];
    }

    if (web_address.length > 255) {
      err.web_address = [t("Web address cannot exceed 255 characters")];
    }

    if (!status || (status !== "active" && status !== "inactive")) {
      err.status = [t("Select a valid status")];
    }

    if (Object.keys(err).length > 0) {
      setErrorMessage(t("Data submission failed"));
      setError(err);
      return;
    }

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value && typeof value === "object" && key !== "file") {
        submissionData.append(key, value.id);
      } else if (key !== "file" && key !== "document") {
        let processedValue = value ? value.trim() : "";
        if (
          key === "web_address" &&
          processedValue &&
          !/^https?:\/\//i.test(processedValue)
        ) {
          processedValue = `https://${processedValue}`;
        }
        submissionData.append(key, processedValue);
      } else if (key !== "file") {
        submissionData.append(key, value);
      }
    });

    if (!keepExistingLogo && formData.file) {
      submissionData.delete("document");
      submissionData.append("file", formData.file);
    } else if (keepExistingLogo) {
      submissionData.delete("file");
    }

    if (status === "active") submissionData.set("status", status === "active");
    if (status === "inactive")
      submissionData.set("status", status === "inactive");

    onSubmit(submissionData);
  };

  const onCountrySelect = async (_country) => {
    setFormData({
      ...formData,
      country:
        _country && _country.id ? _country : { code: "", name: "", id: "" },
      geo_admin_1: { code: "", name: "", id: "" },
    });
    if (!_country || !_country.id) {
      setDropdownData({
        ...dropdownData,
        states: [],
      });
      return;
    }
    setLoading(true);

    try {
      const response = await executeAjaxOperation({
        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_GEO_ADMIN_1}?country=${_country.id}`,
        token,
        locale: router.locale,
      });

      setDropdownData((prevState) => ({
        ...prevState,
        states: response.data.map(
          ({ geo_admin_1_code, geo_admin_1_name, id }) => ({
            code: geo_admin_1_code,
            name: geo_admin_1_name,
            id,
          })
        ),
      }));
    } catch (error) {
      console.error("Error fetching geo admin data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewItemAdded = (type, newItem) => {
    if (type === "error") {
      toast.error(newItem, { position: "top-center" });
      return;
    }
    toast.success(t("Record added successfully"), { position: "top-center" });
    setDropdownData((prevState) => {
      const updatedData = { ...prevState };
      updatedData[`${type.toLowerCase()}`].push(newItem);
      return updatedData;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="add-new-record pt-0 row g-2 fv-plugins-bootstrap5 fv-plugins-framework"
      id="form-add-new-record"
    >
      <Toaster />
      {errorMessage && (
        <CustomAlert
          message={errorMessage}
          type={"danger"}
          dismissable
          timer={process.env.NEXT_PUBLIC_ALERT_TIME}
          onClose={() => setErrorMessage("")}
        />
      )}
      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="name">
          {t("Organization Name")}
        </label>
        <div className="input-group input-group-merge has-validation">
          <input
            type="text"
            id="name"
            className="form-control dt-full-name"
            name="name"
            placeholder={t("Enter organization name")}
            aria-label="University of Idaho"
            value={formData.name}
            onChange={(e) => {
              if (e.target.value.length > 255) {
                setError({
                  ...errors,
                  name: [t("Name cannot exceed 255 characters")],
                });
              }
              handleChange("name", e.target.value);
            }}
          />
          {errors?.name && (
            <div className="invalid-feedback d-block">{t(errors.name[0])}</div>
          )}
        </div>
      </div>

      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="under_category">
          {t("Organization Category")}
        </label>
        <div className="input-group input-group-merge has-validation">
          <ComboBoxFreeSolo
            data={dropdownData.categories}
            defaultValue={{
              id: formData.under_category?.id,
              name: formData.under_category?.name,
              code: formData.under_category?.code,
            }}
            onValueChange={(value) => handleChange("under_category", value)}
            onNewItemAdded={handleNewItemAdded}
            placeholder={t("Select or add a category")}
            type="Category"
          />
          {errors?.under_category && (
            <div className="invalid-feedback d-block">
              {t(errors.under_category[0])}
            </div>
          )}
        </div>
      </div>

      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="country">
          {t("Country")}
        </label>
        <div className="input-group input-group-merge has-validation">
          <ComboBoxFreeSolo
            data={dropdownData.countries}
            defaultValue={{
              id: formData.country?.id,
              name: formData.country?.name,
              code: formData.country?.code,
            }}
            onValueChange={onCountrySelect}
            onNewItemAdded={handleNewItemAdded}
            type="Country"
            placeholder={t("Select or add a country")}
          />
          {errors?.country && (
            <div className="invalid-feedback d-block">
              {t(errors.country[0])}
            </div>
          )}
        </div>
      </div>

      {dropdownData.states && (
        <div className="col-sm-12 fv-plugins-icon-container">
          <label className="form-label" htmlFor="geo_admin_1">
            {t("State")}
          </label>
          <div className="input-group input-group-merge has-validation">
            <ComboBoxFreeSolo
              data={dropdownData.states}
              defaultValue={{
                id: formData.geo_admin_1?.id,
                name: formData.geo_admin_1?.name,
                code: formData.geo_admin_1?.code,
              }}
              country={formData.country?.id}
              onValueChange={(value) => handleChange("geo_admin_1", value)}
              onNewItemAdded={handleNewItemAdded}
              type="State"
              placeholder={t("Select or add a state")}
              disabled={formData.country && formData.country.id ? false : true}
            />
            {!formData.country.id && (
              <span
                style={{ fontSize: "10px", fontWeight: "500" }}
                className="mt-1 bold"
              >
                {t("Select a country first")}
              </span>
            )}
            {errors?.geo_admin_1 && (
              <div className="invalid-feedback d-block">
                {t(errors.geo_admin_1[0])}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="web_address">
          {t("Web Address")} <span>({t("optional")})</span>
        </label>
        <div className="input-group input-group-merge has-validation">
          <input
            type="text"
            id="web_address"
            className="form-control dt-full-name"
            name="web_address"
            placeholder="https://test.com"
            aria-label="https://test.com"
            value={formData.web_address}
            onChange={(e) => handleChange("web_address", e.target.value)}
          />
          {errors?.web_address && (
            <div className="invalid-feedback d-block">
              {t(errors.web_address[0])}
            </div>
          )}
        </div>
      </div>

      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="status">
          {t("Status")}
        </label>
        <div className="input-group input-group-merge has-validation">
          <select
            id="status"
            className="form-control"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="">{t("Select status")}</option>
            <option value="active">{t("Active")}</option>
            <option value="inactive">{t("Inactive")}</option>
          </select>
          {errors?.status && (
            <div className="invalid-feedback d-block">
              {t(errors.status[0])}
            </div>
          )}
        </div>
      </div>

      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="statement">
          {t("Statement")} <span>({t("optional")})</span>
        </label>
        <div className="input-group input-group-merge has-validation">
          <textarea
            id="statement"
            className="form-control"
            aria-label="With textarea"
            value={formData.statement}
            onChange={(e) => handleChange("statement", e.target.value)}
          ></textarea>
          {errors?.statement && (
            <div className="invalid-feedback d-block">
              {t(errors.statement[0])}
            </div>
          )}
        </div>
      </div>

      <div className="col-sm-12">
        <label className="form-label" htmlFor="fileUpload">
          {t("Upload Logo")} <span>({t("optional")})</span>
        </label>
        {formData.document && (
          <div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={keepExistingLogo}
                  onChange={(e) => setKeepExistingLogo(e.target.checked)}
                />{" "}
                {t("Keep Current Logo")}
              </label>
            </div>
            {keepExistingLogo && (
              <div>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${currentLogo}`}
                  alt="Current Logo"
                  style={{ height: "50px" }}
                />
              </div>
            )}
          </div>
        )}
        {!keepExistingLogo && (
          <input
            type="file"
            id="fileUpload"
            accept=".png, .jpg, .jpeg, .svg, .eps"
            name="fileUpload"
            onChange={(e) => handleChange("file", e.target.files[0])}
            className="form-control"
            ref={fileRef}
          />
        )}
        {errors?.document && (
          <div className="invalid-feedback d-block">
            {t(errors.document[0])}
          </div>
        )}
      </div>

      <div className="col-sm-12">
        <button
          type="submit"
          className="btn btn-primary data-submit me-sm-3 me-1 btn-sm"
          disabled={loading}
        >
          {t("Submit")}
        </button>
        <button
          type="reset"
          className="btn btn-outline-secondary btn-sm"
          onClick={resetForm}
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}
