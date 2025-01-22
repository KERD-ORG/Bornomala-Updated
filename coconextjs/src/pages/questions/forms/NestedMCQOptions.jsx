import { MAX_OPTIONS } from "@/utils/utils";
import React from "react";
import { Button } from "react-bootstrap";
import { Controller, useFieldArray } from "react-hook-form";

const NestedMCQOptions = ({ control, errors, watch, setValue }) => {
  const questionType = watch("question_type");

  const correctAnswerValue =
    questionType === "MCQ_MULTI"
      ? watch("correct_answer") ?? []
      : watch("correct_answer");

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

export default NestedMCQOptions;
