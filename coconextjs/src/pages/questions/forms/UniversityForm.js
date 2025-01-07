import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
// import { toast } from "react-toastify";

// Define constants and default values
const MAX_OPTIONS = 8;

const BASE_URL = "http://localhost:8000";

const defaultValues = {
  question_text: "",
  explanation: "",
  correct_answer: "",
  question_level: "",
  target_organization: "",
  target_group: "",
  target_subject: "",
  question_type: "",
  topic: "",
  exam_references: [],
  question_status: "",
  difficulty_level: "",
  mcq_options: [{ option_text: "" }, { option_text: "" }],
};

// Yup validation schema
const mainSchema = yup.object().shape({
  question_text: yup.string().required("Question Text is required"),
  explanation: yup.string().required("Explanation is required"),
  correct_answer: yup.mixed().required("Correct Answer is required"),
  question_level: yup.number().required("Question Level is required"),
  target_organization: yup.number().required("Organization is required"),
  target_group: yup.number().required("Target Group is required"),
  target_subject: yup.number().required("Subject is required"),
  question_type: yup.number().required("Question Type is required"),
  topic: yup.number().required("Topic is required"),
  exam_references: yup
    .array()
    .of(yup.number())
    .min(1, "At least one exam reference is required"),
  question_status: yup.number().required("Question Status is required"),
  difficulty_level: yup.number().required("Difficulty Level is required"),
  mcq_options: yup
    .array()
    .of(
      yup.object({
        option_text: yup.string().required("Option cannot be empty"),
      })
    )
    .min(2, "At least two options are required"),
});

const UniversityQuestionForm = forwardRef(({ onSubmitSuccess }, ref) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(mainSchema),
    defaultValues,
  });
  const { token } = useCommonForm();

  // Dropdown data state
  const [dropdownData, setDropdownData] = React.useState({
    questionLevels: [],
    organizations: [],
    targetGroups: [],
    subjects: [],
    questionTypes: [],
    topics: [],
    examReferences: [],
    questionStatuses: [],
    difficultyLevels: [],
    subTopics: [],
  });

  // Field array for MCQ options
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mcq_options",
  });

  useImperativeHandle(ref, () => ({
    resetForm: () => reset(defaultValues),
  }));

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      if(!token) return;
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
      };

      try {
        const promises = Object.entries(endpoints).map(([key, endpoint]) =>
          executeAjaxOperationStandard({
            url: `/${endpoint}/`, // Endpoint URL
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
        // Optionally show a toast notification here
      }
    };

    fetchDropdownData();
  }, [token]);

  // Fetch subtopics when topic changes (if needed)
  // This part is omitted for brevity – you can add similar logic if necessary.

  const onSubmitForm = async (data) => {
    try {
      const headers = {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      };

      // Transform exam_references to array of IDs if they are objects
      const examRefs = data.exam_references.map((ref) => ref.value || ref);

      // Prepare payload
      const payload = {
        ...data,
        question_level: data.question_level.value || data.question_level,
        target_organization:
          data.target_organization.value || data.target_organization,
        target_group: data.target_group.value || data.target_group,
        target_subject: data.target_subject.value || data.target_subject,
        question_type: data.question_type.value || data.question_type,
        topic: data.topic.value || data.topic,
        exam_references: examRefs,
        question_status: data.question_status.value || data.question_status,
        difficulty_level: data.difficulty_level.value || data.difficulty_level,
      };

      await axios.post(`${BASE_URL}/questions/`, payload, { headers });
      // toast.success("Question created successfully!");
      reset(defaultValues);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error("Error creating question:", error);
      // toast.error("Failed to create question.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      {/* Question Text */}
      <div className="form-group">
        <label>Question Text:</label>
        <Controller
          name="question_text"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className={`form-control ${
                errors.question_text ? "is-invalid" : ""
              }`}
            />
          )}
        />
        {errors.question_text && (
          <div className="invalid-feedback">{errors.question_text.message}</div>
        )}
      </div>

      {/* Explanation */}
      <div className="form-group">
        <label>Explanation:</label>
        <Controller
          name="explanation"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className={`form-control ${
                errors.explanation ? "is-invalid" : ""
              }`}
            />
          )}
        />
        {errors.explanation && (
          <div className="invalid-feedback">{errors.explanation.message}</div>
        )}
      </div>

      {/* Correct Answer */}
      <div className="form-group">
        <label>Correct Answer:</label>
        <Controller
          name="correct_answer"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              className={`form-control ${
                errors.correct_answer ? "is-invalid" : ""
              }`}
            />
          )}
        />
        {errors.correct_answer && (
          <div className="invalid-feedback">
            {errors.correct_answer.message}
          </div>
        )}
      </div>

      {/* MCQ Options */}
      {fields.map((item, index) => (
        <div key={item.id} className="form-group">
          <label>Option {index + 1}:</label>
          <Controller
            name={`mcq_options.${index}.option_text`}
            control={control}
            render={({ field }) => (
              <div className="input-group">
                <input
                  {...field}
                  className={`form-control ${
                    errors.mcq_options?.[index]?.option_text ? "is-invalid" : ""
                  }`}
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (fields.length > 2) remove(index);
                    // else toast.error("At least two options required.");
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          />
          {errors.mcq_options?.[index]?.option_text && (
            <div className="invalid-feedback">
              {errors.mcq_options[index].option_text.message}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          if (fields.length < MAX_OPTIONS) append({ option_text: "" });
          // else toast.error(`Maximum ${MAX_OPTIONS} options allowed.`);
        }}
      >
        Add Option
      </button>

      {/* Dropdowns for other fields */}
      <div className="form-group">
        <label>Question Level:</label>
        <Controller
          name="question_level"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className={`form-control ${
                errors.question_level ? "is-invalid" : ""
              }`}
            >
              <option value="">-- Select Question Level --</option>
              {dropdownData.questionLevels.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.question_level && (
          <div className="invalid-feedback">
            {errors.question_level.message}
          </div>
        )}
      </div>

      {/* Repeat similar blocks for target_organization, target_group, target_subject,
          question_type, topic, exam_references, question_status, difficulty_level */}

      {/* For brevity, here's one more example for Target Organization */}
      <div className="form-group">
        <label>Target Organization:</label>
        <Controller
          name="target_organization"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className={`form-control ${
                errors.target_organization ? "is-invalid" : ""
              }`}
            >
              <option value="">-- Select Organization --</option>
              {dropdownData.organizations.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.target_organization && (
          <div className="invalid-feedback">
            {errors.target_organization.message}
          </div>
        )}
      </div>

      {/* Add similar dropdowns for target_group, target_subject, question_type, topic, 
          exam_references, question_status, difficulty_level */}

      <button type="submit" className="btn btn-primary mt-3">
        Create Question
      </button>
    </form>
  );
});

UniversityQuestionForm.propTypes = {
  onSubmitSuccess: PropTypes.func,
};

UniversityQuestionForm.defaultProps = {
  onSubmitSuccess: () => {},
};

export default UniversityQuestionForm;
