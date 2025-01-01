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
  Tabs,
  Tab,
} from "react-bootstrap";
import { CircularProgress, Typography, Box } from "@mui/material";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import useCommonForm from "@/hooks/useCommonForm";
import MultiBarChart from "@/components/MultiBarChart"; // Import the MultiBarChart component
import DateSelector from "../Component/DateSelector";
import { MONTH } from "../utility";

const SystemHealth = ({ visible, setVisible }) => {
  const { t, router, token, setGlobalError } = useCommonForm();
  const [open, setOpen] = useState(false);
  const [systemHealthData, setSystemHealthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState({
    month: "",
    year: "",
    startYear: "",
    endYear: "",
  });
  const [activityType, setActivityType] = useState("Monthly");
  const [selectedTab, setSelectedTab] = useState("debug");

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
          url: `${process.env.NEXT_PUBLIC_API_SYSTEM_HEALTH}?${query}`,
          token,
          locale: router.locale || "en",
        });
        if (
          res.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          res.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          setSystemHealthData(res.data);
        } else {
          setGlobalError(res.message);
        }
      } catch (error) {
        console.error(error);
        setGlobalError(
          t("An error occurred while fetching the system health data.")
        );
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, activity, activityType]);

  const renderStatusIndicator = (status) => {
    if (!status) return;
    let statusText;
    switch (status) {
      case "Critical":
        statusText = t("Server Status: Critical");
        break;
      case "Warning":
        statusText = t("Server Status: Warning");
        break;
      case "Healthy":
        statusText = t("Server Status: Normal");
        break;
      default:
        statusText = t("Server Status: Unknown");
    }

    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        <CircularProgress
          variant="determinate"
          value={100}
          color={
            status === "Critical"
              ? "error"
              : status === "Warning"
              ? "warning"
              : "success"
          }
        />
        <Typography variant="h6" className="mt-2">
          {statusText}
        </Typography>
      </Box>
    );
  };

  const renderLogs = (logs, logType) => {
    if (!logs || !logType) return;

    const filteredLogs = logs.filter((log) => log.type === logType);
    const logList = filteredLogs.slice(0, 5);

    if (logList.length === 0) {
      return (
        <ListGroup.Item>
          <Typography variant="body2">
            {t(`You have no ${logType} logs.`)}
          </Typography>
        </ListGroup.Item>
      );
    }

    return logList.map((log, index) => (
      <ListGroup.Item key={index}>
        <Badge
          bg={
            logType === "critical"
              ? "danger"
              : logType === "warning"
              ? "warning"
              : "info"
          }
        >
          {t(logType).toUpperCase()}
        </Badge>{" "}
        {log.message}
        <div>
          <small>{new Date(log.timestamp).toLocaleString()}</small>
        </div>
      </ListGroup.Item>
    ));
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
          <h5 className="card-title text-primary mb-0">{t("Server Health")}</h5>
          <button className="btn btn-link">
            <i
              className={`bx ${open ? "bx-minus" : "bx-plus"}`}
              id="toggleIcon"
            ></i>
          </button>
        </div>
        <Collapse in={open}>
          <div id="collapsibleDiv">
            <Container>
              <Row className="mb-4">
                <Col xs={12} md={4}>
                  <Card>
                    <Card.Body>
                      {systemHealthData.status ? (
                        <>
                          {renderStatusIndicator(systemHealthData.status)}
                          <ListGroup variant="flush" className="mt-3">
                            {systemHealthData.details &&
                              Object.entries(systemHealthData.details).map(
                                ([key, value]) => (
                                  <ListGroup.Item key={key}>
                                    <Typography variant="body1">
                                      {key}
                                    </Typography>
                                    <Typography variant="body2">
                                      {value}%
                                    </Typography>
                                  </ListGroup.Item>
                                )
                              )}
                          </ListGroup>
                        </>
                      ) : (
                        <div className="d-flex justify-content-center">
                          <CircularProgress />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
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
                            onDateChange={(e) => setActivity(e)}
                          />
                        )}
                      </div>
                      {systemHealthData.chart_data ? (
                        <MultiBarChart
                          activityType={activityType}
                          data={systemHealthData.chart_data}
                        />
                      ) : (
                        <div className="d-flex justify-content-center">
                          <CircularProgress />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <Card>
                    <Card.Body>
                      <Card.Title>{t("Recent Server Alerts")}</Card.Title>
                      {systemHealthData.recent_logs && (
                        <Tabs
                          id="log-tabs"
                          activeKey={selectedTab}
                          onSelect={(k) => setSelectedTab(k)}
                          className="mb-3"
                          fill
                          variant="pills"
                          style={{ borderBottom: "1px solid #dee2e6" }}
                        >
                          <Tab
                            eventKey="critical"
                            title="Critical"
                            tabClassName={
                              selectedTab === "critical" ? "active-tab" : ""
                            }
                          >
                            <ListGroup variant="flush">
                              {renderLogs(
                                systemHealthData.recent_logs,
                                "critical"
                              )}
                            </ListGroup>
                          </Tab>
                          <Tab
                            eventKey="debug"
                            title="Debug"
                            tabClassName={
                              selectedTab === "debug" ? "active-tab" : ""
                            }
                          >
                            <ListGroup variant="flush">
                              {renderLogs(
                                systemHealthData.recent_logs,
                                "debug"
                              )}
                            </ListGroup>
                          </Tab>
                          <Tab
                            eventKey="info"
                            title="Info"
                            tabClassName={
                              selectedTab === "info" ? "active-tab" : ""
                            }
                          >
                            <ListGroup variant="flush">
                              {renderLogs(systemHealthData.recent_logs, "info")}
                            </ListGroup>
                          </Tab>
                          <Tab
                            eventKey="warning"
                            title="Warning"
                            tabClassName={
                              selectedTab === "warning" ? "active-tab" : ""
                            }
                          >
                            <ListGroup variant="flush">
                              {renderLogs(
                                systemHealthData.recent_logs,
                                "warning"
                              )}
                            </ListGroup>
                          </Tab>
                        </Tabs>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export default SystemHealth;
