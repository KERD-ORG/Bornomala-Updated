import { Collapse } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import PieChartFunding from "@/components/PieChartFunding";
import BarChartFunding from "@/components/BarchartFunding";
import { Dropdown } from "react-bootstrap";

export default function FundingOverview({
  visibilityFunding,
  setVisibilityFunding,
}) {
  const [openFunding, setOpenFunding] = useState(false);
  const [pending, setPending] = useState(60);
  const [approved, setApproved] = useState(90);
  const [rejected, setRejected] = useState(100);
  const [months, setMonths] = useState([
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]);
  const [years, setYears] = useState([
    "2022",
    "2023",
    "2024",
    "2025",
    "2026",
    "2027",
    "2028",
    "2029",
    "2030",
    "2031",
    "2032",
    "2033",
    "2034",
    "2035",
    "2036",
    "2037",
    "2038",
    "2039",
    "2040",
  ]);
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // Get month index (0 for January, 1 for February, etc.)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = monthNames[monthIndex];
  const [FundingActivity, setFundingActivity] = useState("Monthly");
  const [activityMonth, setActivityMonth] = useState(monthName);
  const [activityYear, setActivityYear] = useState(year);
  const [activityStartYear, setActivityStartYear] = useState(year);
  const [activityEndYear, setActivityEndYear] = useState(year + 10);

  return (
    <div className=" mt-3">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div
            onClick={() => setVisibilityFunding(!visibilityFunding)}
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
          <h5 className="card-title text-primary mb-0">Funding Overview</h5>
          <button
            className="btn btn-link"
            onClick={() => setOpenFunding(!openFunding)}
            aria-controls="collapsibleDiv"
            aria-expanded={openFunding}
          >
            <i
              className={`bx ${openFunding ? "bx-minus" : "bx-plus"}`}
              id="toggleIcon"
            ></i>
          </button>
        </div>
        <Collapse in={openFunding}>
          <div id="collapsibleDiv">
            <div className="card-body pt-0">
              <div className="d-flex mb-2 gap-2">
                <Dropdown>
                  <Dropdown.Toggle id="dropdown-basic">
                    {FundingActivity ? FundingActivity : "Select Activity"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => setFundingActivity("Monthly")}
                    >
                      Monthly
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFundingActivity("Yearly")}>
                      Yearly
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                {FundingActivity === "Monthly" ? (
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic">
                      {activityMonth ? activityMonth : "Select Month"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      style={{ maxHeight: "150px", overflow: "auto" }}
                    >
                      {months.map((months) => (
                        <Dropdown.Item onClick={() => setActivityMonth(months)}>
                          {months}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : null}
                {FundingActivity === "Monthly" ? (
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic">
                      {activityYear ? activityYear : "Select Year"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      style={{ maxHeight: "150px", overflow: "auto" }}
                    >
                      {years.map((year) => (
                        <Dropdown.Item onClick={() => setActivityYear(year)}>
                          {year}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : null}
                {FundingActivity === "Yearly" ? (
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic">
                      {activityStartYear
                        ? activityStartYear
                        : "Select Start Year"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      style={{ maxHeight: "150px", overflow: "auto" }}
                    >
                      {years.map((year) => (
                        <Dropdown.Item
                          onClick={() => setActivityStartYear(year)}
                        >
                          {year}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : null}
                {FundingActivity === "Yearly" ? (
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic">
                      {activityEndYear ? activityEndYear : "Select End Year"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      style={{ maxHeight: "150px", overflow: "auto" }}
                    >
                      {years.map((year) => (
                        <Dropdown.Item onClick={() => setActivityEndYear(year)}>
                          {year}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : null}
              </div>
              <div className="col-lg-12 mb-4 d-flex gap-2 order-0">
                <div className="col-lg-5">
                  <PieChartFunding
                    pending={pending}
                    approved={approved}
                    rejected={rejected}
                  />
                </div>
                <div className="col-sm-7  border">
                  <BarChartFunding
                    FundingActivity={FundingActivity}
                    activityMonth={activityMonth}
                    activityYear={activityYear}
                    activityStartYear={activityStartYear}
                    activityEndYear={activityEndYear}
                  />
                </div>
              </div>
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
}
