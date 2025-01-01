import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Badge,
  DropdownButton,
  Collapse,
  Dropdown,
  Spinner,
} from "react-bootstrap";
import { Typography } from "@mui/material";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import useCommonForm from "@/hooks/useCommonForm";
import DateSelector from "../Component/DateSelector";
import { MONTH } from "../utility";
import BarChart from "@/components/BarChart"; // Import the BarChart component
import { format } from "date-fns";

const RecentErrorLogs = ({ visible, setVisible }) => {
  const { t, setGlobalError, token } = useCommonForm();
  const [open, setOpen] = useState(false);
  const [errorLogs, setErrorLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activity, setActivity] = useState({
    month: "",
    year: "",
    startYear: "",
    endYear: "",
  });
  const [activityType, setActivityType] = useState("Monthly");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = "";

        if (activityType === "Monthly") {
          query = `timeframe=Monthly&period=${activity.year}`;
        } else if (activityType === "Everyday") {
          query = `timeframe=Daily&period=${activity.year}-${
            MONTH.findIndex((mn) => mn === activity.month) + 1
          }`;
        } else if (activityType === "Yearly") {
          query = `timeframe=Yearly&period=${activity.startYear}-${activity.endYear}`;
        }

        const res = await executeAjaxOperationStandard({
          method: "GET",
          url: `${process.env.NEXT_PUBLIC_API_LOG}?${query}`,
          token,
          locale: "en",
        });

        if (
          res.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          res.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          // Update the chart data and recent error logs
          setChartData(res.data.error_counts);
          setErrorLogs(res.data.recent_errors);
        } else {
          setGlobalError(res.message);
        }
      } catch (error) {
        console.error(error);
        setGlobalError(t("An error occurred while fetching the log data."));
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchData();
  }, [activity, activityType, open]);

  const renderLogList = (logs) => {
    if (logs.length === 0) {
      return (
        <ListGroup.Item>
          <Typography variant="body2" style={{ fontSize: "12px" }}>
            {t("No logs found")}
          </Typography>
        </ListGroup.Item>
      );
    }

    return logs.slice(0, 5).map((log, index) => (
      <ListGroup.Item key={index}>
        <Typography variant="body2" style={{ fontSize: "12px" }}>
          {format(new Date(log.timestamp), "PPpp")} - {log.message}
        </Typography>
      </ListGroup.Item>
    ));
  };

  const getBarChartLabels = () => {
    if (activityType === "Monthly") {
      return MONTH.map((month) => month.substring(0, 3));
    } else if (activityType === "Everyday") {
      const daysInMonth = new Date(
        activity.year,
        MONTH.findIndex((mn) => mn === activity.month) + 1,
        0
      ).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    } else if (activityType === "Yearly") {
      const startYear = parseInt(activity.startYear);
      const endYear = parseInt(activity.endYear);
      return Array.from({ length: endYear - startYear + 1 }, (_, i) =>
        (startYear + i).toString()
      );
    }
    return [];
  };

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
          <h5 className="card-title text-primary mb-0">{t("Logs Overview")}</h5>
          <button className="btn btn-link">
            <i
              className={`bx ${open ? "bx-minus" : "bx-plus"}`}
              id="toggleIcon"
            ></i>
          </button>
        </div>
        <Collapse in={open}>
          <div id="collapsibleDiv">
            {isClient && (
              <Container>
                <Row className="mb-4">
                  <Col xs={12} md={8}>
                    <Card>
                      <Card.Body>
                        <div className="d-flex gap-2 mb-4">
                          <DropdownButton
                            id="dropdown-basic"
                            title={
                              activityType ? activityType : t("Select Activity")
                            }
                            size="sm"
                          >
                            <Dropdown.Item
                              onClick={() => setActivityType("Everyday")}
                            >
                              {t("Everyday")}
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => setActivityType("Monthly")}
                            >
                              {t("Monthly")}
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => setActivityType("Yearly")}
                            >
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
                        {loading ? (
                          <div className="d-flex justify-content-center">
                            <Spinner animation="border" variant="primary" />
                          </div>
                        ) : (
                          <BarChart
                            label={getBarChartLabels()}
                            data={chartData}
                            title={t("Error Logs Over Time")}
                            type="Errors"
                          />
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={4}>
                    <Card>
                      <Card.Body>
                        <Card.Title>
                          <Badge bg="danger">{t("Recent Error Logs")}</Badge>
                        </Card.Title>
                        <ListGroup variant="flush">
                          {renderLogList(errorLogs)}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Container>
            )}
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export default RecentErrorLogs;
