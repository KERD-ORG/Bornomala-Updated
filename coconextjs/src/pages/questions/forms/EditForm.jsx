import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useCommonForm from "@/hooks/useCommonForm";
import { executeAjaxOperationStandard } from "@/utils/fetcher";
import { useRouter } from "next/router";
import Select from "react-select";
import { Button, Col, Form, Row } from "react-bootstrap";
import { sub } from "date-fns";
import axios from "axios";

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
  target_group: "",
  sub_sub_topic: "",
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
  target_group: yup.string().required("Target Group is required"),
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
      watch,
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
      targetGroups: [],
      subSubTopics: [],
    });

    const topic = watch("topic");
    const sub_topic = watch("sub_topic");
    const question_type = dropdownData.questionTypes.filter(
      (val) => val.id == watch("question_type")
    )[0];

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
          target_group: initialData.target_group || "",
          sub_sub_topic: initialData.sub_sub_topic || "",
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
      <Form onSubmit={handleSubmit(onSubmitForm)}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Target Organization:</Form.Label>
            <Controller
              name="target_organization"
              control={control}
              render={({ field }) => (
                <Form.Select
                  isInvalid={!!errors.target_organization}
                  {...field}
                >
                  <option value="">-- Select Target Organization --</option>
                  {dropdownData.organizations.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              )}
            />
            <Form.Control.Feedback type="invalid">
              {errors.target_organization?.message}
            </Form.Control.Feedback>
          </Col>
          <Col md={6}>
            <Form.Label>Question Level:</Form.Label>
            <Controller
              name="question_level"
              control={control}
              render={({ field }) => (
                <Form.Select isInvalid={!!errors.question_level} {...field}>
                  <option value="">-- Select Question Level --</option>
                  {dropdownData.questionLevels.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              )}
            />
            <Form.Control.Feedback type="invalid">
              {errors.question_level?.message}
            </Form.Control.Feedback>
          </Col>
        </Row>
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
                disabled={!topic}
                control={control}
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
                disabled={!sub_topic}
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
          <NestedMCQOptions control={control} errors={errors} qIndex={0} />
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
                        question_type.name === "Numerical/Calculation Questions"
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
                    <Form.Select isInvalid={!!errors.correct_answer} {...field}>
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
        <NestedExplanations control={control} errors={errors} qIndex={0} />

        <div className="d-flex justify-content-end gap-3 mt-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialData ? "Save Changes" : "Add Question"}
          </Button>
        </div>
      </Form>
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

  const handleVideoUpload = async (file) => {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/presign-url`,
        {
          params: { file_name: file.name },
          headers: {
            Authorization: `Token ${token}`,
          },
          /* possibly pass auth token if needed */
        }
      );

      await axios.put(data.url, file, {
        headers: {
          "Content-Type": file.type,
        },
      });
      console.log(data.url);
    } catch (error) {
      console.log(error);
    }
  };

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
                      handleVideoUpload(e.target.files[0]);
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
