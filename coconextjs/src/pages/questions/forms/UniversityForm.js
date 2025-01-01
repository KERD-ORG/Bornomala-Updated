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

// Optional translation hook; replace or remove if you don't need i18n
const useTranslation = () => ({ t: (x) => x });

const MAX_QUESTIONS = 10;
const MAX_OPTIONS = 8;

/* 
  1. MASTER YUP SCHEMA
  We define "question_type" plus all possible fields, and 
  conditionally require or skip them depending on the question_type.
*/
const questionSchema = yup.object().shape({
  // The type of question
  question_type: yup
    .string()
    .oneOf(
      [
        "descriptive",
        "short-answer",
        "single-select",
        "multiple-select",
        "fill-blanks",
        "true-false",
      ],
      "Invalid question type"
    )
    .required("Question Type is required"),

  // For all questions, we keep a text prompt
  question_text: yup.string().when("question_type", {
    is: (val) =>
      [
        "descriptive",
        "short-answer",
        "single-select",
        "multiple-select",
        "fill-blanks",
        "true-false",
      ].includes(val),
    then: (schema) => schema.required("Question Text is required"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),

  // Difficulty, status, subtopics, etc. remain the same
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

  explanation: yup.string().nullable(),

  // Only required if question_status is "Reused"
  exam_references: yup.string().when("question_status", {
    is: "Reused",
    then: yup
      .string()
      .required("Exam References are required for a reused question"),
    otherwise: yup.string().nullable(),
  }),

  // 2. MCQ-Related fields
  // If question_type = single/multiple select, we require option_count, question_options, correct answer(s)
  option_count: yup
    .number()
    .typeError("Option Count must be a number")
    .when("question_type", {
      is: (val) => val === "single-select" || val === "multiple-select",
      then: (schema) =>
        schema
          .min(2, "Minimum 2 options")
          .max(MAX_OPTIONS, `Maximum ${MAX_OPTIONS} options`)
          .required("Option Count is required for MCQ"),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),

  question_options: yup
    .array()
    .of(yup.string().required("Option cannot be empty"))
    .when("question_type", {
      is: (val) => val === "single-select" || val === "multiple-select",
      then: (schema) =>
        schema
          .min(2, "At least 2 options are required")
          .max(MAX_OPTIONS, `No more than ${MAX_OPTIONS} options allowed`)
          .required("Options are required for MCQ"),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),

  // For "single-select", correct_answer is a single integer
  // For "multiple-select", we might store an array of correct indices.
  // But in this example, we keep it simple and reuse correct_answer as a single number,
  // or you can expand logic for multiple if needed.
  correct_answer: yup
    .mixed()
    .when("question_type", {
      // For single-select, we expect a number (1..option_count)
      is: "single-select",
      then: yup
        .number()
        .typeError("Correct answer must be a number")
        .required("Correct answer is required for single-select MCQ")
        .min(1, "Must be at least 1")
        .max(MAX_OPTIONS, `Cannot exceed ${MAX_OPTIONS}`),
    })
    .when("question_type", {
      // For multiple-select, you might store an array of selected indices or booleans
      // Here, let's assume we store a single string "1,3" if multiple.
      // Or you skip this if you prefer a separate field. This is up to your data structure.
      is: "multiple-select",
      then: yup
        .string()
        .required("Correct answers are required for multiple-select MCQ"),
    })
    .when("question_type", {
      // For True/False, we might store a boolean or a string "true"/"false"
      is: "true-false",
      then: yup.boolean().required("Correct answer is required for True/False"),
    })
    .when("question_type", {
      // For descriptive, short-answer, fill-blanks,
      // we might not require correct_answer.
      is: (val) => ["descriptive", "short-answer", "fill-blanks"].includes(val),
      then: (schema) => schema.notRequired().nullable(),
    }),

  // 3. For fill-blanks, we might store an `answer` field.
  // If question_type = fill-blanks, require it. Otherwise not required
  fill_blank_answer: yup.string().when("question_type", {
    is: "fill-blanks",
    then: (schema) => schema.required("Fill-in-the-blanks answer is required"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
});

// Overall form schema
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

  // Each item in questions must obey the questionSchema
  questions: yup.array().of(questionSchema),
});

/**
 * Default question object. We initialize with question_type = "descriptive"
 * for demonstration, and minimal fields.
 */
const defaultQuestion = {
  question_type: "descriptive", // "short-answer", "single-select", "multiple-select", "fill-blanks", "true-false"
  question_text: "",
  question_difficulty: "Very Easy",
  question_status: "New",
  question_topic: "",
  question_subtopic: "",
  question_subsubtopic: "",
  explanation: "",
  exam_references: "",

  // For MCQ
  option_count: 2,
  question_options: ["", ""],
  // For single-select: a single integer
  // For multiple-select: a string like "1,3" or etc.
  correct_answer: null,

  // For fill-blanks
  fill_blank_answer: "",
};

const UniversityForm = forwardRef(
  ({ initialData, onSubmit, onCancel, formMode, loading }, ref) => {
    const { t } = useTranslation();
    const [globalError, setGlobalError] = useState("");

    // Initialize react-hook-form to run final validation
    const {
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(mainSchema),
      mode: "onSubmit",
    });

    // Our local state for the entire form
    const [formData, setFormData] = useState(() => ({
      question_level: "",
      target_organization: "",
      target_group: "",
      target_course: "",
      question_count: 1,
      questions: [JSON.parse(JSON.stringify(defaultQuestion))],
      ...initialData,
    }));

    // Synchronize # of questions with question_count
    useEffect(() => {
      const currentCount = formData.questions.length;
      const desiredCount = formData.question_count;

      if (desiredCount > currentCount) {
        // add new
        const newQuestions = [...formData.questions];
        for (let i = currentCount; i < desiredCount; i++) {
          newQuestions.push(JSON.parse(JSON.stringify(defaultQuestion)));
        }
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      } else if (desiredCount < currentCount) {
        // remove from end
        const newQuestions = [...formData.questions].slice(0, desiredCount);
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      }
    }, [formData.question_count]);

    // Also keep question_options array length in sync with option_count
    // Only if question_type is single-select or multiple-select
    useEffect(() => {
      let changed = false;
      const newQuestions = formData.questions.map((q) => {
        if (
          q.question_type === "single-select" ||
          q.question_type === "multiple-select"
        ) {
          const currentOptionLength = q.question_options.length;
          const desiredLength = q.option_count || 2;
          if (desiredLength !== currentOptionLength) {
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
          }
        }
        return q;
      });
      if (changed) {
        setFormData((prev) => ({ ...prev, questions: newQuestions }));
      }
    }, [formData.questions]);

    // Generic handler for top-level or question-level changes
    const handleInputChange = (e, qIndex, fieldName) => {
      let { name, value } = e.target;
      if (e.target.type === "number") {
        value = parseInt(value || "0", 10);
      }

      if (typeof qIndex === "number" && fieldName) {
        // question-level field
        const updated = [...formData.questions];
        updated[qIndex] = {
          ...updated[qIndex],
          [fieldName]: value,
        };
        setFormData((prev) => ({ ...prev, questions: updated }));
      } else {
        // top-level field
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    };

    // For changing an individual option
    const handleOptionChange = (e, qIndex, optIndex) => {
      const value = e.target.value;
      const newQuestions = [...formData.questions];
      const optionsArr = [...newQuestions[qIndex].question_options];
      optionsArr[optIndex] = value;
      newQuestions[qIndex].question_options = optionsArr;
      setFormData((prev) => ({ ...prev, questions: newQuestions }));
    };

    // For changing question_type
    // We reset some fields to defaults
    const handleQuestionTypeChange = (qIndex, newType) => {
      const updated = [...formData.questions];
      updated[qIndex] = {
        ...JSON.parse(JSON.stringify(defaultQuestion)), // fresh blank
        question_type: newType, // override type
      };
      setFormData((prev) => ({ ...prev, questions: updated }));
    };

    // On final form submission
    const onSubmitForm = async () => {
      setGlobalError("");
      try {
        // Validate entire formData using our mainSchema
        await mainSchema.validate(formData, { abortEarly: false });
        // If no errors, call parent's onSubmit
        await onSubmit(formData);

        // Reset if needed
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
          // Show the first error message found
          setGlobalError(err.inner[0].message);
        } else {
          setGlobalError(err?.message || "Submission error");
        }
      }
    };

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
              {/* Example options if you have them:
              <option value="school">School Level</option>
              <option value="college">College Level</option>
              */}
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

        {/* Render each question */}
        {formData.questions.map((q, qIndex) => (
          <div key={qIndex} className="border p-2 mb-4">
            <h5>
              {t("Question")} #{qIndex + 1}
            </h5>

            {/* Question Type */}
            <div className="mb-3">
              <label>{t("Question Type")}</label>
              <select
                className="form-control"
                value={q.question_type}
                onChange={(e) =>
                  handleQuestionTypeChange(qIndex, e.target.value)
                }
              >
                <option value="descriptive">{t("Descriptive/Essay")}</option>
                <option value="short-answer">{t("Short Answer")}</option>
                <option value="single-select">{t("Single-Select MCQ")}</option>
                <option value="multiple-select">
                  {t("Multiple-Select MCQ")}
                </option>
                <option value="fill-blanks">{t("Fill-in-the-Blanks")}</option>
                <option value="true-false">{t("True/False")}</option>
              </select>
            </div>

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
            {q.question_type !== "true-false" && (
              <div className="mb-3">
                <label>{t("Question Text")}</label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={q.question_text}
                  onChange={(e) =>
                    handleInputChange(e, qIndex, "question_text")
                  }
                />
              </div>
            )}
            {q.question_type === "true-false" && (
              <div className="mb-3">
                <label>{t("Statement (True/False)")}</label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={q.question_text}
                  onChange={(e) =>
                    handleInputChange(e, qIndex, "question_text")
                  }
                />
              </div>
            )}

            {/* For fill-blanks */}
            {q.question_type === "fill-blanks" && (
              <div className="mb-3">
                <label>{t("Correct Answer for Blank")}</label>
                <input
                  type="text"
                  className="form-control"
                  value={q.fill_blank_answer}
                  onChange={(e) =>
                    handleInputChange(e, qIndex, "fill_blank_answer")
                  }
                />
              </div>
            )}

            {/* If single-select or multiple-select, show options, correct_answer */}
            {(q.question_type === "single-select" ||
              q.question_type === "multiple-select") && (
              <>
                <div className="mb-3">
                  <label>{t("How many options? (2-8)")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={q.option_count}
                    min={2}
                    max={MAX_OPTIONS}
                    onChange={(e) =>
                      handleInputChange(e, qIndex, "option_count")
                    }
                  />
                </div>

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

                {q.question_type === "single-select" && (
                  <div className="mb-3">
                    <label>{t("Correct Answer (option #)")}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={q.correct_answer || ""}
                      onChange={(e) =>
                        handleInputChange(e, qIndex, "correct_answer")
                      }
                    />
                    <small>
                      {t("For single-select, enter the option number (1..N).")}
                    </small>
                  </div>
                )}

                {q.question_type === "multiple-select" && (
                  <div className="mb-3">
                    <label>{t("Correct Answers (e.g. 1,3)")}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={q.correct_answer || ""}
                      onChange={(e) =>
                        handleInputChange(e, qIndex, "correct_answer")
                      }
                    />
                    <small>
                      {t(
                        "For multiple-select, specify indices separated by commas."
                      )}
                    </small>
                  </div>
                )}
              </>
            )}

            {/* True/False correct answer */}
            {q.question_type === "true-false" && (
              <div className="mb-3">
                <label>{t("Correct Answer")}: </label>
                <select
                  className="form-control"
                  value={q.correct_answer === true ? "true" : "false"}
                  onChange={(e) =>
                    handleInputChange(
                      e,
                      qIndex,
                      "correct_answer",
                      e.target.value === "true"
                    )
                  }
                >
                  <option value="true">{t("True")}</option>
                  <option value="false">{t("False")}</option>
                </select>
              </div>
            )}

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

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={handleCancelClick}
            disabled={loading}
          >
            {t("Cancel")}
          </button>
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
        // The newly added question_type
        question_type: PropTypes.oneOf([
          "descriptive",
          "short-answer",
          "single-select",
          "multiple-select",
          "fill-blanks",
          "true-false",
        ]).isRequired,
        question_text: PropTypes.string,
        question_difficulty: PropTypes.string,
        question_status: PropTypes.string,
        question_topic: PropTypes.string,
        question_subtopic: PropTypes.string,
        question_subsubtopic: PropTypes.string,
        explanation: PropTypes.string,
        exam_references: PropTypes.string,
        option_count: PropTypes.number,
        question_options: PropTypes.arrayOf(PropTypes.string),
        correct_answer: PropTypes.any, // can be number, string, or boolean
        fill_blank_answer: PropTypes.string,
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
