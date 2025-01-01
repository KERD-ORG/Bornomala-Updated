import React, { useEffect, useState } from "react";
import {
  MONTH,
  YEAR,
  createLineChartDataset,
  formatDate,
  monthValue,
} from "../utility";
import LineChart from "@/components/LineChart";
import { Dropdown, DropdownButton } from "react-bootstrap";
import BarChart from "@/components/BarChart";
import PieChart from "@/components/PieChart";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import DateSelector from "../Component/DateSelector";
import MultiBarChart from "@/components/MultiBarChart";
import { useUserPermissions } from "../../../utils/commonImports";

function UserStatOverview({ lineChartData, data }) {
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

  const [uservisibility, setUservisibility] = useState("PieChart");

  const { permissions } = useUserPermissions();
  const canViewActiveUserWidget = permissions.some(
    (permission) => permission.codename === "view_active_user_widget"
  );
  const canViewInstitutionWidget = permissions.some(
    (permission) => permission.codename === "view_institution_widget"
  );
  const canViewFundingWidget = permissions.some(
    (permission) => permission.codename === "view_funding_widget"
  );
  const canViewCampusWidget = permissions.some(
    (permission) => permission.codename === "view_campus_widget"
  );
  const canViewDepartmentWidget = permissions.some(
    (permission) => permission.codename === "view_department_widget"
  );
  const canViewUserChartWidget = permissions.some(
    (permission) => permission.codename === "view_user_chart_widget"
  );

  const [activityType, setActivityType] = useState("Monthly");
  const [activity, setActivity] = useState({
    month: "",
    year: new Date().getFullYear(),
    startYear: "",
    endYear: "",
  });

  const [chartLabel, setChartLabel] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([0, 0]);

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
            category: "user",
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
            let active = 0,
              inactive = 0;
            const transformedData = MONTH.map((month, index) => {
              active += res.data.user_month_range[index][0];
              inactive += res.data.user_month_range[index][1];
              return {
                month: month.substring(0, 3),
                "No of Active User": res.data.user_month_range[index][0],
                "No of Inactive User": res.data.user_month_range[index][1],
              };
            });
            setPieChartData([active, inactive]);
            setChartData(transformedData);
          } else if (activityType === "Everyday") {
            const rawData = res.data.user_daily;
            if (rawData) {
              const length = rawData.length;
              let active = 0,
                inactive = 0;
              const transformedData = Array.from({ length }, (_, index) => {
                active += rawData[index][0];
                inactive += rawData[index][1];
                return {
                  everyday: index + 1,
                  "No of Active Users": rawData[index][0],
                  "No of Inactive Users": rawData[index][1],
                };
              });
              setPieChartData([active, inactive]);
              setChartData(transformedData);
            }
          } else if (activityType === "Yearly") {
            const years = [];
            let active = 0,
              inactive = 0;
            for (
              let year = activity.startYear;
              year <= activity.endYear;
              year++
            ) {
              active += res.data.user_year_range[year - activity.startYear][0];
              inactive +=
                res.data.user_year_range[year - activity.startYear][1];
              years.push({
                year: year,
                "No of Active User":
                  res.data.user_year_range[year - activity.startYear][0],
                "No of Inactive User":
                  res.data.user_year_range[year - activity.startYear][1],
              });
            }
            setPieChartData([active, inactive]);
            setChartData(years);
          }
        } else {
          setGlobalError(t(res.message));
        }
      } catch (error) {
        console.log(error);
        setGlobalError(t("An error occurred while fetching the data."));
      }
    };

    fetchData();
  }, [activity, activityType]);

  return (
    <div className="row">
      <div className="col-lg-12 d-flex">
        <div className="col-lg-6">
          <div className="row ">
            {canViewActiveUserWidget && (
              <div className="col-lg-4 mt-2 ">
                <div className="card">
                  <div className="card-body rounded-4 p-3">
                    <p className="fw-medium" style={{ color: "#000000" }}>
                      {t("Active User")}
                    </p>
                    <div className="d-flex dark">
                      <p
                        className="fw-bold "
                        style={{ fontSize: "26px", color: "#000000" }}
                      >
                        {data.total_active_users || "-"}
                      </p>
                      <p
                        className="fw-medium d-flex align-items-end"
                        style={{ fontSize: "16px" }}
                      >
                        /{data.total_users || "-"}
                      </p>
                    </div>
                    {lineChartData && lineChartData.user && (
                      <LineChart data={lineChartData.user} />
                    )}
                  </div>
                  {lineChartData.user && (
                    <LineChart data={lineChartData.user} />
                  )}
                </div>
              </div>
            )}

            {canViewInstitutionWidget && (
              <div className="col-lg-4 mt-2">
                <div className="card">
                  <div className="card-body rounded-4 p-3">
                    <p className="fw-medium" style={{ color: "#000000" }}>
                      {t("Institution")}{" "}
                    </p>
                    <div className="d-flex dark">
                      <p
                        className="fw-bold "
                        style={{ fontSize: "26px", color: "#000000" }}
                      >
                        {data.current_institution_count || "-"}
                      </p>
                    </div>
                    {lineChartData.institution && (
                      <LineChart data={lineChartData?.institution} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {canViewFundingWidget && (
              <div className="col-lg-4 mt-2">
                <div className="card">
                  <div className="card-body rounded-4 p-3">
                    <p className="fw-medium" style={{ color: "#000000" }}>
                      {t("Funding")}{" "}
                    </p>
                    <div className="d-flex dark">
                      <p
                        className="fw-bold "
                        style={{ fontSize: "26px", color: "#000000" }}
                      >
                        {data.current_funding_count || "-"}
                      </p>
                    </div>
                    {/* TODO: Change it to funding when funding app is merged */}
                    {lineChartData.campus && (
                      <LineChart data={lineChartData?.campus} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {canViewCampusWidget && (
              <div className="col-lg-4 mt-2">
                <div className="card">
                  <div className="card-body rounded-4 p-3">
                    <p className="fw-medium" style={{ color: "#000000" }}>
                      {t("Campus")}{" "}
                    </p>
                    <div className="d-flex dark">
                      <p
                        className="fw-bold "
                        style={{ fontSize: "26px", color: "#000000" }}
                      >
                        {data.current_campus_count || "-"}
                      </p>
                    </div>
                    {lineChartData.campus && (
                      <LineChart data={lineChartData?.campus} />
                    )}
                  </div>
                </div>
              </div>
            )}
            {canViewDepartmentWidget && (
              <div className="col-lg-4 mt-2">
                <div className="card">
                  <div className="card-body rounded-4 p-3">
                    <p className="fw-medium" style={{ color: "#000000" }}>
                      {t("Department")}{" "}
                    </p>
                    <div className="d-flex dark">
                      <p
                        className="fw-bold "
                        style={{ fontSize: "26px", color: "#000000" }}
                      >
                        {data.current_department_count || "-"}
                      </p>
                    </div>
                    {lineChartData.department && (
                      <LineChart data={lineChartData?.department} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {canViewUserChartWidget && (
          <div className="col-lg-6 container">
            <div className="ps-0 d-flex flex-column">
              <div className="d-flex justify-content-between mb-2">
                <div className="d-flex gap-2">
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
                      onDateChange={(e) => setActivity(e)}
                    />
                  )}
                </div>
                <div className="d-flex gap-2 justify-content-end align-items-end">
                  <img
                    style={{
                      borderBottom:
                        uservisibility === "PieChart"
                          ? "3px solid #36a2eb"
                          : "none",
                    }}
                    onClick={() => setUservisibility("PieChart")}
                    src="../assets/img/deshboard/piechart.png"
                    height={24}
                    alt="View Badge User"
                  />
                  <img
                    style={{
                      borderBottom:
                        uservisibility === "BarChart"
                          ? "3px solid #36a2eb"
                          : "none",
                    }}
                    onClick={() => setUservisibility("BarChart")}
                    src="../assets/img/deshboard/barchart.png"
                    height={24}
                    alt="View Badge User"
                  />
                </div>
              </div>
              <div className="card">
                {uservisibility === "BarChart" ? (
                  <div className="card py-3">
                    <MultiBarChart
                      data={chartData}
                      activityType={activityType}
                    />
                  </div>
                ) : (
                  <div className="card">
                    {" "}
                    <PieChart
                      labels={["Active Users", "Inactive Users"]}
                      data={pieChartData}
                      color={["#008080", "#FF7F50"]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserStatOverview;
