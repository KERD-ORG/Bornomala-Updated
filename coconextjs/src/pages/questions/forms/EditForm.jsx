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
import NestedMCQOptions from "./NestedMCQOptions";
import RenderCorrectAnswerField from "./RenderCorrectAnswerField";
import {
  CONTAINS_QUESTION,
  EXPLANATION_LEVELS,
  FetchDropdownData,
  QuestionSchema,
} from "@/pages/questions/utils";

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
  sub_sub_topic: [],
};

// Define validation schema as needed for editing a question
const mainSchema = yup
  .object()
  .shape({
    target_organization: yup.string().required("Organization is required"),
    question_level: yup.string().required("Question Level is required"),
  })
  .concat(QuestionSchema);

const QuestionEditForm = forwardRef(
  ({ initialData, onSubmit, onCancel, addRow, deleteRow, type = "" }, ref) => {
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
    const subTopic = watch("sub_topic");
    const question_type = watch("question_type");

    useImperativeHandle(ref, () => ({
      resetForm: () => reset(defaultValues),
    }));

    useEffect(() => {
      (async function () {
        const data = await FetchDropdownData(token);
        setDropdownData((prev) => ({ ...prev, ...data }));
      })();
    }, [token]);

    // Populate form fields with initialData when editing a single question
    useEffect(() => {
      if (initialData) {
        if (initialData.details.explanations) {
          // sort the array based on level
          initialData.details.explanations.sort((a, b) => {
            return (
              EXPLANATION_LEVELS.indexOf(a.level) -
              EXPLANATION_LEVELS.indexOf(b.level)
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
          correct_answer: initialData.details.correct_answer,
          target_subject: initialData.details.target_subject || "",
          exam_references: initialData.details.exam_references || [],
          question_type: initialData.question_type || "",
          topic: initialData.details.topic || "",
          sub_topic: initialData.details.sub_topic || "",
          difficulty_level: initialData.details.difficulty_level || "",
          explanations: initialData.details.explanations || [],
          target_group: initialData.details.target_group || "",
          sub_sub_topic: initialData.details.sub_sub_topic || [],
          ordering_sequence: initialData.details.ordering_sequence || [],
          options_column_a: initialData.details.options_column_a || [],
          options_column_b: initialData.details.options_column_b || [],
          image_url: initialData.details.image_url || "",
          audio_url: initialData.details.audio_url || "",
          diagram_url: initialData.details.diagram_url || "",
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
      if (type === "import") {
        onSubmit(data);
        return;
      }
      try {
        const url = process.env.NEXT_PUBLIC_API_ENDPOINT_QUESTION;
        const method = "put";
        data.explanations = data.explanations.map((val, ind) => ({
          ...val,
          level: EXPLANATION_LEVELS[ind],
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
        console.log(response);
        setValue(`explanations.${index}.video_url`, response.data.media_link);
        setValue(`explanations.${index}.filename`, file.name);
      } catch (error) {
        console.error("Error uploading file:", error);
        setGlobalError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
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
          <Col md={6}>
            <Form.Group controlId={`sub_sub_topic`}>
              <Form.Label>Sub Sub Topic:</Form.Label>
              <Controller
                name="sub_sub_topic"
                control={control}
                render={({ field }) => {
                  const { onChange, value, ref } = field;
                  return (
                    <Select
                      inputRef={ref}
                      isMulti
                      isDisabled={!subTopic}
                      options={dropdownData.subSubTopics.filter(
                        (val) => val.sub_topic == subTopic
                      )}
                      value={dropdownData.subSubTopics.filter((option) =>
                        value?.includes(option.value)
                      )}
                      onChange={(selectedOptions) =>
                        onChange(selectedOptions.map((option) => option.value))
                      }
                      classNamePrefix={
                        errors.sub_sub_topic ? "is-invalid" : "select"
                      }
                    />
                  );
                }}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.sub_sub_topic?.message}
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
          <Col md={6}>
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
        </Row>

        {question_type && (
          <>
            {CONTAINS_QUESTION.includes(question_type) && (
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
                <RenderCorrectAnswerField
                  errors={errors}
                  control={control}
                  questionType={question_type}
                />
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
          const video = watch(`explanations.${index}.video_url`);

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
                    {EXPLANATION_LEVELS[index]} Explanation:
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
                          setValue(`explanations.${index}.video_url`, "")
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
                          isInvalid={!!errors?.explanations?.[index]?.video_url}
                        />
                      )}
                    />
                  )}
                  <Form.Control.Feedback type="invalid">
                    {errors?.explanations?.[index]?.video_url?.message}
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
              disabled={fields.length >= EXPLANATION_LEVELS.length}
            >
              Add Explanation
            </Button>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-3 mt-3">
          <Button
            variant="secondary"
            onClick={() => {
              reset(defaultValues); // Reset the form to default values
              onCancel(); // Call the onCancel callback
            }}
          >
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

QuestionEditForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export default QuestionEditForm;
