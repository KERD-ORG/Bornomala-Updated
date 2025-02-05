// src/pages/educational_organizations/index.jsx
import {
  React,
  useRef,
  useState,
  Loader,
  CustomAlert,
  useUserPermissions,
  executeAjaxOperationStandard,
} from "../../utils/commonImports";
import useCommonForm from "../../hooks/useCommonForm";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Layout from "../../components/layout";
import CommonModal from "../../components/CommonModal";
import CircularColumns from "./grids/circularColumns";
import CircularForm from "./forms/CircularForm";
import CircularDetails from "./CircularDetails";
import DataGridComponent from "../../components/DataGridComponent";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

export default function CircularList() {
  const dataGridRef = useRef();
  const formRef = useRef();

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

  const { permissions, permissionsMap } = useUserPermissions();

  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedCircular, setSelectedCircular] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const openModal = (mode, circular = null) => {
    setFormMode(mode);
    setSelectedCircular(circular);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCircular(null);
    if (formRef.current) {
      formRef.current.handleCancelClick();
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedCircular(null);
  };

  const handleAddRow = (newRow) => {
    handleDatagridAddRowFunction(newRow);
  };

  const handleDeletedRow = (id) => {
    handleDatagridDeleteRowFunction(id);
  };

  const handleFormSubmit = async (message, status) => {
    if (status) {
      setSuccessMessage(message);
      setGlobalError("");
    } else {
      setSuccessMessage("");
      setGlobalError(message);
    }
  };

  const openEditForm = (circular) => {
    setFormMode("edit");
    setSelectedCircular(circular);
    setShowModal(true);
  };

  const openCloneForm = (circular) => {
    setFormMode("clone");
    setSelectedCircular(circular);
    setShowModal(true);
  };

  const openShowView = (circular) => {
    setFormMode("view");
    setSelectedCircular(circular);
    setShowModal(true);
  };

  const deleteCircular = async (id) => {
    try {
      setLoading(true);
      const response = await executeAjaxOperationStandard({
        url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_CIRCULARS}${id}/`,
        method: "DELETE",
        token,
        locale: router.locale || "en",
      });

      if (
        response.status >=
          parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
        response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
      ) {
        setSuccessMessage(
          response.data.message || t("Record deleted successfully.")
        );
        setGlobalError("");
        handleDatagridDeleteRowFunction(id);
        return {
          status: "success",
          message: response.data.message || "Deleted successfully.",
        };
      } else {
        setSuccessMessage("");
        setGlobalError(t(response.message));
        return {
          status: "error",
          message: response.data.message || "Failed to delete.",
        };
      }
    } catch (error) {
      let errorMessage = t("An error occurred while deleting the record.");
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      setGlobalError(errorMessage);
      setSuccessMessage("");

      return { status: "error", message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleDatagridDeleteRowFunction = (id) => {
    if (dataGridRef.current) {
      dataGridRef.current.deleteRow(id);
    }
  };

  const handleDatagridAddRowFunction = (newRow) => {
    if (dataGridRef.current) {
      dataGridRef.current.addRow(newRow);
    }
  };

  const circularColumns = CircularColumns({
    openEditForm,
    openCloneForm,
    openShowView,
    permissionsMap,
    deleteCircular,
    t,
  });

  const openImportModal = () => {
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
  };

  return (
    <Layout>
      <Head>
        <title>{t("Circulars")}</title>

        <meta name="description" content="Learn more about us." />
      </Head>

      <h4 className="">
        <span className="text-muted fw-light">{t("Circulars")} /</span>{" "}
        {t("List")}
      </h4>

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
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-end mb-3">
            {permissionsMap.permissionlist.add_circular && (
              <>
                <button
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={t("Add New Record")}
                  data-tooltip-place="top"
                  className="btn btn-secondary btn-sm create-new btn-primary me-2"
                  type="button"
                  onClick={() => openModal("create")}
                >
                  <span>
                    <i className="bx bx-plus me-sm-1" />{" "}
                    <span className="d-none d-sm-inline-block">
                      {t("Add New Record")}
                    </span>
                  </span>
                </button>
                {/* <button
                  data-tooltip-id="import-tooltip"
                  data-tooltip-content={t("Import Data")}
                  data-tooltip-place="top"
                  className="btn btn-secondary btn-sm create-new btn-primary "
                  type="button"
                  onClick={openImportModal}
                >
                  <span>
                    <i className="bx bx-import me-sm-1" />{" "}
                    <span className="d-none d-sm-inline-block">
                      {t("Import Data")}
                    </span>
                  </span>
                </button> */}
              </>
            )}
            <Tooltip id="my-tooltip" />
            <Tooltip id="import-tooltip" />
          </div>
          <div className="col-sm-12">
            <DataGridComponent
              ref={dataGridRef}
              endpoint={process.env.NEXT_PUBLIC_API_ENDPOINT_CIRCULARS}
              columns={circularColumns}
              offset={0}
              limit={parseInt(process.env.NEXT_PUBLIC_ITEM_PER_PAGE)}
              t={t}
            />
          </div>
        </div>
      </div>

      <CommonModal
        title={
          formMode === "create"
            ? t("Add New Circular")
            : formMode === "edit"
            ? t("Update Circular") +
              ": " +
              (selectedCircular ? selectedCircular.title : "")
            : t("View Circular") +
              ": " +
              (selectedCircular ? selectedCircular.title : "")
        }
        formComponent={
          formMode === "create" ? (
            <CircularForm
              ref={formRef}
              initialData={null}
              onSubmit={handleFormSubmit}
              formMode={formMode}
              onCancel={handleCancel}
              addRow={handleAddRow}
              deleteRow={handleDeletedRow}
              loading={loading} // Pass loading state
              setLoading={setLoading} // Pass setLoading function
            />
          ) : formMode === "edit" || formMode === "clone" ? (
            <CircularForm
              ref={formRef}
              initialData={selectedCircular}
              onSubmit={handleFormSubmit}
              formMode={formMode}
              onCancel={handleCancel}
              addRow={handleAddRow}
              deleteRow={handleDeletedRow}
              loading={loading} // Pass loading state
              setLoading={setLoading} // Pass setLoading function
            />
          ) : (
            <CircularDetails circular={selectedCircular} />
          )
        }
        showModal={showModal}
        closeModal={closeModal}
      />

      {/* <CommonModal
        title={t("Import Data")}
        formComponent={
          <ImportData
            type="educational_organizations_app"
            closeModal={closeImportModal}
            show={showImportModal}
          />
        }
        showModal={showImportModal}
        closeModal={closeImportModal}
        size="extraLarge"
      /> */}

      {loading && <Loader />}
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])), // Load the 'common' namespace
    },
  };
}

CircularList.layout = "default";
