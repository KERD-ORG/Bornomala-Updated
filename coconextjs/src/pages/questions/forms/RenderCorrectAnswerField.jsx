import useCommonForm from "@/hooks/useCommonForm";
import axios from "axios";
import React from "react";
import { Button, Form } from "react-bootstrap";
import { Controller } from "react-hook-form";

const RenderCorrectAnswerField = ({
  questionType,
  errors,
  control,
  translateToBengali,
}) => {
  const { loading, setLoading, token, t, setGlobalError } = useCommonForm();
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
          {translateToBengali && (
            <Form.Group className="mt-3">
              <Form.Label>Translation in Bengali:</Form.Label>
              <Controller
                name="correct_answer_bn"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type={questionType === "NUMERICAL" ? "number" : "text"}
                    isInvalid={!!errors.correct_answer_bn}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.correct_answer_bn?.message}
              </Form.Control.Feedback>
            </Form.Group>
          )}
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
          {translateToBengali && (
            <Form.Group className="mt-3">
              <Form.Label>Translation in Bengali:</Form.Label>
              <Controller
                name="correct_answer_bn"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={4}
                    isInvalid={!!errors.correct_answer_bn}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.correct_answer_bn?.message}
              </Form.Control.Feedback>
            </Form.Group>
          )}
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
          {translateToBengali && (
            <Form.Group className="mt-3">
              <Form.Label>Translation in Bengali:</Form.Label>
              <Controller
                name="correct_answer_bn"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={4}
                    isInvalid={!!errors.correct_answer_bn}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.correct_answer_bn?.message}
              </Form.Control.Feedback>
            </Form.Group>
          )}
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
                        questionType === "DIAGRAM" ? "diagram_url" : "image_url"
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
      return <div></div>;
  }
};

export default RenderCorrectAnswerField;
