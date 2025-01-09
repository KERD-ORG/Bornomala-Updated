import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Select from "react-select";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { sub } from "date-fns";

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
  question_text: yup.string().required("Question Text is required"),
  correct_answer: yup.string().required("Correct Answer is required"),
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
  target_group: yup.string().required("Target Group is required"),
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
    setLoading(true);
    try {
      const promises = [];
      for (let i = 0; i < data.questions.length; i++) {
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
      if (promises.length === 0) {
        setGlobalError("You have to add at least 1 question");
        return;
      }

      // Execute all promises concurrently. If any single request fails, Promise.all will reject.
      const results = await Promise.all(promises);
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
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="container-fluid p-3">
      {globalError && (
        <div
          className="alert alert-danger alert-dismissible fade show mt-3"
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
  );
});

export const QuestionModal = ({
  show,
  onHide,
  onSubmit,
  dropdownData,
  initialData,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
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

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

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
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors?.sub_topic}>
                      <option value="">-- Select Subtopic --</option>
                      {dropdownData.subTopics.map((opt) => (
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
                <Form.Label>Topic:</Form.Label>
                <Controller
                  name={`sub_sub_topic`}
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors?.sub_sub_topic}>
                      <option value="">-- Select Sub Subtopic --</option>
                      {dropdownData.subSubTopics.map((opt) => (
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

          <NestedMCQOptions control={control} errors={errors} qIndex={0} />

          <Row className="mb-3">
            <Col>
              <Form.Label>Correct Answer:</Form.Label>
              <Controller
                name="correct_answer"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    isInvalid={!!errors.correct_answer}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.correct_answer?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>

          {/* Continue adding other fields similarly using react-bootstrap components */}
          <NestedExplanations control={control} errors={errors} qIndex={0} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
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
