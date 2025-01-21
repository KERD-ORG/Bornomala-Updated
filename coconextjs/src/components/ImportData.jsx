import React, { useEffect, useRef, useState } from "react";
import CustomAlert from "@/utils/CustomAlert";
import { CircularProgress } from "@mui/material";
import UniversityColumns from "@/pages/questions/grids/universityColumns";
import { useUserPermissions } from "@/contexts/UserPermissionsContext";
import useCommonForm from "@/hooks/useCommonForm";
import DataGrid from "react-data-grid";
import UniversityDetails from "@/pages/educational_organizations/UniversityDetails";
import CommonModal from "./CommonModal";
import QuestionEditForm from "@/pages/questions/forms/EditForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { Button, Modal } from "react-bootstrap";

const ImportData = ({ type, closeModal, show }) => {
  // State management
  const formRef = useRef();
  const { t, token } = useCommonForm();
  const { permissionsMap } = useUserPermissions();
  const [file, setFile] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [dropdownData, setDropdownData] = useState({
    subjects: [],
    questionTypes: [],
    topics: [],
    examReferences: [],
    difficultyLevels: [],
    subTopics: [],
    organizations: [],
    questionLevels: [],
    targetGroups: [],
    subSubTopics: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!token) return;
      const endpoints = {
        questionLevels: "api/question-levels",
        organizations: "api/organizations",
        targetGroups: "api/target-groups",
        subjects: "api/subjects",
        questionTypes: "api/question-types",
        topics: "api/topics",
        examReferences: "api/exam-references",
        questionStatuses: "api/question-statuses",
        difficultyLevels: "api/difficulty-levels",
        subTopics: "api/subtopics",
      };

      try {
        const promises = Object.entries(endpoints).map(([key, endpoint]) =>
          executeAjaxOperationStandard({
            url: `/${endpoint}/`,
            method: "get",
            token,
          })
        );

        const results = await Promise.all(promises);
        const newData = {};
        let index = 0;
        for (let key in endpoints) {
          const response = results[index];
          if (response && response.status >= 200 && response.status < 300) {
            const data = response.data;
            newData[key] = data.map((item) => ({
              ...item,
              value: item.id,
              label: item.name || item.reference_name || item.title || "",
            }));
          } else {
            newData[key] = [];
          }
          index++;
        }
        setDropdownData((prev) => ({ ...prev, ...newData }));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, [token]);

  const openEditForm = (university) => {
    console.log(university);
    setFormMode("edit");
    setSelectedUniversity(university);
    setShowModal(true);
  };

  const openShowView = (university) => {
    setFormMode("view");
    setSelectedUniversity(university);
    setShowModal(true);
  };

  const deleteUniversity = async (id, type) => {
    setInitialData(
      initialData.filter((val) => val.id != id && val.question_type != type)
    );
  };

  const universityColumns = UniversityColumns({
    permissionsMap,
    openEditForm,
    openShowView,
    deleteUniversity,
    type: "import",
    t,
  });

  // Reset component state when modal visibility changes
  useEffect(() => {
    resetComponent();
  }, [show]);

  const resetComponent = () => {
    setGlobalError("");
    setSuccessMessage("");
    setFile(null);
    setInitialData([]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // Parse the JSON file
  const parseFile = (file) => {
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = JSON.parse(event.target.result);
        const parsedData = rawData.map((item) => {
          const { id, question_type, ...details } = item;
          return {
            id,
            question_type,
            details,
          };
        });
        console.log("Parsed Data:", parsedData);
        setInitialData(parsedData);
        setSuccessMessage("File parsed successfully!");
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        setGlobalError(
          "Error parsing the file. Please ensure it is a valid JSON file."
        );
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      console.error("Error reading the file.");
      setGlobalError("Error reading the file. Please try again.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Alert Messages */}
      {globalError && (
        <CustomAlert
          message={globalError}
          dismissable={true}
          timer={5000}
          onClose={() => setGlobalError("")}
          type="danger"
        />
      )}
      {successMessage && (
        <CustomAlert
          message={successMessage}
          dismissable={true}
          timer={5000}
          onClose={() => setSuccessMessage("")}
          type="success"
        />
      )}

      {/* File Upload Form */}
      <form>
        <div className="row">
          <div className="col-md-12">
            <label htmlFor="file">JSON File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="form-control mt-1"
              id="file"
              name="file"
              onChange={(event) => {
                const file = event.target.files[0];
                setFile(file);
                parseFile(file);
              }}
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div
            style={{
              margin: "40px 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <div className="mt-4">
            {initialData.length > 0 && (
              <DataGrid
                style={{ height: 430, resize: "vertical" }}
                columns={universityColumns.map((column) => ({
                  ...column,
                  key: column.key,
                  headerRenderer: () => renderHeaderCell(column),
                }))}
                rows={initialData}
                rowKeyGetter={(row, index) => {
                  if (row.id === undefined || row.id === null) {
                    // Generate a unique key using index and other fallback methods
                    return `row-${index}-${Date.now()}`;
                  }
                  return `${row.id}${row.question_type}`;
                }}
                rowHeight={40}
                // onScroll={handleScroll}
                // onSortColumnsChange={handleSort}
                // sortColumns={sortColumns}
                className="fill-grid"
              />
            )}
          </div>
        )}
      </form>

      <Modal show={showModal} size="lg" onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {formMode === "edit" ? "Update Question" : "Question Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formMode === "edit" ? (
            <div>
              <QuestionEditForm
                ref={formRef}
                type={"import"}
                initialData={selectedUniversity}
                onSubmit={(data) => {
                  setInitialData(
                    initialData.map((val) => {
                      if (val.id == selectedUniversity.id) {
                        return { ...val, details: data };
                      }
                      return val;
                    })
                  );
                  setShowModal(false);
                  setSelectedUniversity(null);
                }}
                formMode={formMode}
                onCancel={() => {
                  setShowModal(false);
                  setSelectedUniversity(null);
                }}
              />
            </div>
          ) : (
            <UniversityDetails university={selectedUniversity} />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ImportData;
