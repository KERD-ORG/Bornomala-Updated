import React, { useEffect, useState } from "react";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { MONTH, YEAR } from "../utility";


const DateSelector = ({ activityType, onDateChange }) => {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // Get month index (0 for January, 1 for February, etc.)

  const monthName = MONTH[monthIndex];

  const [activityMonth, setActivityMonth] = useState(monthName);
  const [activityYear, setActivityYear] = useState(year);
  const [activeityStartYear, setActiveityStartYear] = useState(year);
  const [activeityEndYear, setActiveityEndYear] = useState(year + 10);

  const handleDateChange = () => {
    const dates = {
      month: activityMonth,
      year: activityYear,
      startYear: activeityStartYear,
      endYear: activeityEndYear,
    };
    onDateChange(dates);
  };

  useEffect(() => {
    handleDateChange();
  }, [activityMonth, activityYear, activeityStartYear, activeityEndYear]);

  const renderDropdown = (title, items, onSelect) => (
    <DropdownButton id="dropdown-basic" title={title} size="sm">
      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
        {items.map((item) => (
          <Dropdown.Item key={item} onClick={() => onSelect(item)}>
            {item}
          </Dropdown.Item>
        ))}
      </div>
    </DropdownButton>
  );

  return (
    <div className="d-flex gap-2">
      {activityType === "Everyday" && (
        <>
          {renderDropdown(
            activityMonth ? activityMonth : "Select Month",
            MONTH,
            setActivityMonth
          )}
          {renderDropdown(
            activityYear ? activityYear : "Select a Year",
            YEAR,
            setActivityYear
          )}
        </>
      )}
      {activityType === "Monthly" &&
        renderDropdown(
          activityYear ? activityYear : "Select a Year",
          YEAR,
          setActivityYear
        )}
      {activityType === "Yearly" && (
        <>
          {renderDropdown(
            activeityStartYear ? activeityStartYear : "Start From",
            YEAR,
            setActiveityStartYear
          )}
          {renderDropdown(
            activeityEndYear ? activeityEndYear : "End To",
            YEAR,
            setActiveityEndYear
          )}
        </>
      )}
    </div>
  );
};

export default DateSelector;
