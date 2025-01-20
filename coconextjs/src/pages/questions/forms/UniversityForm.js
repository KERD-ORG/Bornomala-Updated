import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  FormProvider,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Select from "react-select";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import axios from "axios";

const MAX_OPTIONS = 8;
const explanationLevels = ["Preliminary", "Intermediate", "Advanced"];

const defaultValues = {
  target_organization: "",
  question_level: "",
};

const questionSchema = yup.object().shape({
  question_text: yup.string(), //required("Question Text is required"),
  correct_answer: yup.mixed().when("question_type", (question_type, schema) => {
    switch (question_type[0]) {
      case "MCQ_SINGLE":
        return yup
          .number()
          .typeError("Select a valid answer")
          .required("Select one correct answer");
      case "MCQ_MULTI":
        return yup
          .array()
          .of(yup.number().typeError("Each answer must be a number"))
          .min(1, "Select at least one correct answer");
      case "NUMERICAL":
        return yup
          .number()
          .typeError("Correct Answer must be a number")
          .required("Correct Answer is required");
      case "MATCHING":
        return yup.string().required("Correct answer mapping is required");
      default:
        return yup.string().notRequired();
    }
  }),
  ordering_sequence: yup.array().when("question_type", {
    is: (val) => val === "ORDERING",
    then: () =>
      yup
        .array()
        .transform((value) =>
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value
        )
        .of(yup.string().required("Ordering items cannot be empty"))
        .min(2, "At least two items are required"),
    otherwise: () => yup.array().notRequired(),
  }),
  target_subject: yup.string().required("Subject is required"),
  exam_references: yup.array(),
  question_type: yup.string().required("Question Type is required"),
  topic: yup.string().required("Topic is required"),
  sub_topic: yup.string(),
  difficulty_level: yup.string().required("Difficulty Level is required"),
  options: yup.array().when("question_type", {
    is: (val) => ["MCQ_SINGLE", "MCQ_MULTI"].includes(val),
    then: () =>
      yup
        .array()
        .of(
          yup.object({
            option_text: yup.string().required("Option text cannot be empty"),
          })
        )
        .min(2, "At least two options are required"),
    otherwise: () => yup.array().notRequired(),
  }),
  options_column_a: yup.array().when("question_type", {
    is: (val) => val == "MATCHING",
    then: () =>
      yup
        .array()
        .transform((value) =>
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value
        )
        .of(yup.string().required())
        .min(1, "At least one option required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  options_column_b: yup.array().when("question_type", {
    is: (val) => val == "MATCHING",
    then: () =>
      yup
        .array()
        .transform((value) =>
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value
        )
        .of(yup.string().required())
        .min(1, "At least one option required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  image_url: yup.string().when("question_type", {
    is: (val) => val === "IMAGE",
    then: () => yup.string().required("Image upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  diagram_url: yup.string().when("question_type", {
    is: (val) => val === "DIAGRAM",
    then: () => yup.string().required("Diagram upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  audio_url: yup.string().when("question_type", {
    is: (val) => val === "AUDIO",
    then: () => yup.string().required("Audio upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  target_group: yup.string().required("Target Group is required"),
});

const mainSchema = yup.object().shape({
  target_organization: yup.string().required("Organization is required"),
  question_level: yup.string().required("Question Level is required"),
  questions: yup.array().of(questionSchema),
});

const UniversityQuestionForm = forwardRef(
  ({ loading, setLoading, onCancel, onSubmit }, ref) => {
    const { token, globalError, setGlobalError } = useCommonForm();
    const [modalShow, setModalShow] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    const handleEditQuestion = (index) => {
      setEditingIndex(index);
      setModalShow(true);
    };

    const method = useForm({
      resolver: yupResolver(mainSchema),
      defaultValues,
    });
    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = method;

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
      subSubTopics: [],
    });

    const {
      fields: questionFields,
      append: appendQuestion,
      remove: removeQuestion,
    } = useFieldArray({
      control,
      name: "questions",
    });

    const handleModalSubmit = (formData) => {
      if (editingIndex !== null) {
        removeQuestion(editingIndex);
        appendQuestion(formData, {
          shouldFocus: false,
          focusName: `questions.${editingIndex}`,
        });
      } else {
        appendQuestion(formData);
      }
      setModalShow(false);
      setEditingIndex(null);
    };

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
          subTopics: "api/subtopics",
          subSubTopics: "api/subsubtopics",
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
              const nestedError = extractDetailedErrorMessage(
                item,
                currentPath
              );
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

    const onSubmitForm = async (data) => {
      // console.log(data);
      // return;
      // setLoading(true);
      try {
        const promises = [];
        for (let i = 0; i < data.questions.length; i++) {
          const formData = { ...data.questions[i] };
          formData.explanations = formData.explanations.map((val, ind) => ({
            ...val,
            level: explanationLevels[ind],
          }));

          // Append top-level fields to each question's form data

          formData["target_organization"] = data.target_organization;
          formData["question_level"] = data.question_level;

          formData.options = formData.options.map((val) => val.option_text);
          let type = formData.question_type;

          delete formData["question_type"];

          // Create a promise for each API call and push it to the array
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
        if (promises.length === 0) {
          setGlobalError("You have to add at least 1 question");
          return;
        }

        // Execute all promises concurrently. If any single request fails, Promise.all will reject.
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

        // Process results if needed
        console.log("All questions submitted successfully:", results);
      } catch (error) {
        // If one fails, all fail. Handle the error here.
        console.error("An error occurred during question submission:", error);
        let errorMessage = "An error occurred while submitting the form.";
        if (error.message) {
          errorMessage = error.message;
        }
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          errorMessage = error.response.data.error;
        }
        setGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    return (
      <FormProvider {...method}>
        <form
          onSubmit={handleSubmit(onSubmitForm)}
          className="container-fluid p-3"
        >
          {globalError && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              <strong>{globalError}</strong>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  setGlobalError("");
                }}
              ></button>
            </div>
          )}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label fw-semibold">
                  Target Organization
                </label>
                <Controller
                  name="target_organization"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`form-select ${
                        errors.target_organization ? "is-invalid" : ""
                      }`}
                    >
                      <option value="">Select Organization</option>
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

            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label fw-semibold">Question Level</label>
                <Controller
                  name="question_level"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`form-select ${
                        errors.question_level ? "is-invalid" : ""
                      }`}
                    >
                      <option value="">Select Question Level</option>
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
          </div>

          <div className="question-list">
            {questionFields.length === 0 ? (
              <p className="text-muted">No questions added yet.</p>
            ) : (
              questionFields.map((question, index) => (
                <div key={question.id} className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Question {index + 1}</h5>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEditQuestion(index)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeQuestion(index)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="card-text text-muted mb-0">
                      {question.question_text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mb-4">
            <button
              type="button"
              className="btn btn-secondary d-flex align-items-center gap-2"
              onClick={() => {
                setModalShow(true);
                setEditingIndex(null);
              }}
            >
              <i className="bi bi-plus-lg"></i>
              Add Question
            </button>
          </div>

          <QuestionModal
            show={modalShow}
            onHide={() => setModalShow(false)}
            onSubmit={handleModalSubmit}
            dropdownData={dropdownData}
            initialData={
              editingIndex !== null ? questionFields[editingIndex] : null
            }
          />

          <div className="row mt-4">
            <div className="col-12">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 w-md-auto"
              >
                Create Questions
              </button>
            </div>
          </div>
        </form>
      </FormProvider>
    );
  }
);

export const QuestionModal = ({
  show,
  onHide,
  onSubmit,
  dropdownData,
  initialData,
}) => {
  const { token, setGlobalError } = useCommonForm();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(questionSchema),
    defaultValues: initialData || {
      question_text: "",
      target_group: "",
      correct_answer: "",
      target_subject: "",
      exam_references: [],
      question_type: "",
      topic: "",
      sub_topic: "",
      difficulty_level: "",
      options: [{ option_text: "" }, { option_text: "" }],
      explanations: [],
      sub_sub_topic: "",
    },
  });

  const topic = watch("topic");
  const subTopic = watch("sub_topic");
  const question_type = watch("question_type");

  useEffect(() => {
    if (show && !initialData) {
      reset({
        question_text: "",
        correct_answer: "",
        target_subject: "",
        exam_references: [],
        question_type: "",
        topic: "",
        sub_topic: "",
        difficulty_level: "",
        options: [{ option_text: "" }, { option_text: "" }],
        explanations: [],
        sub_sub_topic: "",
      });
    }
  }, [show, initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "explanations",
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const handleVideoUpload = async (file, index) => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/?filename=${file.name}`,
        file,
        {
          headers: {
            "Content-Type": file.type,
            Authorization: `Token ${token}`,
          },
        }
      );

      setValue(`explanations.${index}.video`, response.data.media_link);
      setValue(`explanations.${index}.filename`, file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
      setGlobalError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCorrectAnswerField = (questionType) => {
    switch (questionType) {
      case "FILL_BLANK":
      case "NUMERICAL":
        return (
          <>
            <Form.Label>Answer</Form.Label>
            <Controller
              name="correct_answer"
              control={control}
              render={({ field }) => (
                <Form.Control
                  type={questionType === "NUMERICAL" ? "number" : "text"}
                  isInvalid={!!errors.correct_answer}
                  {...field}
                />
              )}
            />
          </>
        );
      case "TRUE_FALSE":
        return (
          <>
            <Form.Label>Correct Answer:</Form.Label>
            <Controller
              name="correct_answer"
              control={control}
              render={({ field }) => (
                <Form.Select isInvalid={!!errors.correct_answer} {...field}>
                  <option value="">-- Select --</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                  <option value="Not-given">Not-given</option>
                </Form.Select>
              )}
            />
          </>
        );
      case "ASSERTION_REASON":
      case "CASE_STUDY":
      case "DESCRIPTIVE":
      case "CODE":
        return (
          <>
            <Form.Label>Answer:</Form.Label>
            <Controller
              name="correct_answer"
              control={control}
              render={({ field }) => (
                <Form.Control
                  as="textarea"
                  rows={4}
                  isInvalid={!!errors.correct_answer}
                  {...field}
                />
              )}
            />
          </>
        );
      case "NUMERICAL":
        return (
          <>
            <Form.Label>Correct Answer:</Form.Label>
            <Controller
              name="correct_answer"
              control={control}
              render={({ field }) => (
                <Form.Control
                  type="number"
                  isInvalid={!!errors.correct_answer}
                  {...field}
                />
              )}
            />
          </>
        );
      case "ORDERING":
        return (
          <>
            <Form.Label>Correct Answer:</Form.Label>
            <Controller
              name="ordering_sequence"
              control={control}
              render={({ field }) => (
                <Form.Control
                  as="textarea"
                  placeholder="Enter items in order, separated by commas"
                  rows={4}
                  isInvalid={!!errors.ordering_sequence}
                  {...field}
                />
              )}
            />
          </>
        );
      case "MATCHING":
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Options Column A:</Form.Label>
              <Controller
                name="options_column_a"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Enter options separated by commas"
                    isInvalid={!!errors.options_column_a}
                    {...field}
                  />
                )}
              />
              {errors.options_column_a && (
                <Form.Control.Feedback type="invalid">
                  {errors.options_column_a.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Options Column B:</Form.Label>
              <Controller
                name="options_column_b"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Enter options separated by commas"
                    isInvalid={!!errors.options_column_b}
                    {...field}
                  />
                )}
              />
              {errors.options_column_b && (
                <Form.Control.Feedback type="invalid">
                  {errors.options_column_b.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Correct Answer Mapping:</Form.Label>
              <Controller
                name="correct_answer"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="e.g., [1, 2], [3, 4]"
                    isInvalid={!!errors.correct_answer}
                    {...field}
                  />
                )}
              />
            </Form.Group>
          </>
        );
      case "DIAGRAM":
      case "IMAGE":
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>
                Upload {questionType === "DIAGRAM" ? "Diagram" : "Image"}:
              </Form.Label>
              <Controller
                name={questionType === "DIAGRAM" ? "diagram_url" : "image_url"} // field to store the image URL
                control={control}
                render={({ field }) => {
                  // If an image URL already exists, display the image preview and a change option
                  if (field.value) {
                    return (
                      <div>
                        <div className="mb-2">
                          <img
                            src={field.value}
                            alt="Uploaded"
                            style={{ maxWidth: "100%", maxHeight: "300px" }}
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => field.onChange("")}
                        >
                          Change Image
                        </Button>
                      </div>
                    );
                  }
                  // Otherwise, display the file input for uploading a new image
                  return (
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setLoading(true);
                          try {
                            const response = await axios.put(
                              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/?filename=${file.name}`,
                              file,
                              {
                                headers: {
                                  "Content-Type": file.type,
                                  Authorization: `Token ${token}`,
                                },
                              }
                            );
                            // Set the returned media link (image URL) to the field value
                            field.onChange(response.data.media_link);
                          } catch (error) {
                            console.error("Error uploading image:", error);
                            setGlobalError(
                              error.response?.data?.message || error.message
                            );
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      isInvalid={
                        !!errors[
                          questionType === "DIAGRAM"
                            ? "diagram_url"
                            : "image_url"
                        ]
                      }
                    />
                  );
                }}
              />
              {errors[
                questionType === "DIAGRAM" ? "diagram_url" : "image_url"
              ] && (
                <Form.Control.Feedback type="invalid">
                  {
                    errors[
                      questionType === "DIAGRAM" ? "diagram_url" : "image_url"
                    ].message
                  }
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Correct Answer:</Form.Label>
              <Controller
                name="correct_answer"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={4}
                    isInvalid={!!errors.correct_answer}
                    {...field}
                  />
                )}
              />
            </Form.Group>
          </>
        );
      case "AUDIO_VIDEO":
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Upload Audio/Video:</Form.Label>
              <Controller
                name="audio_url" // still using the same field name
                control={control}
                render={({ field }) => {
                  // If we already have a URL, show a preview and "Change" button.
                  if (field.value) {
                    return (
                      <div className="d-align-center gap-2">
                        <a href={field.value}>Click to see media file</a>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Clear the field value and reset mediaType so user can upload new file
                            field.onChange("");
                            setMediaType("");
                          }}
                        >
                          Change Media
                        </Button>
                      </div>
                    );
                  }

                  // Otherwise, render the file input to upload audio or video
                  return (
                    <Form.Control
                      type="file"
                      accept="audio/*,video/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setLoading(true);
                          try {
                            // Same API logic (PUT request)
                            const response = await axios.put(
                              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/?filename=${file.name}`,
                              file,
                              {
                                headers: {
                                  "Content-Type": file.type,
                                  Authorization: `Token ${token}`,
                                },
                              }
                            );

                            // Store the returned media link in the form
                            field.onChange(response.data.media_link);
                          } catch (error) {
                            console.error("Error uploading media:", error);
                            setGlobalError(
                              error.response?.data?.message || error.message
                            );
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      isInvalid={!!errors.audio_url}
                    />
                  );
                }}
              />
              {errors.audio_url && (
                <Form.Control.Feedback type="invalid">
                  {errors.audio_url.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Correct Answer:</Form.Label>
              <Controller
                name="correct_answer"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={4}
                    isInvalid={!!errors.correct_answer}
                    {...field}
                  />
                )}
              />
            </Form.Group>
          </>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    console.log(errors);
  }, [errors]);

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {initialData ? "Edit Question" : "Add New Question"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>Target Group:</Form.Label>
              <Controller
                name="target_group"
                control={control}
                render={({ field }) => (
                  <Form.Select isInvalid={!!errors.target_group} {...field}>
                    <option value="">-- Select Target Group --</option>
                    {dropdownData.targetGroups.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.target_group?.message}
              </Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label>Subject:</Form.Label>
              <Controller
                name="target_subject"
                control={control}
                render={({ field }) => (
                  <Form.Select isInvalid={!!errors.target_subject} {...field}>
                    <option value="">-- Select Subject --</option>
                    {dropdownData.subjects.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.target_subject?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId={`topic`}>
                <Form.Label>Topic:</Form.Label>
                <Controller
                  name={`topic`}
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors?.topic}>
                      <option value="">-- Select Topic --</option>
                      {dropdownData.topics.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.topic?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId={`sub_topic`}>
                <Form.Label>Subtopic:</Form.Label>
                <Controller
                  name={`sub_topic`}
                  control={control}
                  disabled={!topic}
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors?.sub_topic}>
                      <option value="">-- Select Subtopic --</option>
                      {dropdownData.subTopics
                        .filter((val) => val.topic == topic)
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.sub_topic?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId={`sub_sub_topic1`}>
                <Form.Label>Sub Sub Topic 1:</Form.Label>
                <Controller
                  name={`sub_sub_topic1`}
                  control={control}
                  disabled={!subTopic}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors?.sub_sub_topic1}
                    >
                      <option value="">-- Select Sub Subtopic --</option>
                      {dropdownData.subSubTopics
                        .filter((val) => val.sub_topic == subTopic)
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.sub_sub_topic1?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`sub_sub_topic2`}>
                <Form.Label>Sub Sub Topic 2:</Form.Label>
                <Controller
                  name={`sub_sub_topic2`}
                  control={control}
                  disabled={!subTopic}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors?.sub_sub_topic2}
                    >
                      <option value="">-- Select Sub Subtopic --</option>
                      {dropdownData.subSubTopics
                        .filter((val) => val.sub_topic == subTopic)
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.sub_sub_topic2?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`sub_sub_topic3`}>
                <Form.Label>Sub Sub Topic 3:</Form.Label>
                <Controller
                  name={`sub_sub_topic3`}
                  control={control}
                  disabled={!subTopic}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors?.sub_sub_topic3}
                    >
                      <option value="">-- Select Sub Subtopic --</option>
                      {dropdownData.subSubTopics
                        .filter((val) => val.sub_topic == subTopic)
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.sub_sub_topic3?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId={`difficulty_level`}>
                <Form.Label>Difficulty:</Form.Label>
                <Controller
                  name={`difficulty_level`}
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors?.difficulty_level}
                    >
                      <option value="">-- Select Difficulty --</option>
                      {dropdownData.difficultyLevels.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.difficulty_level?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Label>Exam References:</Form.Label>
              <Controller
                name="exam_references"
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
                        errors.exam_references ? "is-invalid" : "select"
                      }
                    />
                  );
                }}
              />
              {errors.exam_references && (
                <div className="invalid-feedback d-block">
                  {errors.exam_references?.message}
                </div>
              )}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Label>Question Type:</Form.Label>
              <Controller
                name="question_type"
                control={control}
                render={({ field }) => (
                  <Form.Select isInvalid={!!errors.question_type} {...field}>
                    <option value="">-- Select Question Type --</option>
                    {dropdownData.questionTypes.map((val) => (
                      <option key={val.id} value={val.name}>
                        {val.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.question_type?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>

          {question_type && (
            <>
              {[
                "MCQ_SINGLE",
                "MCQ_MULTI",
                "CODE",
                "DESCRIPTIVE",
                "FILL_BLANK",
                "NUMERICAL",
                "ORDERING",
                "TRUE_FALSE",
              ].includes(question_type) && (
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Question: </Form.Label>
                    <Controller
                      name="question_text"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          as="textarea"
                          rows={4}
                          isInvalid={!!errors.question_text}
                          {...field}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.question_text?.message}
                    </Form.Control.Feedback>
                  </Col>
                </Row>
              )}

              {question_type.includes("MCQ") && (
                <NestedMCQOptions
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              <Row className="mb-3">
                <Col>
                  {renderCorrectAnswerField(question_type)}
                  {errors.correct_answer && (
                    <Form.Text className="text-danger">
                      {errors.correct_answer.message}
                    </Form.Text>
                  )}
                  {errors.matching_pairs && (
                    <Form.Text className="text-danger">
                      {errors.matching_pairs.message}
                    </Form.Text>
                  )}
                  {errors.ordering_sequence && (
                    <Form.Text className="text-danger">
                      {errors.ordering_sequence.message}
                    </Form.Text>
                  )}
                </Col>
              </Row>
            </>
          )}

          {/* Continue adding other fields similarly using react-bootstrap components */}
          <Row className="">
            <Col>
              <h5>Explanations</h5>
            </Col>
          </Row>
          {fields.map((field, index) => {
            const filename = watch(`explanations.${index}.filename`);
            const video = watch(`explanations.${index}.video`);

            return (
              <div
                className="position-relative border rounded p-3 m-3 mt-0"
                key={field.id}
              >
                {/* Remove Explanation Icon */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => remove(index)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 2,
                    padding: "0.15rem 0.3rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <i className="bx bx-x"></i>{" "}
                  {/* Replace with your preferred icon */}
                </Button>

                {/* Explanation Text Input */}
                <Row className="mb-3">
                  <Col>
                    <Form.Label className="mb-2">
                      {explanationLevels[index]} Explanation:
                    </Form.Label>

                    <Controller
                      name={`explanations.${index}.text`}
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          as="textarea"
                          rows={3}
                          {...field}
                          isInvalid={!!errors?.explanations?.[index]?.text}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors?.explanations?.[index]?.text?.message}
                    </Form.Control.Feedback>
                  </Col>
                </Row>

                {/* Explanation Video Input */}
                <Row className="mb-3 align-items-center">
                  <Col md={4}>
                    <Form.Label className="mb-0">
                      Explanation Video (optional):
                    </Form.Label>
                  </Col>
                  <Col md={8}>
                    {video ? (
                      <div>
                        <a
                          href={video}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {filename || "View Uploaded Video"}
                        </a>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setValue(`explanations.${index}.video`, "")
                          }
                          className="ms-2"
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <Controller
                        name={`explanations.${index}.file`}
                        control={control}
                        render={({ field }) => (
                          <Form.Control
                            type="file"
                            disabled={loading}
                            onChange={(e) =>
                              handleVideoUpload(e.target.files[0], index)
                            }
                            isInvalid={!!errors?.explanations?.[index]?.video}
                          />
                        )}
                      />
                    )}
                    <Form.Control.Feedback type="invalid">
                      {errors?.explanations?.[index]?.video?.message}
                    </Form.Control.Feedback>
                  </Col>
                </Row>
              </div>
            );
          })}

          <Row>
            <Col>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({ text: "", file: null, video: "", filename: "" })
                }
                disabled={fields.length >= explanationLevels.length}
              >
                Add Explanation
              </Button>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSubmit(onSubmit)()}>
            {initialData ? "Save Changes" : "Add Question"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const NestedMCQOptions = ({ control, errors, watch, setValue }) => {
  const questionType = watch("question_type");

  // Use ?? instead of ||
  const correctAnswerValue =
    watch("correct_answer") ?? (questionType === "MCQ_MULTI" ? [] : null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const handleSetCorrectAnswer = (index) => {
    if (questionType === "MCQ_SINGLE") {
      setValue("correct_answer", index);
    } else if (questionType === "MCQ_MULTI") {
      let newAnswers = Array.isArray(correctAnswerValue)
        ? [...correctAnswerValue]
        : [];
      if (newAnswers.includes(index)) {
        // unselect if already in correct answers
        newAnswers = newAnswers.filter((i) => i !== index);
      } else {
        newAnswers.push(index);
      }
      setValue("correct_answer", newAnswers);
    }
  };

  const handleRemoveOption = (removeIndex) => {
    if (questionType === "MCQ_SINGLE") {
      if (correctAnswerValue === removeIndex) {
        // Removed the correct one
        setValue("correct_answer", null);
      } else if (correctAnswerValue > removeIndex) {
        // Shift if removed index is before current correct index
        setValue("correct_answer", correctAnswerValue - 1);
      }
    } else if (questionType === "MCQ_MULTI") {
      let newAnswers = Array.isArray(correctAnswerValue)
        ? [...correctAnswerValue]
        : [];
      // Remove that index if it's selected
      newAnswers = newAnswers.filter((idx) => idx !== removeIndex);
      // Shift anything above removeIndex
      newAnswers = newAnswers.map((idx) => (idx > removeIndex ? idx - 1 : idx));
      setValue("correct_answer", newAnswers);
    }

    remove(removeIndex);
  };

  const isOptionCorrect = (index) => {
    if (questionType === "MCQ_SINGLE") {
      return correctAnswerValue === index;
    }
    if (questionType === "MCQ_MULTI") {
      return (
        Array.isArray(correctAnswerValue) && correctAnswerValue.includes(index)
      );
    }
    return false;
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">MCQ Options:</label>

      {fields.map((field, oIndex) => {
        const selected = isOptionCorrect(oIndex);
        return (
          <div className="input-group mb-2" key={field.id}>
            {/* Option Text Input */}
            <Controller
              name={`options.${oIndex}.option_text`}
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={`form-control ${
                    errors?.options?.[oIndex]?.option_text ? "is-invalid" : ""
                  }`}
                  placeholder={`Option ${oIndex + 1}`}
                />
              )}
            />

            {/* If you only want to allow removal if length > 2 */}
            {fields.length > 2 && (
              <Button
                style={{ padding: "0.5rem 0.3rem" }}
                variant="danger"
                size="sm"
                onClick={() => handleRemoveOption(oIndex)}
              >
                <i className="bx bx-trash"></i>
              </Button>
            )}

            {/* Mark this option as correct */}
            <Button
              style={{ padding: "0.5rem 0.3rem" }}
              variant={selected ? "success" : "outline-secondary"}
              onClick={() => handleSetCorrectAnswer(oIndex)}
            >
              {selected ? (
                <i className="bx bxs-check-square"></i>
              ) : (
                <i className="bx bx-check-square"></i>
              )}
            </Button>

            {errors?.options?.[oIndex]?.option_text && (
              <div className="invalid-feedback">
                {errors.options[oIndex].option_text.message}
              </div>
            )}
          </div>
        );
      })}

      {/* Button to add a new MCQ option */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => append({ option_text: "" })}
        disabled={fields.length >= MAX_OPTIONS}
      >
        Add Option
      </Button>
    </div>
  );
};

export default UniversityQuestionForm;
