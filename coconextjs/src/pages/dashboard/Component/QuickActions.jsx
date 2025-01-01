import React, { useState, useRef, useEffect } from "react";
import CommonModal from "@/components/CommonModal";
import useCommonForm from "@/hooks/useCommonForm";
import toast, { Toaster } from "react-hot-toast";
import UniversityForm from "../../educational_organizations/forms/UniversityForm";
import { useUserPermissions } from "@/contexts/UserPermissionsContext";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { CircularProgress } from "@mui/material";
import CustomAlert from "@/utils/CustomAlert";
import RegisterUser from "./RegisterUser";

function QuickActions({ open, setOpen, setOpenseettings }) {
  const formRef = useRef();
  const { t, router, setSuccessMessage, setGlobalError, globalError, token } =
    useCommonForm();

  const [showModal, setShowModal] = useState(false);
  const [showErrorLogModal, setShowErrorLogModal] = useState(false);
  const [errorData, setErrorData] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
    // Handle any additional actions after successful registration
    toast.success(t("User created successfully"));
  };

  useEffect(() => {
    if (showErrorLogModal) {
      (async function () {
        try {
          const query = `timeframe=Monthly&period=${new Date().getFullYear()}`;
          console.log(`${process.env.NEXT_PUBLIC_LOG}?${query}`);
          const res = await executeAjaxOperationStandard({
            method: "GET",
            url: `${process.env.NEXT_PUBLIC_API_LOG}?${query}`,
            locale: router.locale || "en",
            token,
          });
          console.log(res);
          if (
            res.status >=
              parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
            res.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
          ) {
            setErrorData(res.data);
          } else {
            setGlobalError(t(res.message));
          }
        } catch (error) {
          console.log(error);
          setGlobalError(t("An error occurred while fetching the data."));
        }
      })();
    }
  }, [showErrorLogModal]);

  const handleFormSubmit = async (message, status) => {
    if (status) {
      setSuccessMessage(message);
      toast.success(t("Institution Added Successfully"));
      setGlobalError("");
      router.push("/dashboard");
    } else {
      setSuccessMessage("");
      setGlobalError(message);
      toast.error(message);
    }
  };

  const renderErrorLogs = () => {
    return (
      <>
        {globalError && (
          <CustomAlert
            message={globalError}
            onClose={() => setGlobalError("")}
            dismissable
            timer={process.env.NEXT_PUBLIC_ALERT_TIME}
            type={"danger"}
          />
        )}
        {errorData ? (
          errorData.recent_errors.map((error, index) => (
            <div key={index} className="mb-3">
              <strong>{new Date(error.timestamp).toLocaleString()}</strong>
              <p>{error.message}</p>
            </div>
          ))
        ) : (
          <div className="d-flex justify-content-center">
            <CircularProgress />
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <Toaster />
      <button
        onClick={() => {
          setOpen(!open);
          setOpenseettings(false);
        }}
        className="btn btn-sm btn-primary position-fixed bottom-0 end-0 me-4 mb-3"
      >
        <i className="bx bx-dots-vertical-rounded"></i>
      </button>

      {open && (
        <div
          className="position-fixed bottom-0 end-0 me-4 mb-5 bg-white border py-2 rounded shadow"
          style={{ right: "84px" }}
        >
          <h6 className="py-2 m-0 text-center border-bottom">
            {t("Quick Actions")}
          </h6>
          <div className="d-flex flex-column align-items-start gap-1/2">
            <button style={{ display: "none" }}
              className="w-100 btn btn-link text-start text-dark quick-action-item"
              onClick={() => setShowSignupModal(true)}
            >
              <i className="bx bx-user-plus me-2"></i>
              {t("Add New User")}
            </button>
            <button style={{ display: "none" }}
              className="w-100 btn btn-link text-start text-dark quick-action-item"
              onClick={() => setShowModal(true)}
            >
              <i className="bx bx-buildings me-2"></i>
              {t("Add New Institution")}
            </button>
            <button
              className="w-100 btn btn-link text-start text-dark quick-action-item"
              onClick={() => setShowErrorLogModal(true)}
            >
              <i className="bx bx-error me-2"></i>
              {t("View Error Logs")}
            </button>
          </div>
        </div>
      )}

      <CommonModal
        title={t("Add New University")}
        formComponent={
          <UniversityForm
            ref={formRef}
            initialData={null}
            onSubmit={handleFormSubmit}
            formMode={"create"}
            onCancel={() => setShowModal(false)}
            addRow={undefined}
            deleteRow={undefined}
          />
        }
        showModal={showModal}
        closeModal={() => {
          setShowModal(false);
          if (formRef.current) {
            formRef.current.handleCancelClick();
          }
        }}
      />

      <CommonModal
        title={t("Recent Error Logs")}
        showModal={showErrorLogModal}
        closeModal={() => setShowErrorLogModal(false)}
        formComponent={<div className="h-90">{renderErrorLogs()}</div>}
      />

      <CommonModal
        title={t("Add New User")}
        showModal={showSignupModal}
        closeModal={() => setShowSignupModal(false)}
        formComponent={
          <RegisterUser
            onSuccess={handleSignupSuccess}
            onCancel={() => setShowSignupModal(false)}
          />
        }
      />
    </>
  );
}

export default QuickActions;
