import { Collapse, DropdownButton } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import MultiBarChart from "../../../components/MultiBarChart";
import { Dropdown } from "react-bootstrap";
import useCommonForm from "@/hooks/useCommonForm";
import { MONTH, monthValue } from "../utility";
import DateSelector from "../Component/DateSelector";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import CommonModal from "@/components/CommonModal";
import {
  useUserPermissions
} from "../../../utils/commonImports";

export default function InstituteOverview({ visible, setVisible, data }) {
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
  const [institutions, setInstitutions] = useState([]);
  const [open, setOpen] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showFacultyMemberModal, setShowFacultyMemberModal] = useState(false);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [activityType, setActivityType] = useState("Monthly");
  const [chartLabel, setChartLabel] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activity, setActivity] = useState({
    month: "",
    year: "",
    startYear: "",
    endYear: "",
  });
  const { permissions } = useUserPermissions();

  const canViewOrganizationDetailsWidget = permissions.some(
    (permission) => permission.codename === "view_organization_details_widget"
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
            category: "educational_organizations",
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
          setInstitutions(res.data);
          if (activityType === "Monthly") {
            const transformedData = MONTH.map((month, index) => ({
              month: month.substring(0, 3),
              School: res.data.schools[index],
              University: res.data.universities[index],
              Faculties: res.data.faculties[index],
            }));
            setChartData(transformedData);
          } else if (activityType === "Everyday") {
            const rawData = res.data;
            if (
              rawData &&
              Array.isArray(rawData.schools_daily) &&
              Array.isArray(rawData.universities_daily) &&
              Array.isArray(rawData.faculties_daily)
            ) {
              const length = rawData.schools_daily.length;

              const transformedData = Array.from({ length }, (_, index) => ({
                everyday: index + 1,
                School: rawData.schools_daily[index],
                University: rawData.universities_daily[index],
                Faculties: rawData.faculties_daily[index],
              }));
              setChartData(transformedData);
            }
          } else if (activityType === "Yearly") {
            const years = [];
            for (
              let year = activity.startYear;
              year <= activity.endYear;
              year++
            ) {
              years.push({
                year: year,
                School: res.data.schools_year_range[year - activity.startYear],
                University:
                  res.data.universities_year_range[year - activity.startYear],
                Faculties:
                  res.data.faculties_year_range[year - activity.startYear],
              });
            }
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

    if (open) fetchData();
  }, [activity, activityType, open]);

  return (
    <>
      <div className=" mt-3">
        <div className="card">
          <div
            className="card-header d-flex justify-content-between align-items-center cursor-pointer"
            aria-controls="collapsibleDiv"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <div
              onClick={() => setVisible(!visible)}
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
              {t("Institution Overview")}
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
              <div className="card-body pt-0">
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
                <div className="col-lg-12 mb-4 d-flex gap-2 order-0">
                  <div className="col-lg-9" style={{ placeContent: "center" }}>
                    <MultiBarChart
                      activityType={activityType}
                      data={chartData}
                    />
                  </div>

                  {canViewOrganizationDetailsWidget && (
                  <div className="col-sm-3">
                    <div className="row gap-5">
                      <div className="col-md-4 w-100">
                        <div className=" px-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <h5 className="card-title text-primary">
                              {t("Total School")}
                            </h5>
                            <div className="d-flex align-items-center">
                              <div className="d-flex align-items-center">
                                <p className="fw-bold">
                                  {institutions.schools &&
                                    (institutions.schools
                                      ? institutions.schools.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                  {institutions.schools_daily &&
                                    (institutions.schools_daily
                                      ? institutions.schools_daily.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                  {institutions.schools_year_range &&
                                    (institutions.schools_year_range
                                      ? institutions.schools_year_range.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowSchoolModal(true)}
                          >
                            {t("View Details")}
                          </button>
                        </div>
                      </div>
                      <div className="col-md-4 w-100">
                        <div className=" px-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <h5 className="card-title text-primary">
                              {t("Total University")}
                            </h5>
                            <div className="d-flex align-items-center">
                              <div className="d-flex align-items-center">
                                <p className="fw-bold">
                                  {institutions.universities &&
                                    (institutions.universities
                                      ? institutions.universities.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                  {institutions.universities_daily &&
                                    (institutions.universities_daily
                                      ? institutions.universities_daily.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                  {institutions.universities_year_range &&
                                    (institutions.universities_year_range
                                      ? institutions.universities_year_range.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowUniversityModal(true)}
                          >
                            {t("View Details")}
                          </button>
                        </div>
                      </div>
                      <div className="col-md-4 w-100">
                        <div className=" px-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <h5 className="card-title text-primary">
                              {t("Total Faculty")}
                            </h5>
                            <div className="d-flex align-items-center">
                              <div className="d-flex align-items-center">
                                <p className="fw-bold">
                                  {institutions.faculties &&
                                    (institutions.faculties
                                      ? institutions.faculties.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                  {institutions.faculties_daily &&
                                    (institutions.faculties_daily
                                      ? institutions.faculties_daily.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                  {institutions.faculties_year_range &&
                                    (institutions.faculties_year_range
                                      ? institutions.faculties_year_range.reduce(
                                          (acc, value) => acc + value,
                                          0
                                        )
                                      : 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowFacultyMemberModal(true)}
                          >
                            {t("View Details")}
                          </button>
                        </div>
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
      <CommonModal
        title={t("University list")}
        showModal={showUniversityModal}
        closeModal={() => setShowUniversityModal(false)}
        formComponent={
          <div className="w-100 overflow-auto" style={{ height: "80vh" }}>
            <table className="table table-bordered">
              <thead className="thead-dark">
                <tr>
                  <th>{t("Institution Name")}</th>
                  <th>{t("Institution Category")}</th>
                  <th>{t("Web Address")}</th>
                  <th>{t("Country")}</th>
                  <th>{t("City")}</th>
                </tr>
              </thead>
              <tbody>
                {institutions &&
                  institutions.university_data_list &&
                  institutions.university_data_list.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.under_category_name}</td>
                      <td>{item.web_address}</td>
                      <td>{item.country_name}</td>
                      <td>{item.city}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        }
      />
      <CommonModal
        title={t("School list")}
        showModal={showSchoolModal}
        closeModal={() => setShowSchoolModal(false)}
        formComponent={
          <div className="w-100 overflow-auto" style={{ height: "80vh" }}>
            <table className="table table-bordered">
              <thead className="thead-dark">
                <tr>
                  <th>{t("Institution Name")}</th>
                  <th>{t("Institution Category")}</th>
                  <th>{t("Web Address")}</th>
                  <th>{t("Country")}</th>
                  <th>{t("City")}</th>
                </tr>
              </thead>
              <tbody>
                {institutions &&
                  institutions.school_data_list &&
                  institutions.school_data_list.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.under_category_name}</td>
                      <td>{item.web_address}</td>
                      <td>{item.country_name}</td>
                      <td>{item.city}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        }
      />
      <CommonModal
        title={t("Faculty Member list")}
        showModal={showFacultyMemberModal}
        closeModal={() => setShowFacultyMemberModal(false)}
        formComponent={
          <div className="w-100 overflow-auto" style={{ height: "80vh" }}>
            <table className="table table-bordered">
              <thead className="thead-dark">
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Web Address")}</th>
                  <th>{t("Department Name")}</th>
                  <th>{t("College Name")}</th>
                  <th>{t("Campus Name")}</th>
                  <th>{t("Country")}</th>
                  <th>{t("City")}</th>
                  <th>{t("State")}</th>
                  <th>{t("Address")}</th>
                </tr>
              </thead>
              <tbody>
                {institutions &&
                  institutions.faculty_data_list &&
                  institutions.faculty_data_list.map((item, index) => (
                    <tr key={index}>
                      <td>{item.user_name}</td>
                      <td>{item.faculty_type}</td>
                      <td>{item.personal_web_address}</td>
                      <td>{item.department_name}</td>
                      <td>{item.college_name}</td>
                      <td>{item.campus_name}</td>
                      <td>
                        {item.country_name} ({item.country_code})
                      </td>
                      <td>{item.city}</td>
                      <td>{item.state_province_name}</td>
                      <td>{item.address_line1}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        }
      />
    </>
  );
}
