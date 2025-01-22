import React, { useEffect, useRef, useState } from "react";
import CustomAlert from "@/utils/CustomAlert";
import { CircularProgress } from "@mui/material";
import UniversityColumns from "@/pages/questions/grids/universityColumns";
import { useUserPermissions } from "@/contexts/UserPermissionsContext";
import useCommonForm from "@/hooks/useCommonForm";
import DataGrid from "react-data-grid";
import QuestionEditForm from "@/pages/questions/forms/EditForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { Button, Modal } from "react-bootstrap";
import QuestionDetails from "@/pages/questions/UniversityDetails";

const explanationLevels = ["Preliminary", "Intermediate", "Advanced"];

const pkToDropdownMap = {
  target_organization: "organizations",
  question_level: "questionLevels",
  target_subject: "subjects",
  exam_references: "examReferences", // note: exam_references can be an array
  topic: "topics",
  sub_topic: "subTopics",
  difficulty_level: "difficultyLevels",
  target_group: "targetGroups",
};

/**
 * Adds "<field>_name" or "<field>_name" array to the details object
 * based on the dropdownData lookups.
 *
 * @param {Object} details - The details object from each row in your data.
 * @param {Object} dropdownData - The object containing all dropdown arrays.
 * @returns {Object} Updated details with "<field>_name" suffix fields included.
 */
function addDropdownNames(details, dropdownData) {
  // Make a copy so we don't mutate the original object
  const updatedDetails = { ...details };

  Object.entries(pkToDropdownMap).forEach(([detailField, dropdownKey]) => {
    // If this record has that detailField (e.g. "topic", "target_organization", etc.)
    if (detailField in updatedDetails && updatedDetails[detailField]) {
      const fieldValue = updatedDetails[detailField];
      const dropdownArray = dropdownData[dropdownKey] || [];

      // Handle array-valued fields (e.g., exam_references)
      if (Array.isArray(fieldValue)) {
        // Map each id in the array to a label
        updatedDetails[`${detailField}_name`] = fieldValue.map((val) => {
          const match = dropdownArray.find((item) => {
            // Convert to number if needed
            return item.value === parseInt(val, 10);
          });
          return match ? match.label : "N/A";
        });
      } else {
        // Single-valued field
        const match = dropdownArray.find((item) => {
          // Convert to number if needed
          return item.value === parseInt(fieldValue, 10);
        });
        updatedDetails[`${detailField}_name`] = match ? match.label : "N/A";
      }
    }
  });

  return updatedDetails;
}

const ImportData = ({ type, closeModal, show }) => {
  // State management
  const formRef = useRef();
  const { t, token, globalError, setGlobalError, loading, setLoading } =
    useCommonForm();
  const { permissionsMap } = useUserPermissions();
  const [file, setFile] = useState(null);
  const [initialData, setInitialData] = useState([]);
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
        // Add the dropdown-based names to the details
        const parsedData = rawData.map((item) => {
          // Get the standard fields
          const { id, question_type, ...details } = item;

          // Augment 'details' with the suffix fields
          const augmentedDetails = addDropdownNames(details, dropdownData);

          return {
            id,
            question_type,
            details: augmentedDetails,
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

  const extractDetailedErrorMessage = (details, path = "") => {
    if (!details || typeof details !== "object") return null;

    for (const key in details) {
      const currentPath = path ? `${path} -> ${key}` : key;

      if (Array.isArray(details[key])) {
        // Handle arrays that contain strings or objects
        for (const item of details[key]) {
          if (typeof item === "string") {
            return `${currentPath}: ${item}`; // Found a string error
          } else if (typeof item === "object") {
            const nestedError = extractDetailedErrorMessage(item, currentPath);
            if (nestedError) return nestedError;
          }
        }
      } else if (typeof details[key] === "object") {
        // Handle nested objects
        const nestedError = extractDetailedErrorMessage(
          details[key],
          currentPath
        );
        if (nestedError) return nestedError;
      } else if (typeof details[key] === "string") {
        // Direct string error
        return `${currentPath}: ${details[key]}`;
      }
    }

    return null;
  };

  const handleImport = async (e) => {
    e.preventDefault();
    try {
      const promises = [];
      for (let i = 0; i < initialData.length; i++) {
        const formData = { ...initialData[i].details };

        formData.explanations = formData.explanations
          ? formData.explanations.map((val, ind) => ({
              ...val,
              level: explanationLevels[ind],
            }))
          : [];

        formData.options = formData.options
          ? formData.options.map((val) => val.option_text)
          : [];
        let type = formData.question_type;

        delete formData["question_type"];

        const promise = executeAjaxOperationStandard({
          url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_QUESTION}?type=${type}`,
          method: "post",
          data: JSON.stringify(formData),
          token,
        });

        promises.push(
          promise
            .then((val) => ({ ...val, index: i }))
            .catch((err) => ({ ...err, index: i }))
        );
      }

      const results = await Promise.all(promises);
      // Identify successful submissions
      const successfulIndexes = results
        .filter(
          (result) =>
            typeof result.status === "number" &&
            result.status >= 200 &&
            result.status < 300
        )
        .map((result) => result.index);

      // Remove successful questions
      successfulIndexes
        .sort((a, b) => b - a)
        .forEach((ind) => removeQuestion(ind));

      // Handle failures
      const failedResults = results.filter(
        (result) => result.status === "error"
      );

      // console.log(results);
      let ind = -1;
      failedResults.forEach((result, index) => {
        if (ind != -1) return;
        if (result.status === "error") {
          ind = index;
        }
      });

      if (ind != -1) {
        const { details, error } = results[ind];

        // Extract the first error message with context
        const detailedError = extractDetailedErrorMessage(details);
        const errorMessage = detailedError
          ? `Error in Question ${ind + 1}: ${detailedError}`
          : response?.message ||
            error?.message ||
            `Error in Question ${
              ind + 1
            }: An error occurred while submitting the form.`;

        setGlobalError(errorMessage);
        return;
      }
      window.location.reload();
    } catch (error) {
      console.error("An error occurred during question submission:", error);
      let errorMessage = "An error occurred while submitting the form.";
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      setGlobalError(errorMessage);
    }
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
              <>
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
                <div className="d-flex mt-4 justify-content-end">
                  <Button onClick={handleImport} type="primary">
                    Import
                  </Button>
                </div>
              </>
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
            <QuestionDetails university={selectedUniversity} />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ImportData;
