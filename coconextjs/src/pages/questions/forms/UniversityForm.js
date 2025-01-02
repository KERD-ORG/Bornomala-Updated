// UniversityForm.jsx
import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  fetchEducationalOrganizations,
  fetchQuestionLevels,
  fetchTargetGroups,
} from "@/utils/apiService";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";

// Optional translation hook; replace or remove if you don't need i18n
const useTranslation = () => ({ t: (x) => x });

const MAX_QUESTIONS = 10;
const MAX_OPTIONS = 8;

// validationSchema.js
import * as yup from "yup";

export const questionSchema = yup.object().shape({
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

  question_topic: yup.number().nullable(),
  question_subtopic: yup.number().nullable(),
  question_subsubtopic: yup.string().nullable(),

  explanation: yup.string().nullable(),

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

  correct_answer: yup
    .mixed()
    .when("question_type", {
      is: "single-select",
      then: yup
        .number()
        .typeError("Correct answer must be a number")
        .required("Correct answer is required for single-select MCQ")
        .min(1, "Must be at least 1")
        .max(MAX_OPTIONS, `Cannot exceed ${MAX_OPTIONS}`),
    })
    .when("question_type", {
      is: "multiple-select",
      then: yup
        .string()
        .required("Correct answers are required for multiple-select MCQ"),
    })
    .when("question_type", {
      is: "true-false",
      then: yup.boolean().required("Correct answer is required for True/False"),
    })
    .when("question_type", {
      is: (val) => ["descriptive", "short-answer", "fill-blanks"].includes(val),
      then: yup
        .string()
        .required("Correct answer is required for this question type"),
      otherwise: yup.mixed().nullable().notRequired(),
    }),

  fill_blank_answer: yup.string().when("question_type", {
    is: "fill-blanks",
    then: yup.string().required("Fill-in-the-blanks answer is required"),
    otherwise: yup.string().nullable().notRequired(),
  }),
});

export const mainSchema = yup.object().shape({
  question_level: yup
    .number()
    .typeError("Question Level must be selected")
    .required("Question Level is required"),
  target_organization: yup
    .number()
    .typeError("Target Organization must be selected")
    .required("Target Organization is required"),
  target_group: yup
    .number()
    .typeError("Target Group must be selected")
    .required("Target Group is required"),
  target_course: yup.string().required("Target Course is required"),

  question_count: yup
    .number()
    .typeError("How many questions? must be a number")
    .min(1, "At least 1 question")
    .max(MAX_QUESTIONS, `No more than ${MAX_QUESTIONS} questions`)
    .required("Number of questions is required"),

  questions: yup
    .array()
    .of(questionSchema)
    .required()
    .min(1, "At least one question is required"),
});

const defaultQuestion = {
  question_type: "descriptive", // "short-answer", "single-select", "multiple-select", "fill-blanks", "true-false"
  question_text: "",
  question_difficulty: "Very Easy",
  question_status: "New",
  question_topic: null, // Assuming null if not selected
  question_subtopic: null,
  question_subsubtopic: "",
  explanation: "",
  exam_references: "",

  // For MCQ
  option_count: 2,
  question_options: ["", ""],
  correct_answer: null,

  // For fill-blanks
  fill_blank_answer: "",
};

const UniversityForm = forwardRef(
  ({ initialData, onSubmit, onCancel, formMode, loading, setLoading }, ref) => {
    const {
      t,
      token,
      globalError,
      setGlobalError,
      router,
      successMessage,
      setSuccessMessage,
    } = useCommonForm();

    const {
      control,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(mainSchema),
      defaultValues: {
        question_level: initialData?.question_level || "",
        target_organization: initialData?.target_organization || "",
        target_group: initialData?.target_group || "",
        target_course: initialData?.target_course || "",
        question_count: initialData?.question_count || 1,
        questions: initialData?.questions || [defaultQuestion],
      },
      mode: "onSubmit",
    });

    const { fields, append, remove, replace } = useFieldArray({
      control,
      name: "questions",
    });

    const questionCount = watch("question_count");

    // Fetch dynamic select options
    const [questionLevels, setQuestionLevels] = React.useState([]);
    const [educationOrganizationList, setEducationalOrganizationList] =
      React.useState([]);
    const [targetGroups, setTargetGroups] = React.useState([]);

    useEffect(() => {
      if (token) {
        fetchQuestionLevels(
          token,
          router.locale || "en",
          setGlobalError,
          setSuccessMessage,
          setQuestionLevels
        );
        fetchEducationalOrganizations(
          token,
          router.locale || "en",
          setGlobalError,
          setSuccessMessage,
          setEducationalOrganizationList
        );
        fetchTargetGroups(
          token,
          router.locale || "en",
          setGlobalError,
          setSuccessMessage,
          setTargetGroups
        );
      }
    }, [token, router.locale, setGlobalError, setSuccessMessage]);

    // Synchronize the number of questions with question_count
    useEffect(() => {
      const currentCount = fields.length;
      const desiredCount = questionCount;

      if (desiredCount > currentCount) {
        for (let i = currentCount; i < desiredCount; i++) {
          append(JSON.parse(JSON.stringify(defaultQuestion)));
        }
      } else if (desiredCount < currentCount) {
        for (let i = currentCount; i > desiredCount; i--) {
          remove(i - 1);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionCount, append, remove]);

    // Handle form reset when initialData changes
    useEffect(() => {
      if (initialData) {
        reset({
          question_level: initialData.question_level || "",
          target_organization: initialData.target_organization || "",
          target_group: initialData.target_group || "",
          target_course: initialData.target_course || "",
          question_count: initialData.question_count || 1,
          questions: initialData.questions.length
            ? initialData.questions
            : [defaultQuestion],
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, reset]);

    useImperativeHandle(ref, () => ({
      handleCancelClick: () => {
        reset({
          question_level: "",
          target_organization: "",
          target_group: "",
          target_course: "",
          question_count: 1,
          questions: [defaultQuestion],
        });
        onCancel();
      },
    }));

    const onSubmitForm = async (data) => {
      setGlobalError("");
      try {
        const url =
          formMode === "create" || formMode === "clone"
            ? "/api/questions/"
            : `/api/questions/${initialData.id}/`;
        const method =
          formMode === "create" || formMode === "clone" ? "POST" : "PUT";

        setLoading(true);
        const response = await executeAjaxOperationStandard({
          url: url,
          method: method,
          token,
          data: data,
          locale: router.locale || "en",
        });

        if (
          response.status >=
            parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START) &&
          response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END)
        ) {
          // Handle successful submission
          onSubmit(
            response.data.message || "Form submitted successfully.",
            true
          );
          reset({
            question_level: "",
            target_organization: "",
            target_group: "",
            target_course: "",
            question_count: 1,
            questions: [defaultQuestion],
          });
        } else {
          if (response.details) {
            Object.keys(response.details).forEach((field) => {
              // Assuming response.details[field] is an array of error messages
              setError(field, {
                type: "server",
                message: response.details[field][0],
              });
            });
          }
          setGlobalError(response.message || "Submission failed.");
          setSuccessMessage("");
        }
      } catch (error) {
        let errorMessage = "An error occurred while submitting the form.";
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
        {globalError && (
          <div className="alert alert-danger mt-3" role="alert">
            {globalError}
          </div>
        )}

        {/* Row 1: Question Level & Target Organization */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Question Level")}</label>
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
                  <option value="">{t("-- Select --")}</option>
                  {questionLevels.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.name}
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
            <label className="form-label">{t("Target Organization")}</label>
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
                  <option value="">{t("-- Select --")}</option>
                  {educationOrganizationList.map((val) => (
                    <option value={val.id} key={val.id}>
                      {val.name}
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

        {/* Row 2: Target Group & Target Course */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Target Group")}</label>
            <Controller
              name="target_group"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`form-control ${
                    errors.target_group ? "is-invalid" : ""
                  }`}
                >
                  <option value="">{t("-- Select --")}</option>
                  {targetGroups.map((val) => (
                    <option value={val.id} key={val.id}>
                      {val.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.target_group && (
              <div className="invalid-feedback">
                {errors.target_group.message}
              </div>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">{t("Target Course/Subject")}</label>
            <Controller
              name="target_course"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`form-control ${
                    errors.target_course ? "is-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.target_course && (
              <div className="invalid-feedback">
                {errors.target_course.message}
              </div>
            )}
          </div>
        </div>

        {/* How many questions? */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>{t("How many questions? (1-10)")}</label>
            <Controller
              name="question_count"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min={1}
                  max={MAX_QUESTIONS}
                  className={`form-control ${
                    errors.question_count ? "is-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.question_count && (
              <div className="invalid-feedback">
                {errors.question_count.message}
              </div>
            )}
          </div>
        </div>

        {/* Render each question */}
        {fields.map((item, qIndex) => {
          const questionType = watch(`questions.${qIndex}.question_type`);
          const questionStatus = watch(`questions.${qIndex}.question_status`);

          return (
            <div key={item.id} className="border p-3 mb-4">
              <h5>
                {t("Question")} #{qIndex + 1}
              </h5>

              {/* Question Type */}
              <div className="mb-3">
                <label>{t("Question Type")}</label>
                <Controller
                  name={`questions.${qIndex}.question_type`}
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`form-control ${
                        errors.questions?.[qIndex]?.question_type
                          ? "is-invalid"
                          : ""
                      }`}
                    >
                      <option value="descriptive">
                        {t("Descriptive/Essay")}
                      </option>
                      <option value="short-answer">{t("Short Answer")}</option>
                      <option value="single-select">
                        {t("Single-Select MCQ")}
                      </option>
                      <option value="multiple-select">
                        {t("Multiple-Select MCQ")}
                      </option>
                      <option value="fill-blanks">
                        {t("Fill-in-the-Blanks")}
                      </option>
                      <option value="true-false">{t("True/False")}</option>
                    </select>
                  )}
                />
                {errors.questions?.[qIndex]?.question_type && (
                  <div className="invalid-feedback">
                    {errors.questions[qIndex].question_type.message}
                  </div>
                )}
              </div>

              {/* Difficulty & Status */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>{t("Difficulty")}</label>
                  <Controller
                    name={`questions.${qIndex}.question_difficulty`}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-control ${
                          errors.questions?.[qIndex]?.question_difficulty
                            ? "is-invalid"
                            : ""
                        }`}
                      >
                        <option value="Very Easy">{t("Very Easy")}</option>
                        <option value="Easy">{t("Easy")}</option>
                        <option value="Moderate">{t("Moderate")}</option>
                        <option value="Difficult">{t("Difficult")}</option>
                        <option value="Very Difficult">
                          {t("Very Difficult")}
                        </option>
                      </select>
                    )}
                  />
                  {errors.questions?.[qIndex]?.question_difficulty && (
                    <div className="invalid-feedback">
                      {errors.questions[qIndex].question_difficulty.message}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label>{t("Question Status")}</label>
                  <Controller
                    name={`questions.${qIndex}.question_status`}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-control ${
                          errors.questions?.[qIndex]?.question_status
                            ? "is-invalid"
                            : ""
                        }`}
                      >
                        <option value="New">{t("New")}</option>
                        <option value="Reused">{t("Reused")}</option>
                      </select>
                    )}
                  />
                  {errors.questions?.[qIndex]?.question_status && (
                    <div className="invalid-feedback">
                      {errors.questions[qIndex].question_status.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-3">
                <label>{t("Question Text")}</label>
                <Controller
                  name={`questions.${qIndex}.question_text`}
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={2}
                      className={`form-control ${
                        errors.questions?.[qIndex]?.question_text
                          ? "is-invalid"
                          : ""
                      }`}
                    />
                  )}
                />
                {errors.questions?.[qIndex]?.question_text && (
                  <div className="invalid-feedback">
                    {errors.questions[qIndex].question_text.message}
                  </div>
                )}
              </div>

              {/* Correct Answer for Descriptive and Short-Answer */}
              {["descriptive", "short-answer"].includes(questionType) && (
                <div className="mb-3">
                  <label>{t("Correct Answer")}</label>
                  <Controller
                    name={`questions.${qIndex}.correct_answer`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={2}
                        className={`form-control ${
                          errors.questions?.[qIndex]?.correct_answer
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                    )}
                  />
                  {errors.questions?.[qIndex]?.correct_answer && (
                    <div className="invalid-feedback">
                      {errors.questions[qIndex].correct_answer.message}
                    </div>
                  )}
                </div>
              )}

              {/* Fill-in-the-Blanks Answer */}
              {questionType === "fill-blanks" && (
                <div className="mb-3">
                  <label>{t("Correct Answer for Blank")}</label>
                  <Controller
                    name={`questions.${qIndex}.fill_blank_answer`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className={`form-control ${
                          errors.questions?.[qIndex]?.fill_blank_answer
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                    )}
                  />
                  {errors.questions?.[qIndex]?.fill_blank_answer && (
                    <div className="invalid-feedback">
                      {errors.questions[qIndex].fill_blank_answer.message}
                    </div>
                  )}
                </div>
              )}

              {/* MCQ Fields */}
              {(questionType === "single-select" ||
                questionType === "multiple-select") && (
                <>
                  <div className="mb-3">
                    <label>{t("How many options? (2-8)")}</label>
                    <Controller
                      name={`questions.${qIndex}.option_count`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min={2}
                          max={MAX_OPTIONS}
                          className={`form-control ${
                            errors.questions?.[qIndex]?.option_count
                              ? "is-invalid"
                              : ""
                          }`}
                        />
                      )}
                    />
                    {errors.questions?.[qIndex]?.option_count && (
                      <div className="invalid-feedback">
                        {errors.questions[qIndex].option_count.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label>{t("Options")}</label>
                    {fields[qIndex].question_options.map((option, optIndex) => (
                      <div key={optIndex} className="input-group mb-2">
                        <span className="input-group-text">
                          {t(`Option ${optIndex + 1}`)}
                        </span>
                        <Controller
                          name={`questions.${qIndex}.question_options.${optIndex}`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control ${
                                errors.questions?.[qIndex]?.question_options?.[
                                  optIndex
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                            />
                          )}
                        />
                        {errors.questions?.[qIndex]?.question_options?.[
                          optIndex
                        ] && (
                          <div className="invalid-feedback">
                            {
                              errors.questions[qIndex].question_options[
                                optIndex
                              ].message
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer for Single-Select */}
                  {questionType === "single-select" && (
                    <div className="mb-3">
                      <label>{t("Correct Answer (option #)")}</label>
                      <Controller
                        name={`questions.${qIndex}.correct_answer`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min={1}
                            max={MAX_OPTIONS}
                            className={`form-control ${
                              errors.questions?.[qIndex]?.correct_answer
                                ? "is-invalid"
                                : ""
                            }`}
                          />
                        )}
                      />
                      {errors.questions?.[qIndex]?.correct_answer && (
                        <div className="invalid-feedback">
                          {errors.questions[qIndex].correct_answer.message}
                        </div>
                      )}
                      <small className="form-text text-muted">
                        {t(
                          "For single-select, enter the option number (1..N)."
                        )}
                      </small>
                    </div>
                  )}

                  {/* Correct Answer for Multiple-Select */}
                  {questionType === "multiple-select" && (
                    <div className="mb-3">
                      <label>{t("Correct Answers (e.g. 1,3)")}</label>
                      <Controller
                        name={`questions.${qIndex}.correct_answer`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className={`form-control ${
                              errors.questions?.[qIndex]?.correct_answer
                                ? "is-invalid"
                                : ""
                            }`}
                            placeholder="e.g., 1,3"
                          />
                        )}
                      />
                      {errors.questions?.[qIndex]?.correct_answer && (
                        <div className="invalid-feedback">
                          {errors.questions[qIndex].correct_answer.message}
                        </div>
                      )}
                      <small className="form-text text-muted">
                        {t(
                          "For multiple-select, specify indices separated by commas."
                        )}
                      </small>
                    </div>
                  )}
                </>
              )}

              {/* True/False Correct Answer */}
              {questionType === "true-false" && (
                <div className="mb-3">
                  <label>{t("Correct Answer")}: </label>
                  <Controller
                    name={`questions.${qIndex}.correct_answer`}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-control ${
                          errors.questions?.[qIndex]?.correct_answer
                            ? "is-invalid"
                            : ""
                        }`}
                        value={field.value === true ? "true" : "false"}
                        onChange={(e) => {
                          const value = e.target.value === "true";
                          field.onChange(value);
                        }}
                      >
                        <option value="true">{t("True")}</option>
                        <option value="false">{t("False")}</option>
                      </select>
                    )}
                  />
                  {errors.questions?.[qIndex]?.correct_answer && (
                    <div className="invalid-feedback">
                      {errors.questions[qIndex].correct_answer.message}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div className="mb-3">
                <label>{t("Explanation")}</label>
                <Controller
                  name={`questions.${qIndex}.explanation`}
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={2}
                      className={`form-control ${
                        errors.questions?.[qIndex]?.explanation
                          ? "is-invalid"
                          : ""
                      }`}
                    />
                  )}
                />
                {errors.questions?.[qIndex]?.explanation && (
                  <div className="invalid-feedback">
                    {errors.questions[qIndex].explanation.message}
                  </div>
                )}
              </div>

              {/* Exam References - Only if Reused */}
              {questionStatus === "Reused" && (
                <div className="mb-3">
                  <label>{t("Exam References")}</label>
                  <Controller
                    name={`questions.${qIndex}.exam_references`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={2}
                        className={`form-control ${
                          errors.questions?.[qIndex]?.exam_references
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                    )}
                  />
                  {errors.questions?.[qIndex]?.exam_references && (
                    <div className="invalid-feedback">
                      {errors.questions[qIndex].exam_references.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={() =>
              reset({
                question_level: "",
                target_organization: "",
                target_group: "",
                target_course: "",
                question_count: 1,
                questions: [defaultQuestion],
              })
            }
            disabled={loading}
          >
            {t("Cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {t("Save")}
          </button>
        </div>
      </form>
    );
  }
);

UniversityForm.propTypes = {
  initialData: PropTypes.shape({
    question_level: PropTypes.number,
    target_organization: PropTypes.number,
    target_group: PropTypes.number,
    target_course: PropTypes.string,
    question_count: PropTypes.number,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
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
        question_topic: PropTypes.number,
        question_subtopic: PropTypes.number,
        question_subsubtopic: PropTypes.string,
        explanation: PropTypes.string,
        exam_references: PropTypes.string,
        option_count: PropTypes.number,
        question_options: PropTypes.arrayOf(PropTypes.string),
        correct_answer: PropTypes.any, // number, string, boolean
        fill_blank_answer: PropTypes.string,
      })
    ),
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  formMode: PropTypes.oneOf(["create", "edit", "clone"]),
  loading: PropTypes.bool,
  setLoading: PropTypes.func,
};

UniversityForm.defaultProps = {
  initialData: null,
  formMode: "create",
  loading: false,
  setLoading: () => {},
};

export default UniversityForm;
