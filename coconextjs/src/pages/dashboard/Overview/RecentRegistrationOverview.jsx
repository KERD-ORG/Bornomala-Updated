import { Collapse, DropdownButton } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { MONTH, YEAR, formatDate, monthValue } from "../utility";
import { t } from "i18next";
import useCommonForm from "@/hooks/useCommonForm";
import BarChart from "@/components/BarChart";
import DateSelector from "../Component/DateSelector";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import {
  useUserPermissions
} from "../../../utils/commonImports"

function RecentRegistrationOverview({ visible, setVisible, data }) {
  const { t, router, loading, setLoading, globalError, setGlobalError, token } =
    useCommonForm();
  const [open, setOpen] = useState(false);
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

  const canViewRecentlyRegistrationJoinedWidget = permissions.some(
    (permission) => permission.codename === "view_user_registration_recently_joined_widget"
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
            setChartLabel(MONTH);
            setChartData(
              res.data.user_month_range.map((val) => val[0] + val[1])
            );
          } else if (activityType === "Everyday") {
            const rawData = res.data;
            if (Array.isArray(rawData.user_daily)) {
              const labels = Array.from(
                { length: rawData.user_daily.length },
                (_, index) => index + 1
              );
              setChartLabel(labels);
              setChartData(rawData.user_daily.map((val) => val[0] + val[1]));
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
            setChartData(
              res.data.user_year_range.map((val) => val[0] + val[1])
            );
          }
        } else {
          setGlobalError(t(res.message));
        }
      } catch (error) {
        console.log(error);
        setGlobalError(t("An error occurred while fetching the data."));
      }
    };

    if (open) fetchData();
  }, [activity, activityType, open]);

  return (
    <div className="mt-3">
      <div className="card">
        <div
          className="card-header d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-controls="collapsibleDiv"
          aria-expanded={open}
        >
          <div
            onClick={() => setVisible(!visible)}
            className="p-1 position-absolute"
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
            {t("Recent Registrations Overview")}
          </h5>
          <button className="btn btn-link">
            <i
              className={`bx ${open ? "bx-minus" : "bx-plus"}`}
              id="toggleIcon"
            ></i>
          </button>
        </div>
        <Collapse in={open}>
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
                    type={t("Registered")}
                    title={t("Recent Registration")}
                  />
                </div>
                {canViewRecentlyRegistrationJoinedWidget && (
                <div className="col-lg-5">
                  <h5 className="text-primary ms-4">
                    {t("Recently joined :")}
                  </h5>
                  <div className="d-flex flex-column gap-3 mx-4">
                    <div className="row">
                      {data.recent_reg_list &&
                        data.recent_reg_list.map((item, index) => (
                          <div key={index} className="col-12 col-md-12 mb-3">
                            <div className="card border h-100">
                              <div className="card-body py-3">
                                <h5
                                  className="text-secondary mb-1"
                                  style={{ fontSize: "16px" }}
                                >
                                  {item.first_name} {item.last_name} (
                                  {item.username})
                                </h5>
                                <p
                                  className="mb-0"
                                  style={{ fontSize: "12px" }}
                                >
                                  {t("Email")}: {item.email}
                                </p>
                                <p
                                  className="mb-0"
                                  style={{ fontSize: "12px" }}
                                >
                                  {t("Joined At")}:{" "}
                                  {formatDate(item.date_joined)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
}

export default RecentRegistrationOverview;
