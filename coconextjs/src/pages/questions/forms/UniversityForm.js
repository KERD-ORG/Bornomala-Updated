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
  // questions: [
  //   {
  //     question_text: "",
  //     correct_answer: "",
  //     target_subject: "",
  //     exam_references: [],
  //     question_type: "",
  //     topic: "",
  //     sub_topic: "",
  //     difficulty_level: "",
  //     mcq_options: [{ option_text: "" }, { option_text: "" }],
  //     explanations: [],
  //   },
  // ],
};

const questionSchema = yup.object().shape({
  // question_text: yup.string().required("Question Text is required"),
  // correct_answer: yup.string().required("Correct Answer is required"),
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
  // target_group: yup.string().required("Target Group is required"),
});

const mainSchema = yup.object().shape({
  target_organization: yup.string().required("Organization is required"),
  question_level: yup.string().required("Question Level is required"),
  questions: yup.array().of(questionSchema),
});

const UniversityQuestionForm = forwardRef(({ loading, setLoading }, ref) => {
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

  const onSubmitForm = async (data) => {
    setLoading(true);
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

        // Create a promise for each API call and push it to the array
        const promise = executeAjaxOperationStandard({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_QUESTION,
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
      console.log(results);
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
        console.log(detailedError);
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
      // window.location.reload();
      // Process results if needed
      console.log("All questions submitted successfully:", results);
    } catch (error) {
      // If one fails, all fail. Handle the error here.
      console.error("An error occurred during question submission:", error);
      let errorMessage = "An error occurred while submitting the form.";
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.response && error.response.data && error.response.data.error) {
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
});

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
      mcq_options: [{ option_text: "" }, { option_text: "" }],
      explanations: [],
      sub_sub_topic: "",
    },
  });

  const topic = watch("topic");
  const subTopic = watch("sub_topic");
  const question_type = dropdownData.questionTypes.filter(
    (val) => val.id == watch("question_type")
  )[0];

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
        mcq_options: [{ option_text: "" }, { option_text: "" }],
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

      setValue(`explanations.${index}.video`, response.data.video_link);
      setValue(`explanations.${index}.filename`, file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
      setGlobalError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

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
            <Col md={4}>
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

            <Col md={4}>
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

            <Col md={4}>
              <Form.Group controlId={`sub_sub_topic`}>
                <Form.Label>Sub Sub Topic:</Form.Label>
                <Controller
                  name={`sub_sub_topic`}
                  control={control}
                  disabled={!subTopic}
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors?.sub_sub_topic}>
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
                  {errors?.sub_sub_topic?.message}
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
            <Col md={12}>
              <Form.Group controlId={`question_type`}>
                <Form.Label>Question Type:</Form.Label>
                <Controller
                  name={`question_type`}
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors?.question_type}>
                      <option value="">-- Select Question Type --</option>
                      {dropdownData.questionTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.question_type?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {question_type && question_type.name && (
            <Row className="mb-3">
              <Col>
                <Form.Label>Question Text:</Form.Label>
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

          {question_type && question_type.name === "MCQ" && (
            <NestedMCQOptions control={control} errors={errors} />
          )}

          {question_type && question_type.name && (
            <Row className="mb-3">
              <Col>
                <Form.Label>Answer:</Form.Label>
                {[
                  "Descriptive/Essay Questions",
                  "Code or Programming Questions",
                ].includes(question_type.name) && (
                  <Controller
                    name="correct_answer"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        as={"textarea"}
                        rows={4}
                        isInvalid={!!errors.correct_answer}
                        {...field}
                      />
                    )}
                  />
                )}
                {[
                  "Short Answer Questions",
                  "Fill-in-the-Blanks",
                  "Numerical/Calculation Questions",
                  "MCQ",
                ].includes(question_type.name) && (
                  <Controller
                    name="correct_answer"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        type={
                          question_type.name ===
                          "Numerical/Calculation Questions"
                            ? "number"
                            : "text"
                        }
                        isInvalid={!!errors.correct_answer}
                        {...field}
                      />
                    )}
                  />
                )}
                {question_type.name === "True/false" && (
                  <Controller
                    name="correct_answer"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        isInvalid={!!errors.correct_answer}
                        {...field}
                      >
                        <option value="">-- Select --</option>
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </Form.Select>
                    )}
                  />
                )}
                <Form.Control.Feedback type="invalid">
                  {errors.correct_answer?.message}
                </Form.Control.Feedback>
              </Col>
            </Row>
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
              <Row className="mb-3 px-3" key={field.id}>
                <Col md={12} className="mb-2">
                  <Form.Label>
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

                <Col md={12} className="mb-2">
                  <Form.Label>Explanation Video (optional):</Form.Label>
                  {video ? (
                    <div>
                      <a href={video} target="_blank" rel="noopener noreferrer">
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

                <Col>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove Explanation
                  </Button>
                </Col>
              </Row>
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

const NestedMCQOptions = ({ control, errors }) => {
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
              <div className="invalid-feedback">
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

export default UniversityQuestionForm;
