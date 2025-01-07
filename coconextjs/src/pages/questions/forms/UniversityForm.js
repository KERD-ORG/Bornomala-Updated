import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Select from "react-select";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";

const MAX_OPTIONS = 8;
const explanationLevels = ["Preliminary", "Intermediate", "Advanced"];

const defaultValues = {
  target_organization: "",
  question_level: "",
  number_of_questions: 1,
  questions: [
    {
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
    },
  ],
};

const questionSchema = yup.object().shape({
  // question_text: yup.string().required("Question Text is required"),
  // correct_answer: yup.string(),
  // target_subject: yup.string().required("Subject is required"),
  // exam_references: yup.array(),
  // question_type: yup.string().required("Question Type is required"),
  // topic: yup.string().required("Topic is required"),
  // sub_topic: yup.string(),
  // difficulty_level: yup.string().required("Difficulty Level is required"),
  // mcq_options: yup
  //   .array()
  //   .of(
  //     yup.object({
  //       option_text: yup.string().required("Option cannot be empty"),
  //     })
  //   )
  //   .min(2, "At least two options are required"),
});

const mainSchema = yup.object().shape({
  // target_organization: yup.string().required("Organization is required"),
  // question_level: yup.string().required("Question Level is required"),
  // number_of_questions: yup
  //   .number()
  //   .min(1)
  //   .max(10)
  //   .required("Number of questions is required"),
  // questions: yup.array().of(questionSchema),
});

const UniversityQuestionForm = forwardRef(({ onSubmitSuccess }, ref) => {
  const { token } = useCommonForm();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(mainSchema),
    defaultValues,
  });

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

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: "questions",
  });

  const numberOfQuestions = watch("number_of_questions");

  // Adjust questions array when number_of_questions changes
  useEffect(() => {
    const currentCount = questionFields.length;
    const desiredCount = numberOfQuestions;
    if (desiredCount > currentCount) {
      for (let i = currentCount; i < desiredCount; i++) {
        appendQuestion({
          question_text: "",
          correct_answer: "",
          target_subject: "",
          exam_references: [],
          question_type: "",
          topic: "",
          sub_topic: "",
          difficulty_level: "",
          mcq_options: [{ option_text: "" }, { option_text: "" }],
        });
      }
    } else if (desiredCount < currentCount) {
      for (let i = currentCount; i > desiredCount; i--) {
        removeQuestion(i - 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfQuestions]);

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
    console.log(data);
    try {
      const promises = [];
      for (let i = 0; i < data.number_of_questions; i++) {
        const formData = { ...data.questions[i] };

        // Append top-level fields to each question's form data
        formData["target_organization"] = data.target_organization;
        formData["question_level"] = data.question_level;

        // Create a promise for each API call and push it to the array
        const promise = executeAjaxOperationStandard({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_QUESTION,
          method: "post",
          data: JSON.stringify(formData),
          token,
        });

        promises.push(promise);
      }

      // Execute all promises concurrently. If any single request fails, Promise.all will reject.
      const results = await Promise.all(promises);
      window.location.reload();
      // Process results if needed
      console.log("All questions submitted successfully:", results);
    } catch (error) {
      // If one fails, all fail. Handle the error here.
      console.error("An error occurred during question submission:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      {/* Render dropdowns for organization and question level */}
      <div className="row mb-3">
        <div className="col-md-12">
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
      </div>
      <div className="row mb-3">
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
        <div className="col-md-6">
          <label className="form-label">Number of Questions (1-10):</label>
          <Controller
            name="number_of_questions"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="1"
                max="10"
                className="form-control"
              />
            )}
          />
          {errors.number_of_questions && (
            <div className="invalid-feedback d-block">
              {errors.number_of_questions.message}
            </div>
          )}
        </div>
      </div>

      {questionFields.map((question, qIndex) => (
        <div key={question.id} className="border p-3 mb-4">
          <h4>Question {qIndex + 1}</h4>
          <div className="row mb-3">
            <div className="col-12">
              <label className="form-label">Question Text:</label>
              <Controller
                name={`questions.${qIndex}.question_text`}
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.question_text
                        ? "is-invalid"
                        : ""
                    }`}
                    rows={4}
                  />
                )}
              />
              {errors?.questions?.[qIndex]?.question_text && (
                <div className="invalid-feedback">
                  {errors.questions[qIndex].question_text.message}
                </div>
              )}
            </div>
          </div>
          <NestedMCQOptions control={control} errors={errors} qIndex={qIndex} />

          <div className="row mb-3">
            <div className="col-12">
              <label className="form-label">Correct Answer:</label>
              <Controller
                name={`questions.${qIndex}.correct_answer`}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.correct_answer
                        ? "is-invalid"
                        : ""
                    }`}
                  />
                )}
              />
              {errors?.questions?.[qIndex]?.correct_answer && (
                <div className="invalid-feedback">
                  {errors?.questions?.[qIndex]?.correct_answer.message}
                </div>
              )}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Subject:</label>
              <Controller
                name={`questions.${qIndex}.target_subject`}
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.target_subject
                        ? "is-invalid"
                        : ""
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
              {errors?.questions?.[qIndex]?.target_subject && (
                <div className="invalid-feedback">
                  {errors.questions[qIndex].target_subject.message}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Exam References:</label>
              <Controller
                name={`questions.${qIndex}.exam_references`}
                control={control}
                render={({ field }) => {
                  const { onChange, value, ref } = field;
                  return (
                    <Select
                      inputRef={ref}
                      isMulti
                      options={dropdownData.examReferences}
                      value={dropdownData.examReferences.filter((option) =>
                        value?.includes(option.value)
                      )}
                      onChange={(selectedOptions) =>
                        onChange(selectedOptions.map((option) => option.value))
                      }
                      classNamePrefix={
                        errors?.questions?.[qIndex]?.exam_references
                          ? "is-invalid"
                          : "select"
                      }
                    />
                  );
                }}
              />
              {errors?.questions?.[qIndex]?.exam_references && (
                <div className="invalid-feedback d-block">
                  {errors.questions[qIndex].exam_references.message}
                </div>
              )}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Question Type:</label>
              <Controller
                name={`questions.${qIndex}.question_type`}
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.question_type
                        ? "is-invalid"
                        : ""
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
              {errors?.questions?.[qIndex]?.question_type && (
                <div className="invalid-feedback">
                  {errors.questions[qIndex].question_type.message}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Topic:</label>
              <Controller
                name={`questions.${qIndex}.topic`}
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.topic ? "is-invalid" : ""
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
              {errors?.questions?.[qIndex]?.topic && (
                <div className="invalid-feedback">
                  {errors.questions[qIndex].topic.message}
                </div>
              )}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Subtopic:</label>
              <Controller
                name={`questions.${qIndex}.sub_topic`}
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.sub_topic ? "is-invalid" : ""
                    }`}
                  >
                    <option value="">-- Select Subtopic --</option>
                    {dropdownData.subTopics.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors?.questions?.[qIndex]?.sub_topic && (
                <div className="invalid-feedback">
                  {errors.questions[qIndex].sub_topic.message}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Difficulty:</label>
              <Controller
                name={`questions.${qIndex}.difficulty_level`}
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`form-control ${
                      errors?.questions?.[qIndex]?.difficulty_level
                        ? "is-invalid"
                        : ""
                    }`}
                  >
                    <option value="">-- Select Difficulty --</option>
                    {dropdownData.difficultyLevels.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors?.questions?.[qIndex]?.difficulty_level && (
                <div className="invalid-feedback">
                  {errors.questions[qIndex].difficulty_level.message}
                </div>
              )}
            </div>
          </div>

          <NestedExplanations
            control={control}
            errors={errors}
            qIndex={qIndex}
          />
        </div>
      ))}

      <div className="row">
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Create Questions
          </button>
        </div>
      </div>
    </form>
  );
});

const NestedMCQOptions = ({ control, errors, qIndex }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${qIndex}.mcq_options`,
  });

  return (
    <div className="row mb-3">
      <div className="col-12">
        <label className="form-label">MCQ Options:</label>
        {fields.map((field, oIndex) => (
          <div key={field.id} className="input-group mb-2">
            <Controller
              name={`questions.${qIndex}.mcq_options.${oIndex}.option_text`}
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={`form-control ${
                    errors?.questions?.[qIndex]?.mcq_options?.[oIndex]
                      ?.option_text
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
    name: `questions.${qIndex}.explanations`,
  });

  return (
    <div className="mb-3">
      <label className="form-label">Explanations:</label>
      {fields.map((field, eIndex) => (
        <div key={field.id} className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">{field.level} Level Explanation</h6>
            <Controller
              name={`questions.${qIndex}.explanations.${eIndex}.text`}
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
                name={`questions.${qIndex}.explanations.${eIndex}.video`}
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

export default UniversityQuestionForm;
