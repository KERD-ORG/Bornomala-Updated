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
  options: [{ option_text: "" }, { option_text: "" }],
  explanations: [],
  target_group: "",
  sub_sub_topic: "",
};

// Define validation schema as needed for editing a question
const mainSchema = yup.object().shape({
  target_organization: yup.string().required("Organization is required"),
  question_level: yup.string().required("Question Level is required"),
  question_text: yup.string().required("Question Text is required"),
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
      case "DRAG_DROP":
        return yup
          .string()
          .required("Correct answer mapping is required")
          .test("is-json", "Correct answer must be a valid JSON", (value) => {
            try {
              JSON.parse(value);
              return true;
            } catch {
              return false;
            }
          });
    }
  }),
  matching_pairs: yup.object().when("question_type", {
    is: (val) => val === "MATCHING",
    then: () =>
      yup
        .object()
        // Transform the input: if it's a string, try to parse it as JSON.
        .transform((value, originalValue) => {
          if (typeof originalValue === "string") {
            try {
              const parsed = JSON.parse(originalValue);
              return parsed;
            } catch (e) {
              // If parsing fails, return the original value to let validation catch the error.
              return originalValue;
            }
          }
          return value;
        })
        .test(
          "valid-json-object",
          "Please enter a valid JSON object",
          (value) => {
            // After transformation, check if value is a valid non-array object.
            return value && typeof value === "object" && !Array.isArray(value);
          }
        )
        .test(
          "non-empty-object",
          "Matching pairs cannot be empty",
          (value) => value && Object.keys(value).length > 0
        ),
    otherwise: () => yup.mixed().notRequired(),
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
    is: (val) => val == "DRAG_DROP",
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
    is: (val) => val == "DRAG_DROP",
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
  audio_url: yup.string().when("question_type", {
    is: (val) => val === "AUDIO",
    then: () => yup.string().required("Audio upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  target_group: yup.string().required("Target Group is required"),
});

const QuestionEditForm = forwardRef(
  ({ initialData, onSubmit, onCancel, addRow, deleteRow }, ref) => {
    const {
      t,
      globalError,
      setGlobalError,
      setSuccessMessage,
      token,
      setToken,
      loading,
      setLoading,
    } = useCommonForm();
    const router = useRouter();
    const {
      control,
      handleSubmit,
      reset,
      watch,
      formState: { errors },
      setValue,
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
    const question_type = watch("question_type");

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
        if (initialData.details.explanations) {
          // sort the array based on level
          initialData.details.explanations.sort((a, b) => {
            return (
              explanationLevels.indexOf(a.level) -
              explanationLevels.indexOf(b.level)
            );
          });
        }
        if (initialData.details.options) {
          initialData.details.options = initialData.details.options.map(
            (option) => {
              if (typeof option === "string") return { option_text: option };
              if (typeof option === "object" && option.option_text)
                return option;
              return { option_text: "" }; // Fallback for any unexpected format
            }
          );
        }
        reset({
          target_organization: initialData.details.target_organization || "",
          question_level: initialData.details.question_level || "",
          question_text: initialData.details.question_text || "",
          correct_answer: initialData.details.correct_answer || "",
          target_subject: initialData.details.target_subject || "",
          exam_references: initialData.details.exam_references || [],
          question_type: initialData.question_type || "",
          topic: initialData.details.topic || "",
          sub_topic: initialData.details.sub_topic || "",
          difficulty_level: initialData.details.difficulty_level || "",
          explanations: initialData.details.explanations || [],
          target_group: initialData.details.target_group || "",
          sub_sub_topic: initialData.details.sub_sub_topic || "",
          matching_pairs: initialData.details.matching_pairs || {},
          ordering_sequence: initialData.details.ordering_sequence || [],
          options_column_a: initialData.details.options_column_a || [],
          options_column_b: initialData.details.options_column_b || [],
          image_url: initialData.details.image_url || "",
          audio_url: initialData.details.audio_url || "",
          options: initialData.details.options || [
            { option_text: "" },
            { option_text: "" },
          ],
        });
      }
    }, [initialData]);

    const { fields, append, remove } = useFieldArray({
      control,
      name: "explanations",
    });

    const onSubmitForm = async (data) => {
      try {
        const url = process.env.NEXT_PUBLIC_API_ENDPOINT_QUESTION;
        const method = "put";
        data.explanations = data.explanations.map((val, ind) => ({
          ...val,
          level: explanationLevels[ind],
        }));

        data.options = data.options.map((val) => val.option_text);
        let type = data.question_type;

        delete data["question_type"];

        setLoading(true);
        const response = await executeAjaxOperationStandard({
          url: `${url}${initialData.id}/?type=${type}`,
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
          // deleteRow(response.data.id);
          // addRow(response.data);
          // onCancel();
          // onSubmit(
          //   response.data.message || t("Question updated successfully."),
          //   true
          // );
          window.location.reload();
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
          );
        case "TRUE_FALSE":
          return (
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
          );
        case "ASSERTION_REASON":
        case "CASE_STUDY":
        case "CODE":
          return (
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
          );
        case "NUMERICAL":
          return (
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
          );
        case "MATCHING":
          return (
            <Controller
              name="matching_pairs"
              control={control}
              render={({ field }) => (
                <Form.Control
                  as="textarea"
                  placeholder='Enter pairs as JSON, e.g., {"Key":"Value"}'
                  rows={4}
                  isInvalid={!!errors.matching_pairs}
                  value={
                    typeof field.value === "object"
                      ? JSON.stringify(field.value, null, 2) // Convert object to a formatted JSON string
                      : field.value
                  }
                  onChange={(e) => field.onChange(e.target.value)} // Allow user to edit raw JSON text
                  // {...field}
                />
              )}
            />
          );
        case "ORDERING":
          return (
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
          );
        case "DRAG_DROP":
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
                <Form.Label>Correct Answer Mapping (JSON):</Form.Label>
                <Controller
                  name="correct_answer"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder='e.g., {"OptionA":"MatchA", "OptionB":"MatchB"}'
                      isInvalid={!!errors.correct_answer}
                      {...field}
                    />
                  )}
                />
              </Form.Group>
            </>
          );
        case "IMAGE":
          return (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Upload Image:</Form.Label>
                <Controller
                  name="image_url" // field to store the image URL
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
                        isInvalid={!!errors.image_url}
                      />
                    );
                  }}
                />
                {errors.image_url && (
                  <Form.Control.Feedback type="invalid">
                    {errors.image_url.message}
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
        case "AUDIO":
          return (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Upload Audio:</Form.Label>
                <Controller
                  name="audio_url" // field to store the audio URL
                  control={control}
                  render={({ field }) => {
                    if (field.value) {
                      return (
                        <div>
                          <audio
                            controls
                            src={field.value}
                            style={{ display: "block", marginBottom: "10px" }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => field.onChange("")}
                          >
                            Change Audio
                          </Button>
                        </div>
                      );
                    }
                    return (
                      <Form.Control
                        type="file"
                        accept="audio/*"
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
                              field.onChange(response.data.media_link);
                            } catch (error) {
                              console.error("Error uploading audio:", error);
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

    return (
      <Form onSubmit={handleSubmit(onSubmitForm)}>
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
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId={`sub_sub_topic1`}>
              <Form.Label>Sub Sub Topic 1:</Form.Label>
              <Controller
                name={`sub_sub_topic1`}
                control={control}
                disabled={!sub_topic}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors?.sub_sub_topic1}>
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
                disabled={!sub_topic}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors?.sub_sub_topic2}>
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
                disabled={!sub_topic}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors?.sub_sub_topic3}>
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
                  <option value="MCQ_SINGLE">MCQ Single</option>
                  <option value="MCQ_MULTI">MCQ Multiple</option>
                  <option value="FILL_BLANK">Fill in the Blank</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="CODE">Programming</option>
                  <option value="MATCHING">Matching</option>
                  <option value="ORDERING">Ordering</option>
                  <option value="NUMERICAL">Numerical</option>
                  <option value="DRAG_DROP">Drag and Drop</option>
                  <option value="ASSERTION_REASON">Assertion Reason</option>
                  <option value="CASE_STUDY">Case Study</option>
                  <option value="IMAGE">Image</option>
                  <option value="AUDIO">Audio</option>
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

QuestionEditForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export default QuestionEditForm;
