import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import Select from 'react-select'

const MAX_OPTIONS = 8;
const BASE_URL = "http://localhost:8000";

const defaultValues = {
  question_text: "",
  explanations: [
    { level: "Preliminary", text: "", video: null },
    { level: "Intermediate", text: "", video: null },
    { level: "Advanced", text: "", video: null },
  ],
  correct_answer: "",
  question_level: "",
  target_organization: "",
  target_group: "",
  target_subject: "",
  question_type: "",
  topic: "",
  sub_topic: "",
  sub_sub_topic: "",
  exam_references: [],
  question_status: "",
  difficulty_level: "",
  mcq_options: [{ option_text: "" }, { option_text: "" }],
};

const mainSchema = yup.object().shape({
  question_text: yup.string().required("Question Text is required"),
  correct_answer: yup.string(), //.required("Correct Answer is required"),
  question_level: yup.string().required("Question Level is required"),
  target_organization: yup.string().required("Organization is required"),
  target_group: yup.string().required("Target Group is required"),
  target_subject: yup.string().required("Subject is required"),
  question_type: yup.string().required("Question Type is required"),
  topic: yup.string().required("Topic is required"),
  exam_references: yup
    .array()
    .of(yup.number())
    .min(1, "At least one exam reference is required"),
  question_status: yup.string().required("Question Status is required"),
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

const UniversityQuestionForm = forwardRef(({ onSubmitSuccess }, ref) => {
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

  const { token } = useCommonForm();
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

  const [explanations, setExplanations] = React.useState([
    { level: "Preliminary", text: "", video: null },
    { level: "Intermediate", text: "", video: null },
    { level: "Advanced", text: "", video: null },
  ]);

  const handleExplanationChange = (index, field, value) => {
    const newExplanations = [...explanations];
    newExplanations[index][field] = value;
    setExplanations(newExplanations);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "mcq_options",
  });

  useImperativeHandle(ref, () => ({
    resetForm: () => reset(defaultValues),
  }));

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

  const onSubmitForm = async (data) => {
    try {
      const payload = {
        ...data,
        exam_references: data.exam_references.map((ref) => ref.value || ref),
      };

      await axios.post(`${BASE_URL}/questions/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      reset(defaultValues);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      {/* Dropdowns */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Question Level:</label>
          <Controller
            name="question_level"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`form-control form-control-sm ${
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

        <div className="col-md-6 mb-3">
          <label className="form-label">Target Organization:</label>
          <Controller
            name="target_organization"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`form-control form-control-sm ${
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
                className={`form-control form-control-sm ${
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

      {/* <div className="row">
        <div className="col-md-12 mb-3">
          <label className="form-label">Correct Answer:</label>
          <Controller
            name="correct_answer"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className={`form-control form-control-sm ${
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
      </div> */}

      {/* MCQ Options */}
      <div className="row mb-3">
        <div className="col-12">
          <label className="form-label">MCQ Options:</label>
          {fields.map((field, index) => (
            <div key={field.id} className="input-group mb-2">
              <Controller
                name={`mcq_options.${index}.option_text`}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`form-control form-control-sm ${
                      errors.mcq_options?.[index]?.option_text
                        ? "is-invalid"
                        : ""
                    }`}
                    placeholder={`Option ${index + 1}`}
                  />
                )}
              />
              {fields.length > 2 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </button>
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

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Subject:</label>
          <Controller
            name="target_subject"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`form-control form-control-sm ${
                  errors.target_subject ? "is-invalid" : ""
                }`}
              >
                <option value="">-- Select Subject --</option>
                {dropdownData.subjects.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.target_subject && (
            <div className="invalid-feedback">
              {errors.target_subject.message}
            </div>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Exam References:</label>
          <Controller
            name="exam_references"
            control={control}
            render={({ field }) => {
              // Convert react-hook-form field value into expected format for react-select
              const { onChange, value, ref } = field;

              return (
                <Select
                  inputRef={ref}
                  isMulti
                  options={dropdownData.examReferences}
                  // Ensure the selected options match the current field value
                  value={dropdownData.examReferences.filter((option) =>
                    value?.includes(option.value)
                  )}
                  onChange={(selectedOptions) => {
                    // Update the RHF field with an array of selected values
                    onChange(selectedOptions.map((option) => option.value));
                  }}
                  classNamePrefix={
                    errors.exam_references ? "is-invalid" : "select"
                  }
                />
              );
            }}
          />
          {errors.exam_references && (
            <div className="invalid-feedback d-block">
              {errors.exam_references.message}
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Question Type:</label>
          <Controller
            name="question_type"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`form-control form-control-sm ${
                  errors.question_type ? "is-invalid" : ""
                }`}
              >
                <option value="">-- Select Question Type --</option>
                {dropdownData.questionTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.question_type && (
            <div className="invalid-feedback">
              {errors.question_type.message}
            </div>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Topic:</label>
          <Controller
            name="topic"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`form-control form-control-sm ${
                  errors.topic ? "is-invalid" : ""
                }`}
              >
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
      </div>

      {/* Explanations */}
      <div className="row mb-3">
        <div className="col-12">
          <h5>Explanations</h5>
          {explanations.map((explanation, index) => (
            <div key={explanation.level} className="card mb-3">
              <div className="card-body">
                <h6 className="card-title">{explanation.level} Level</h6>
                <div className="mb-3">
                  <label className="form-label">Explanation Text:</label>
                  <textarea
                    className="form-control form-control-sm"
                    value={explanation.text}
                    onChange={(e) =>
                      handleExplanationChange(index, "text", e.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Video (optional):</label>
                  <div className="input-group">
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept="video/*"
                      // onChange={(e) =>
                      //   // handleVideoUpload(index, e.target.files[0])
                      // }
                    />
                    {explanation.video && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() =>
                          handleExplanationChange(index, "video", null)
                        }
                      >
                        Remove Video
                      </button>
                    )}
                  </div>
                  {explanation.video && (
                    <small className="text-muted">
                      Video uploaded: {explanation.video}
                    </small>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Create Question
          </button>
        </div>
      </div>
    </form>
  );
});

export default UniversityQuestionForm;
