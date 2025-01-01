import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// Optional translation hook; replace or remove as needed
const useTranslation = () => ({ t: (x) => x });

const MAX_QUESTIONS = 10;
const MAX_OPTIONS = 8;

// -------------------------------
// 1. Yup Validation Schemas
// -------------------------------

// For each question
const questionSchema = yup.object().shape({
  question_difficulty: yup
    .string()
    .oneOf(
      ["Very Easy", "Easy", "Moderate", "Difficult", "Very Difficult"],
      "Invalid difficulty selected"
    )
    .required("Question Difficulty is required"),

  question_status: yup
    .string()
    .oneOf(["New", "Reused"], "Invalid status")
    .required("Question Status is required"),

  question_topic: yup.string().nullable(),
  question_subtopic: yup.string().nullable(),
  question_subsubtopic: yup.string().nullable(),

  question_text: yup.string().required("Question Text is required"),

  explanation: yup.string().nullable(),

  // *** Conditional Validation for exam_references ***
  // Only required if question_status is "Reused"
  exam_references: yup.string().when("question_status", {
    is: "Reused",
    then: yup
      .string()
      .required("Exam References are required for a reused question"),
    otherwise: yup.string().nullable(),
  }),

  option_count: yup
    .number()
    .typeError("Option Count must be a number")
    .min(2, "Minimum 2 options")
    .max(MAX_OPTIONS, `Maximum ${MAX_OPTIONS} options`)
    .required("Option Count is required"),

  question_options: yup
    .array()
    .of(yup.string().required("Option cannot be empty"))
    .min(2, "At least 2 options are required")
    .max(MAX_OPTIONS, `No more than ${MAX_OPTIONS} options allowed`),

  correct_answer: yup
    .number()
    .typeError("Correct answer must be a number")
    .required("Correct answer is required")
    .min(1, "Must be at least 1")
    .max(MAX_OPTIONS, `Cannot exceed ${MAX_OPTIONS}`),
});

// For the overall form
const mainSchema = yup.object().shape({
  question_level: yup.string().required("Question Level is required"),
  target_organization: yup.string().required("Target Organization is required"),
  target_group: yup.string().required("Target Group is required"),
  target_course: yup.string().required("Target Course is required"),

  question_count: yup
    .number()
    .typeError("How many questions? must be a number")
    .min(1, "At least 1 question")
    .max(MAX_QUESTIONS, `No more than ${MAX_QUESTIONS} questions`)
    .required("Number of questions is required"),

  questions: yup.array().of(questionSchema),
});

// -------------------------------
// 2. Default Question
// -------------------------------
const defaultQuestion = {
  question_difficulty: "Very Easy", // pick one as default
  question_status: "New",
  question_topic: "",
  question_subtopic: "",
  question_subsubtopic: "",
  question_text: "",
  explanation: "",
  // exam_references will be shown only if question_status == "Reused"
  exam_references: "",
  option_count: 2,
  question_options: ["", ""],
  correct_answer: 1,
};

// -------------------------------
// 3. Main Form Component
// -------------------------------
const UniversityForm = forwardRef(
  ({ initialData, onSubmit, onCancel, formMode, loading }, ref) => {
    const { t } = useTranslation();
    const [globalError, setGlobalError] = useState("");

    // We use react-hook-form to run final validation
    const {
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(mainSchema),
      mode: "onSubmit",
    });

    // Local state for all fields
    const [formData, setFormData] = useState(() => ({
      question_level: "",
      target_organization: "",
      target_group: "",
      target_course: "",
      question_count: 1,
      questions: [JSON.parse(JSON.stringify(defaultQuestion))],
      ...initialData,
    }));

    // Sync the number of questions with question_count
    useEffect(() => {
      const currentCount = formData.questions.length;
      const desiredCount = formData.question_count;

      if (desiredCount > currentCount) {
        const newQuestions = [...formData.questions];
        for (let i = currentCount; i < desiredCount; i++) {
          newQuestions.push(JSON.parse(JSON.stringify(defaultQuestion)));
        }
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      } else if (desiredCount < currentCount) {
        const newQuestions = [...formData.questions].slice(0, desiredCount);
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      }
    }, [formData.question_count]);

    // Keep question_options array in sync with option_count
    useEffect(() => {
      let changed = false;
      const newQuestions = formData.questions.map((q) => {
        const currentOptionLength = q.question_options.length;
        const desiredLength = q.option_count;
        if (desiredLength === currentOptionLength) {
          return q;
        }
        changed = true;
        const newQ = { ...q, question_options: [...q.question_options] };
        if (desiredLength > currentOptionLength) {
          for (let k = currentOptionLength; k < desiredLength; k++) {
            newQ.question_options.push("");
          }
        } else {
          newQ.question_options.splice(desiredLength);
        }
        return newQ;
      });
      if (changed) {
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      }
    }, [formData.questions]);

    // Input change handlers
    const handleInputChange = (e, qIndex, fieldName) => {
      let { name, value } = e.target;
      if (e.target.type === "number") {
        value = parseInt(value || "0", 10);
      }

      if (typeof qIndex === "number" && fieldName) {
        // question-level field
        const newQuestions = [...formData.questions];
        newQuestions[qIndex] = {
          ...newQuestions[qIndex],
          [fieldName]: value,
        };
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      } else {
        // top-level field
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    };

    const handleOptionChange = (e, qIndex, optIndex) => {
      const value = e.target.value;
      const newQuestions = [...formData.questions];
      const optionsArr = [...newQuestions[qIndex].question_options];
      optionsArr[optIndex] = value;
      newQuestions[qIndex].question_options = optionsArr;
      setFormData((prev) => ({ ...prev, questions: newQuestions }));
    };

    // On submit
    const onSubmitForm = async () => {
      setGlobalError("");
      try {
        // Validate entire formData
        await mainSchema.validate(formData, { abortEarly: false });
        // If ok, call parent's onSubmit
        await onSubmit(formData);

        // Reset if create/clone
        if (formMode === "create" || formMode === "clone") {
          setFormData({
            question_level: "",
            target_organization: "",
            target_group: "",
            target_course: "",
            question_count: 1,
            questions: [JSON.parse(JSON.stringify(defaultQuestion))],
          });
        }
      } catch (err) {
        if (err?.inner?.length) {
          // Show the first error
          setGlobalError(err.inner[0].message);
        } else {
          // Single or unknown error
          setGlobalError(err?.message || "Submission error");
        }
      }
    };

    // Cancel
    const handleCancelClick = () => {
      setFormData({
        question_level: "",
        target_organization: "",
        target_group: "",
        target_course: "",
        question_count: 1,
        questions: [JSON.parse(JSON.stringify(defaultQuestion))],
      });
      onCancel();
    };

    useImperativeHandle(ref, () => ({
      handleCancelClick,
    }));

    // Render
    return (
      <form onSubmit={handleSubmit(onSubmitForm)}>
        {globalError && (
          <div className="alert alert-danger mt-3" role="alert">
            {globalError}
          </div>
        )}

        {/* Row 1: Question Level & Target Organization */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Question Level")}</label>
            <select
              name="question_level"
              className={`form-control ${
                errors.question_level ? "is-invalid" : ""
              }`}
              value={formData.question_level}
              onChange={handleInputChange}
            >
              <option value="">{t("-- Select --")}</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Target Organization")}</label>
            <select
              name="target_organization"
              className={`form-control ${
                errors.target_organization ? "is-invalid" : ""
              }`}
              value={formData.target_organization}
              onChange={handleInputChange}
            >
              <option value="">{t("-- Select --")}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Target Group & Target Course */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Target Group")}</label>
            <select
              name="target_group"
              className={`form-control ${
                errors.target_group ? "is-invalid" : ""
              }`}
              value={formData.target_group}
              onChange={handleInputChange}
            >
              <option value="">{t("-- Select --")}</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Target Course/Subject")}</label>
            <input
              name="target_course"
              type="text"
              className={`form-control ${
                errors.target_course ? "is-invalid" : ""
              }`}
              value={formData.target_course}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* How many questions? */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>{t("How many questions? (1-10)")}</label>
            <input
              name="question_count"
              type="number"
              min={1}
              max={MAX_QUESTIONS}
              className={`form-control ${
                errors.question_count ? "is-invalid" : ""
              }`}
              value={formData.question_count}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Render the questions */}
        {formData.questions.map((q, qIndex) => (
          <div key={qIndex} className="border p-2 mb-4">
            <h5>
              {t("Question")} #{qIndex + 1}
            </h5>

            {/* Difficulty & Status */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>{t("Difficulty")}</label>
                <select
                  className="form-control"
                  value={q.question_difficulty}
                  onChange={(e) =>
                    handleInputChange(e, qIndex, "question_difficulty")
                  }
                >
                  <option value="Very Easy">{t("Very Easy")}</option>
                  <option value="Easy">{t("Easy")}</option>
                  <option value="Moderate">{t("Moderate")}</option>
                  <option value="Difficult">{t("Difficult")}</option>
                  <option value="Very Difficult">{t("Very Difficult")}</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label>{t("Question Status")}</label>
                <select
                  className="form-control"
                  value={q.question_status}
                  onChange={(e) =>
                    handleInputChange(e, qIndex, "question_status")
                  }
                >
                  <option value="New">{t("New")}</option>
                  <option value="Reused">{t("Reused")}</option>
                </select>
              </div>
            </div>

            {/* question_text */}
            <div className="mb-3">
              <label>{t("Question Text")}</label>
              <textarea
                rows={2}
                className="form-control"
                value={q.question_text}
                onChange={(e) => handleInputChange(e, qIndex, "question_text")}
              />
            </div>

            {/* option_count */}
            <div className="mb-3">
              <label>{t("How many options? (2-8)")}</label>
              <input
                type="number"
                className="form-control"
                value={q.option_count}
                min={2}
                max={MAX_OPTIONS}
                onChange={(e) => handleInputChange(e, qIndex, "option_count")}
              />
            </div>

            {/* question_options */}
            <div className="mb-3">
              <label>{t("Options")}</label>
              {q.question_options.map((optVal, optIndex) => (
                <input
                  key={optIndex}
                  type="text"
                  className="form-control mt-1"
                  value={optVal}
                  placeholder={`Option #${optIndex + 1}`}
                  onChange={(e) => handleOptionChange(e, qIndex, optIndex)}
                />
              ))}
            </div>

            {/* correct_answer */}
            <div className="mb-3">
              <label>{t("Correct Answer (option #)")}</label>
              <input
                type="number"
                className="form-control"
                value={q.correct_answer}
                onChange={(e) => handleInputChange(e, qIndex, "correct_answer")}
              />
            </div>

            {/* explanation */}
            <div className="mb-3">
              <label>{t("Explanation")}</label>
              <textarea
                className="form-control"
                rows={2}
                value={q.explanation}
                onChange={(e) => handleInputChange(e, qIndex, "explanation")}
              />
            </div>

            {/* exam_references - ONLY visible if Reused */}
            {q.question_status === "Reused" && (
              <div className="mb-3">
                <label>{t("Exam References")}</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={q.exam_references}
                  onChange={(e) =>
                    handleInputChange(e, qIndex, "exam_references")
                  }
                />
              </div>
            )}
          </div>
        ))}

        {/* Action buttons */}
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={handleCancelClick}
            disabled={loading}
          >
            {t("Cancel")}
          </button>
          {/* We use a manual onClick + handleSubmit for final validation */}
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={onSubmitForm}
          >
            {formMode === "edit" ? t("Save") : t("Save")}
          </button>
        </div>
      </form>
    );
  }
);

UniversityForm.propTypes = {
  initialData: PropTypes.shape({
    question_level: PropTypes.string,
    target_organization: PropTypes.string,
    target_group: PropTypes.string,
    target_course: PropTypes.string,
    question_count: PropTypes.number,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        question_difficulty: PropTypes.string,
        question_status: PropTypes.string,
        question_topic: PropTypes.string,
        question_subtopic: PropTypes.string,
        question_subsubtopic: PropTypes.string,
        question_text: PropTypes.string,
        explanation: PropTypes.string,
        exam_references: PropTypes.string,
        option_count: PropTypes.number,
        question_options: PropTypes.arrayOf(PropTypes.string),
        correct_answer: PropTypes.number,
      })
    ),
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  formMode: PropTypes.oneOf(["create", "edit", "clone"]),
  loading: PropTypes.bool,
};

UniversityForm.defaultProps = {
  loading: false,
};

export default UniversityForm;
