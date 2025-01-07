import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { useRouter } from "next/router";
import Select from "react-select";

const MAX_OPTIONS = 8;
const explanationLevels = ["Preliminary", "Intermediate", "Advanced"];

const defaultValues = {
  target_organization: "",
  question_level: "",
  question_text: "",
  correct_answer: "",
  target_subject: "",
  exam_references: [],
  question_type: "",
  topic: "",
  sub_topic: "",
  difficulty_level: "",
  mcq_options: [{ option_text: "" }, { option_text: "" }],
  explanations: [],
};

// Define validation schema as needed for editing a question
const mainSchema = yup.object().shape({
  target_organization: yup.string().required("Organization is required"),
  question_level: yup.string().required("Question Level is required"),
  question_text: yup.string().required("Question Text is required"),
  correct_answer: yup.string().required("Correct answer is required"),
  target_subject: yup.string().required("Subject is required"),
  exam_references: yup.array(),
  question_type: yup.string().required("Question Type is required"),
  topic: yup.string().required("Topic is required"),
  sub_topic: yup.string(),
  difficulty_level: yup.string().required("Difficulty Level is required"),
  mcq_options: yup
    .array()
    .of(
      yup.object({
        option_text: yup.string().required("Option cannot be empty"),
      })
    )
    .min(2, "At least two options are required"),
});

const QuestionEditForm = forwardRef(
  ({ initialData, onSubmit, onCancel, addRow, deleteRow, setLoading }, ref) => {
    const {
      t,
      globalError,
      setGlobalError,
      setSuccessMessage,
      token,
      setToken,
    } = useCommonForm();
    const router = useRouter();
    const {
      control,
      handleSubmit,
      reset,
      setValue,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(mainSchema),
      defaultValues,
    });

    const [dropdownData, setDropdownData] = React.useState({
      subjects: [],
      questionTypes: [],
      topics: [],
      examReferences: [],
      difficultyLevels: [],
      subTopics: [],
      organizations: [],
      questionLevels: [],
    });

    useImperativeHandle(ref, () => ({
      resetForm: () => reset(defaultValues),
    }));

    useEffect(() => {
      console.log(errors);
    }, [errors]);

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

    // Populate form fields with initialData when editing a single question
    useEffect(() => {
      if (initialData) {
        reset({
          target_organization: initialData.target_organization || "",
          question_level: initialData.question_level || "",
          question_text: initialData.question_text || "",
          correct_answer: initialData.correct_answer || "",
          target_subject: initialData.target_subject || "",
          exam_references: initialData.exam_references || [],
          question_type: initialData.question_type || "",
          topic: initialData.topic || "",
          sub_topic: initialData.sub_topic || "",
          difficulty_level: initialData.difficulty_level || "",
          mcq_options: initialData.mcq_options.length
            ? initialData.mcq_options
            : [{ option_text: "" }, { option_text: "" }],
          explanations: initialData.explanations.length
            ? initialData.explanations
            : [],
        });
      }
    }, [initialData, reset]);

    const onSubmitForm = async (data) => {
      try {
        const url = process.env.NEXT_PUBLIC_API_ENDPOINT_QUESTION;
        const method = "put";

        setLoading(true);
        const response = await executeAjaxOperationStandard({
          url: `${url}${initialData.id}/`,
          method: method,
          token,
          data,
          locale: router.locale || "en",
        });

        if (
          response.status >=
            parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          deleteRow(response.data.id);
          addRow(response.data);
          onCancel();
          onSubmit(
            response.data.message || t("Question updated successfully."),
            true
          );
        } else {
          if (response.details) {
            Object.keys(response.details).forEach((field) => {
              setError(field, {
                type: "server",
                message: response.details[field][0],
              });
            });
          }
          //setGlobalError(response.message);
          setSuccessMessage("");
        }
      } catch (error) {
        let errorMessage = t("An error occurred while updating the question.");
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          errorMessage = error.response.data.error;
        }
        setGlobalError(errorMessage);
        setSuccessMessage("");
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Target Organization:</label>
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

          <div className="col-md-6">
            <label className="form-label">Question Level:</label>
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
        </div>
        <div className="row mb-3">
          <div className="col-12">
            <label className="form-label">Question Text:</label>
            <Controller
              name="question_text"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className={`form-control ${
                    errors.question_text ? "is-invalid" : ""
                  }`}
                  rows={4}
                />
              )}
            />
            {errors.question_text && (
              <div className="invalid-feedback">
                {errors.question_text.message}
              </div>
            )}
          </div>
        </div>
        <NestedMCQOptions control={control} errors={errors} />

        <div className="row mb-3">
          <div className="col-12">
            <label className="form-label">Correct Answer:</label>
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
        </div>

        {/* Render Subject, Question Type, Topic, Subtopic, Difficulty dropdowns */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Subject:</label>
            <Controller
              name="target_subject"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-control">
                  <option value="">-- Select Subject --</option>
                  {dropdownData.subjects.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Question Type:</label>
            <Controller
              name="question_type"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-control">
                  <option value="">-- Select Question Type --</option>
                  {dropdownData.questionTypes.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        {/* Additional dropdowns for Topic, Sub Topic, Difficulty Level */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Topic:</label>
            <Controller
              name="topic"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-control">
                  <option value="">-- Select Topic --</option>
                  {dropdownData.topics.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.topic && (
              <div className="invalid-feedback">{errors.topic.message}</div>
            )}
          </div>
          <div className="col-md-6">
            <label className="form-label">Sub Topic:</label>
            <Controller
              name="sub_sub_topic"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-control">
                  <option value="">-- Select Sub Topic --</option>
                  {dropdownData.subTopics.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.sub_sub_topic && (
              <div className="invalid-feedback">
                {errors.sub_sub_topic.message}
              </div>
            )}
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Difficulty Level:</label>
            <Controller
              name="difficulty_level"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-control">
                  <option value="">-- Select Difficulty Level --</option>
                  {dropdownData.difficultyLevels.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.difficulty_level && (
              <div className="invalid-feedback">
                {errors.difficulty_level.message}
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label className="form-label">Exam References:</label>
            <Controller
              name="exam_references"
              control={control}
              render={({ field }) => {
                const { onChange, value, ref } = field;
                const currentVal = dropdownData.examReferences.filter((val) =>
                  value.includes(val.value)
                );
                return (
                  <Select
                    inputRef={ref}
                    isMulti
                    {...field}
                    value={currentVal}
                    options={dropdownData.examReferences}
                    onChange={(selectedOptions) =>
                      onChange(selectedOptions.map((option) => option.value))
                    }
                    classNamePrefix={
                      errors.exam_references ? "is-invalid" : "select"
                    }
                  />
                );
              }}
            />
            {errors.exam_references && (
              <div className="invalid-feedback">
                {errors.exam_references.message}
              </div>
            )}
          </div>
        </div>

        <NestedExplanations control={control} errors={errors} />

        <div className="row">
          <div className="col-12">
            <button type="submit" className="btn btn-primary">
              Update Question
            </button>
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }
);

const NestedMCQOptions = ({ control, errors, qIndex }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `mcq_options`,
  });

  return (
    <div className="row mb-3">
      <div className="col-12">
        <label className="form-label">MCQ Options:</label>
        {fields.map((field, oIndex) => (
          <div key={field.id} className="input-group mb-2">
            <Controller
              name={`mcq_options.${oIndex}.option_text`}
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={`form-control ${
                    errors?.mcq_options?.[oIndex]?.option_text
                      ? "is-invalid"
                      : ""
                  }`}
                  placeholder={`Option ${oIndex + 1}`}
                />
              )}
            />
            {fields.length > 2 && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => remove(oIndex)}
              >
                Remove
              </button>
            )}
            {errors?.mcq_options?.[oIndex]?.option_text.message && (
              <div className="invalid-feedback d-block">
                {errors?.mcq_options?.[oIndex]?.option_text.message}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => append({ option_text: "" })}
          disabled={fields.length >= MAX_OPTIONS}
        >
          Add Option
        </button>
      </div>
    </div>
  );
};

const NestedExplanations = ({ control, errors, qIndex }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `explanations`,
  });

  return (
    <div className="mb-3">
      <label className="form-label">Explanations:</label>
      {fields.map((field, eIndex) => (
        <div key={field.id} className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">{field.level} Level Explanation</h6>
            <Controller
              name={`explanations.${eIndex}.text`}
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="form-control mb-2"
                  placeholder="Explanation text"
                  rows={3}
                />
              )}
            />
            <div className="mb-2">
              <label className="form-label">Video (optional):</label>
              <Controller
                name={`explanations.${eIndex}.video`}
                control={control}
                render={({ field }) => (
                  <input
                    type="file"
                    accept="video/*"
                    className="form-control"
                    onChange={(e) => {
                      // Store the selected file in form state
                      field.onChange(e.target.files[0]);
                    }}
                  />
                )}
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => remove(eIndex)}
            >
              Remove Explanation
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ marginLeft: "10px" }}
        disabled={fields.length >= 3}
        onClick={() => {
          append({
            level: explanationLevels[fields.length] || explanationLevels[2],
            text: "",
            video: null,
          });
        }}
      >
        Add Explanation
      </button>
    </div>
  );
};

QuestionEditForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export default QuestionEditForm;

// NestedMCQOptions and NestedExplanations components remain similar to previous examples, but without the qIndex prop if not required.
