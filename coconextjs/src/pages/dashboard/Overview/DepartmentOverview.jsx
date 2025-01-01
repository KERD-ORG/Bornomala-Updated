import { Collapse, DropdownButton } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { MONTH, YEAR, formatDate, monthValue } from "../utility";
import { t } from "i18next";
import useCommonForm from "@/hooks/useCommonForm";
import CommonModal from "@/components/CommonModal";
import DepartmentDetails from "@/pages/department/DepartmentDetails";
import DateSelector from "../Component/DateSelector";
import BarChart from "@/components/BarChart";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import {
  useUserPermissions
} from "../../../utils/commonImports";

export default function DepartmentOverview({ visible, setVisible, data }) {
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
  } = useCommonForm();
  const [openDepartment, setOpenDepartment] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [chartLabel, setChartLabel] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [activityType, setActivityType] = useState("Monthly");
  const [activity, setActivity] = useState({
    month: "",
    year: "",
    startYear: "",
    endYear: "",
  });

  const { permissions } = useUserPermissions();

  const canViewDepartmentDetailsWidget = permissions.some(
    (permission) => permission.codename === "view_department_details_widget"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await executeAjaxOperationStandard({
          method: "POST",
          url: process.env.NEXT_PUBLIC_API_CHART_DATA_ENDPOINT,
          token,
          locale: router.locale || "en",
          data: JSON.stringify({
            type: activityType,
            category: "department",
            month: monthValue(activity.month),
            year: activity.year,
            start_year: activity.startYear,
            end_year: activity.endYear,
          }),
        });
        if (
          res.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          res.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          if (activityType === "Monthly") {
            setChartLabel(MONTH);
            setChartData(res.data.department_month_range);
          } else if (activityType === "Everyday") {
            const rawData = res.data;
            if (Array.isArray(rawData.department_daily)) {
              const labels = Array.from(
                { length: rawData.department_daily.length },
                (_, index) => index + 1
              );
              setChartLabel(labels);
              setChartData(rawData.department_daily);
            }
          } else if (activityType === "Yearly") {
            const years = [];
            for (
              let year = activity.startYear;
              year <= activity.endYear;
              year++
            ) {
              years.push(year);
            }
            setChartLabel(years);
            setChartData(res.data.department_year_range);
          }
        } else {
          setGlobalError(t(res.message));
        }
      } catch (error) {
        console.log(error);
        setGlobalError(t("An error occurred while fetching the data."));
      }
    };

    if (openDepartment) fetchData();
  }, [activity, activityType, openDepartment]);

  return (
    <div className=" mt-3">
      <div className="card">
        <div
          className="card-header d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => setOpenDepartment(!openDepartment)}
          aria-controls="collapsibleDiv"
          aria-expanded={openDepartment}
        >
          <div
            onClick={() => setOpenDepartment(!openDepartment)}
            className="p-1 position-absolute "
            style={{
              border: "1px solid #dee2e6",
              backgroundColor: "#f8f9fa",
              top: -10,
              right: -10,
              borderRadius: "50%",
            }}
          >
            <i className="bx bx-x"></i>
          </div>
          <h5 className="card-title text-primary mb-0">
            {t("Department Overview")}
          </h5>
          <button className="btn btn-link">
            <i
              className={`bx ${openDepartment ? "bx-minus" : "bx-plus"}`}
              id="toggleIcon"
            ></i>
          </button>
        </div>
        <Collapse in={openDepartment}>
          <div id="collapsibleDiv">
            <div className="card-body">
              <div className="d-flex mb-2 gap-2">
                <DropdownButton
                  id="dropdown-basic"
                  title={activityType ? activityType : t("Select Activity")}
                  size="sm"
                >
                  <Dropdown.Item onClick={() => setActivityType("Everyday")}>
                    {t("Everyday")}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setActivityType("Monthly")}>
                    {t("Monthly")}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setActivityType("Yearly")}>
                    {t("Yearly")}
                  </Dropdown.Item>
                </DropdownButton>

                {activityType && (
                  <DateSelector
                    activityType={activityType}
                    onDateChange={(e) => {
                      setActivity(e);
                    }}
                  />
                )}
              </div>
              <div className="col-lg-12 mb-4 d-flex gap-2">
                <div
                  className="col-lg-7 pt-3 border"
                  style={{ placeContent: "center" }}
                >
                  <BarChart
                    label={chartLabel}
                    data={chartData}
                    type={t("Department")}
                    title={t("Department")}
                  />
                </div>

                {canViewDepartmentDetailsWidget && (
                <div className="col-lg-5">
                  <h5 className="text-primary ms-4">
                    {" "}
                    {t("Recently Created :")}{" "}
                  </h5>
                  <div className=" d-flex flex-column gap-3 mx-4">
                    {data.recent_departments &&
                      data.recent_departments.map((item, index) => (
                        <div className="card border" key={index}>
                          <div className="card-body py-3">
                            <div className=" d-flex justify-content-between align-items-center">
                              <div className="d-flex flex-column gap-2">
                                <h5
                                  className="text-secondary mb-0"
                                  style={{ fontSize: "16px" }}
                                >
                                  {item.name}
                                </h5>
                                <div
                                  className="d-flex gap-3"
                                  style={{ fontSize: "12px" }}
                                >
                                  <p className="mb-0">{t("Updated At")} : </p>
                                  <p className="mb-0">
                                    {formatDate(item.updated_at)}
                                  </p>
                                </div>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setShowModal(true);
                                  setSelectedRecord(item);
                                }}
                              >
                                {t("View Details")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </Collapse>
        <CommonModal
          title={selectedRecord ? selectedRecord.name : ""}
          formComponent={<DepartmentDetails department={selectedRecord} />}
          showModal={showModal}
          closeModal={() => {
            setShowModal(false);
            setSelectedRecord(null);
          }}
        />
      </div>
    </div>
  );
}
