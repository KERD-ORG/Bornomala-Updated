import useCommonForm from "@/hooks/useCommonForm";
import React, { useEffect, useRef, useState } from "react";
import DataGridComponent from "./DataGridComponent";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import CustomAlert from "@/utils/CustomAlert";
import { CircularProgress } from "@mui/material";
import * as yup from "yup";
import { useFormik } from "formik";

const defaultThumbnail = process.env.NEXT_PUBLIC_LOGO_DEFAULT_THUMBNAIL;

function ImportData({ type, closeModal, show }) {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const fileRef = useRef(null);
  const {
    t,
    router,
    loading,
    setLoading,
    globalError,
    setGlobalError,
    successMessage,
    setSuccessMessage,
    token,
    setToken,
  } = useCommonForm();

  const fileSchema = yup.object().shape({
    file: yup
      .mixed()
      .test(
        "fileType",
        t("Please upload a CSV or Excel file."),
        (value) =>
          !value ||
          [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ].includes(value.type)
      )
      .nullable()
      .required(t("Please upload a CSV or Excel file.")),
    images: yup
      .mixed()
      .test(
        "fileType",
        t("Please upload images in PNG or JPEG format."),
        (value) => {
          if (!value) return true;
          for (let i = 0; i < value.length; i++) {
            if (!["image/jpeg", "image/png"].includes(value[i].type)) {
              return false;
            }
          }
          return true;
        }
      )
      .nullable(),
  });

  const renderDocumentCell = (row) => {
    if (!row) return;
    const imageUrl = row.logo_url;
    return (
      <img
        src={imageUrl}
        alt="University Logo"
        onError={(e) => {
          e.target.src = defaultThumbnail;
        }}
        // onClick={() => handleLogoClick(row)}
        style={{
          width: "50px",
          height: "30px",
          borderRadius: "2px",
          border: "1px solid #000000",
          cursor: "pointer",
        }}
      />
    );
  };

  function getColumns(type, t) {
    switch (type) {
      case "educational_organizations_app":
        return [
          {
            key: "logo_url",
            name: t("Logo"),
            width: "80px",
            resizable: true,
            frozen: true,
            renderCell(props) {
              const { row } = props;
              return (
                <span style={{ padding: "5px" }}>
                  {renderDocumentCell(row)}
                </span>
              );
            },
          },
          {
            key: "name",
            name: t("Name"),
            width: "130px",
            resizable: true,
            sortable: true,
          },

          {
            key: "under_category",
            name: t("Category"),
            width: "95px",
            resizable: true,
            sortable: true,
          },
          {
            key: "web_address",
            name: t("Web Address"),
            width: "180px",
            resizable: true,
            sortable: true,
          },
          {
            key: "country_code",
            name: t("Country"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "state_province",
            name: t("State"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "city",
            name: t("City"),
            width: "100px",
            resizable: true,
            sortable: true,
          },
          {
            key: "address_line1",
            name: t("Address Line 1"),
            width: "150px",
            resizable: true,
            sortable: true,
          },
          {
            key: "address_line2",
            name: t("Address Line 2"),
            width: "150px",
            resizable: true,
            sortable: true,
          },
          {
            key: "postal_code",
            name: t("Postal Code"),
            resizable: true,
            sortable: true,
          },
          {
            key: "status",
            name: t("Status"),
            width: "100px",
            resizable: true,
            renderCell(props) {
              const { row } = props;
              let status = row.status;
              if (typeof row.status === "string") {
                status = row.status.toLowerCase() === "true";
              }
              return (
                <span
                  className={`badge badge-pill ${
                    status ? "bg-success" : "bg-danger"
                  }`}
                  style={{ borderRadius: "2px", fontSize: "10px" }}
                >
                  {status ? t("Active") : t("Inactive")}
                </span>
              );
            },
            sortable: true,
          },
        ];
      case "campus_app":
        return [
          {
            key: "campus_name",
            name: t("Campus Name"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "educational_organization",
            name: t("Educational Organization"),
            width: "95px",
            resizable: true,
            sortable: true,
          },
          {
            key: "country_code",
            name: t("Country"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "state_province",
            name: t("State"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "city",
            name: t("City"),
            width: "100px",
            resizable: true,
            sortable: true,
          },
          {
            key: "address_line1",
            name: t("Address Line 1"),
            width: "150px",
            resizable: true,
            sortable: true,
          },
          {
            key: "address_line2",
            name: t("Address Line 2"),
            width: "150px",
            resizable: true,
            sortable: true,
          },
          {
            key: "postal_code",
            name: t("Postal Code"),
            resizable: true,
            sortable: true,
          },
          {
            key: "status",
            name: t("Status"),
            width: "100px",
            resizable: true,
            renderCell(props) {
              const { row } = props;
              let status = row.staus;
              if (typeof row.status === "string") {
                status = row.status.toLowerCase() === "true";
              }
              return (
                <span
                  className={`badge badge-pill ${
                    status ? "bg-success" : "bg-danger"
                  }`}
                  style={{ borderRadius: "2px", fontSize: "10px" }}
                >
                  {status ? t("Active") : t("Inactive")}
                </span>
              );
            },
            sortable: true,
          },
        ];
      case "college_app":
        return [
          {
            key: "name",
            name: t("Name"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "campus",
            name: t("Campus"),
            width: "95px",
            resizable: true,
            sortable: true,
          },
          {
            key: "web_address",
            name: t("Web Address"),
            width: "180px",
            resizable: true,
            sortable: true,
          },
          {
            key: "country_code",
            name: t("Country"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "state_province",
            name: t("State"),
            width: "130px",
            resizable: true,
            sortable: true,
          },
          {
            key: "city",
            name: t("City"),
            width: "100px",
            resizable: true,
            sortable: true,
          },
          {
            key: "address_line1",
            name: t("Address Line 1"),
            width: "150px",
            resizable: true,
            sortable: true,
          },
          {
            key: "address_line2",
            name: t("Address Line 2"),
            width: "150px",
            resizable: true,
            sortable: true,
          },
          {
            key: "postal_code",
            name: t("Postal Code"),
            resizable: true,
            sortable: true,
          },
          {
            key: "status",
            name: t("Status"),
            width: "100px",
            resizable: true,
            renderCell(props) {
              const { row } = props;
              let status = row.status;
              if (typeof row.status === "string") {
                status = row.status.toLowerCase() === "true";
              }
              return (
                <span
                  className={`badge badge-pill ${
                    status ? "bg-success" : "bg-danger"
                  }`}
                  style={{ borderRadius: "2px", fontSize: "10px" }}
                >
                  {status ? t("Active") : t("Inactive")}
                </span>
              );
            },
            sortable: true,
          },
        ];
    }
  }

  const universityColumns = getColumns(type, t);

  const formik = useFormik({
    initialValues: {
      file: null,
      images: [],
    },
    validationSchema: fileSchema,
    onSubmit: (values) => {
      handleImport(values.file, values.images, false);
    },
  });

  useEffect(() => {
    setGlobalError("");
    setSuccessMessage("");
    setFile(null);
    setImages([]);
    setInitialData([]);
    formik.setFieldValue("file", null);
    formik.setFieldValue("images", []);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }, [show]);

  useEffect(() => {
    if (file) {
      handleImport(file, images, true);
    }
  }, [file]);

  useEffect(() => {
    if (images) {
      const temp = initialData.map((val) => {
        for (let i = 0; i < images.length; i++) {
          if (images[i].name === val.logo_file) {
            const imageUrl = URL.createObjectURL(images[i]);
            return { ...val, logo_url: imageUrl };
          }
        }
        return { ...val, logo_url: null };
      });
      setInitialData(temp);
    }
  }, [images]);

  const handleFileDrop = (acceptedFiles) => {
    formik.setFieldValue("file", acceptedFiles[0]);
    setFile(acceptedFiles[0]);
  };

  const handleImagesDrop = (acceptedFiles) => {
    formik.setFieldValue("images", acceptedFiles);
    // console.log(acceptedFiles);
    setImages(acceptedFiles);
  };

  const handleImport = async (file, images, preview) => {
    const formData = new FormData();
    formData.append("file", file);
    if (images) {
      Array.from(images).forEach((image) =>
        formData.append("document_file", image)
      );
    }
    formData.append("type", type);
    formData.append("preview", preview);
    setLoading(true);
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_IMPORT_DATA,
      method: "POST",
      token,
      formData,
      locale: router.locale || "en",
    });
    setLoading(false);
    if (
      response.status >=
        parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (preview) {
        setInitialData(response.data);
      } else {
        setSuccessMessage(t("Data imported successfully!"));
        setTimeout(() => {
          window.location.reload();
        }, 750);
      }
    } else {
      setGlobalError(response.message);
    }
  };

  return (
    <>
      {globalError && (
        <CustomAlert
          message={globalError}
          dismissable={true}
          timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
          onClose={() => setGlobalError("")}
          type="danger"
        />
      )}
      {successMessage && (
        <CustomAlert
          message={successMessage}
          dismissable={true}
          timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
          onClose={() => setSuccessMessage("")}
          type="success"
        />
      )}
      <form onSubmit={formik.handleSubmit}>
        <div className="row">
          <div className="col-md-12">
            <label htmlFor="file">{t("CSV/EXCEL File")}</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className={`form-control mt-1 ${
                formik.errors.file && formik.touched.file ? "is-invalid" : ""
              }`}
              id="file"
              name="file"
              onChange={(event) => handleFileDrop(event.target.files)}
            />
            {formik.errors.file && formik.touched.file ? (
              <div className="invalid-feedback">{formik.errors.file}</div>
            ) : null}
          </div>
          {type === "educational_organizations_app" && formik.values.file && (
            <div className="col-md-12 mt-3">
              <label htmlFor="images">{t("Images")}</label>
              <input
                type="file"
                multiple
                accept="image/jpeg, image/png"
                className={`form-control mt-1 ${
                  formik.errors.images && formik.touched.images
                    ? "is-invalid"
                    : ""
                }`}
                id="images"
                name="images"
                onChange={(event) =>
                  handleImagesDrop(event.currentTarget.files)
                }
              />
              {formik.errors.images && formik.touched.images ? (
                <div className="invalid-feedback">{formik.errors.images}</div>
              ) : null}
            </div>
          )}
        </div>
        {loading ? (
          <div
            style={{
              margin: "40px 0",
              display: "flex",
              justifyContent: "center",
            }}
            c
          >
            <CircularProgress />
          </div>
        ) : (
          <div className="mt-4">
            {initialData.length > 0 && (
              <>
                <DataGridComponent
                  endpoint={
                    process.env
                      .NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION
                  }
                  columns={universityColumns}
                  initialData={initialData}
                  offset={0}
                  limit={parseInt(process.env.NEXT_PUBLIC_ITEM_PER_PAGE)}
                  t={t}
                />

                <div className="mt-4 d-flex">
                  <button
                    className="btn btn-secondary btn-sm create-new btn-primary"
                    style={{ marginLeft: "auto" }}
                    type="submit"
                    disabled={loading}
                  >
                    {t("Import")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </form>
    </>
  );
}

export default ImportData;
