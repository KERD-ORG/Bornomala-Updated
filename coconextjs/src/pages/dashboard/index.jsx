import React, { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../../components/layout";
import { isLoggedIn } from "../../utils/auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import InstituteOverview from "@/pages/dashboard/Overview/InstituteOverview";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import SystemHealth from "./Overview/SystemHealth";
import RecentErrorLogs from "./Overview/RecentErrorLogs";
import { createLineChartDataset } from "./utility";
import QuickActions from "./Component/QuickActions";
import { useUserPermissions } from "../../utils/commonImports";

const Dashboard = () => {
  const { permissions } = useUserPermissions();

  const canViewCampusOverviewWidget = permissions.some(
    (permission) => permission.codename === "view_campus_overview_widget"
  );
  const canViewDepartmentOverviewWidget = permissions.some(
    (permission) => permission.codename === "view_department_overview_widget"
  );
  const canViewOrganizationOverviewWidget = permissions.some(
    (permission) => permission.codename === "view_organization_overview_widget"
  );
  const canViewUserRegistrationOverviewWidget = permissions.some(
    (permission) =>
      permission.codename === "view_user_registration_overview_widget"
  );
  const canViewMailingOverviewWidget = permissions.some(
    (permission) => permission.codename === "view_mailing_overview_widget"
  );
  const canViewServerHealthWidget = permissions.some(
    (permission) => permission.codename === "view_server_health_widget"
  );
  const canViewLogsOverviewWidget = permissions.some(
    (permission) => permission.codename === "view_logs_overview_widget"
  );

  const canViewQuickActionWidget = permissions.some(
    (permission) => permission.codename === "view_quick_actions_widget"
  );

  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState(false); // Track if permissions are loaded
  const { t, router, setGlobalError, token } = useCommonForm();

  const isAuthenticated = isLoggedIn();
  const [opensettings, setOpenseettings] = useState(false);
  const [openQuickActions, setOpenQuickActions] = useState(false);
  const [lineChartData, setLineChartData] = useState({});
  const [data, setData] = useState({});
  const [sections, setSections] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    localStorage.clear();
    if (permissions.length > 0) {
      const componentConfig = [
        ...(canViewOrganizationOverviewWidget
          ? [
              {
                id: "institute",
                label: t("Institution"),
                component: InstituteOverview,
              },
            ]
          : []),

        ...(canViewServerHealthWidget
          ? [
              {
                id: "health",
                label: t("Server Health"),
                component: SystemHealth,
              },
            ]
          : []),

        ...(canViewLogsOverviewWidget
          ? [
              {
                id: "logs",
                label: t("Logs Overview"),
                component: RecentErrorLogs,
              },
            ]
          : []),
      ];

      const savedOrder = JSON.parse(
        localStorage.getItem("dashboard_section_order")
      );
      const initialSections = componentConfig.map(
        ({ id, component, label }) => ({
          id,
          component,
          label,
          visible:
            JSON.parse(localStorage.getItem(`visibility_${id}`)) !== false,
        })
      );

      if (savedOrder) {
        const orderedSections = savedOrder
          .map((id) => initialSections.find((section) => section.id === id))
          .filter(Boolean);
        setSections(orderedSections);
      } else {
        setSections(initialSections);
      }

      setIsPermissionsLoaded(true); // Mark permissions as loaded
    }
  }, [permissions, t]);

  useEffect(() => {
    // Save visibility state in localStorage whenever sections change
    sections.forEach(({ id, visible }) => {
      localStorage.setItem(`visibility_${id}`, JSON.stringify(visible));
    });

    // Save the order of sections in localStorage
    const sectionOrder = sections.map((section) => section.id);
    localStorage.setItem(
      "dashboard_section_order",
      JSON.stringify(sectionOrder)
    );
  }, [sections]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await executeAjaxOperationStandard({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_DASHBOARD_STATIC_DATA,
          token,
          locale: router.locale || "en",
        });

        if (
          res.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          res.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          setData(res.data);
          setLineChartData(updateLineChartState(res.data));
        } else {
          setGlobalError(t(res.message));
        }
      } catch (error) {
        console.error(error);
        setGlobalError(t("An error occurred while fetching the data."));
      }
    };

    fetchUserData();
  }, [isAuthenticated, router]);

  const updateLineChartState = (resData) => ({
    campus: createLineChartDataset(t("Campus"), resData.active_campus_data),
    college: createLineChartDataset(t("College"), resData.active_college_data),
    department: createLineChartDataset(
      t("Department"),
      resData.active_department_data
    ),
    institution: createLineChartDataset(
      t("Institution"),
      resData.active_institution_data
    ),
    member: createLineChartDataset(t("Member"), resData.active_member_data),
    user: createLineChartDataset(t("User"), resData.active_user_data),
    recent_reg: createLineChartDataset(
      t("Recent Reg"),
      resData.recent_reg_data
    ),
  });

  const toggleVisibility = (id, visible) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, visible } : section
      )
    );
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedSections = Array.from(sections);
    const [movedSection] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, movedSection);

    setSections(reorderedSections);
  };

  const VisibilitySwitch = ({ id, label, visible }) => {
    return (
      <div className="d-flex gap-2 py-2 justify-content-between">
        <span style={{ fontWeight: 600 }}>{t(label)}</span>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={visible}
            onChange={(e) => toggleVisibility(id, e.target.checked)}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Head>
        <title>Dashboard</title>
        <meta name="description" content="Learn more about us." />
      </Head>
      {isMounted && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {sections.map(
                  ({ id, component: Component, visible }, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            marginBottom: "16px",
                            ...provided.draggableProps.style,
                          }}
                        >
                          {visible && (
                            <Component
                              visible={visible}
                              setVisible={(e) => toggleVisibility(id, e)}
                              data={data}
                            />
                          )}
                        </div>
                      )}
                    </Draggable>
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {/* Setting Button */}
      <button
        onClick={() => {
          setOpenseettings(!opensettings);
          setOpenQuickActions(false);
        }}
        className="btn btn-sm btn-primary position-fixed bottom-0 me-2 mb-3"
        style={{ right: "65px" }}
      >
        <i className="bx bx-cog"></i>
      </button>
      {opensettings && (
        <div
          className="position-fixed bottom-0 me-3 end-0 mb-5 bg-white border py-2 px-3 rounded shadow"
          // style={{ right: "45px" }}
        >
          {sections.map(({ id, label, visible }) => (
            <VisibilitySwitch
              key={id}
              id={id}
              label={label}
              visible={visible}
            />
          ))}
        </div>
      )}
      {/* Quick Actions Button */}
      {canViewQuickActionWidget && (
        <QuickActions
          open={openQuickActions}
          setOpen={setOpenQuickActions}
          setOpenseettings={setOpenseettings}
        />
      )}
      <div id="recaptcha-container" style={{ display: "none" }} />{" "}
      {/* Placeholder element */}
    </Layout>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

Dashboard.layout = "default";
Dashboard.requiresReCaptcha = true;
export default Dashboard;
