import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const QuestionDetails = ({ university: question }) => {
  const { t } = useTranslation();

  if (!question) return null;

  // Extract top-level fields
  const { id, question_type } = question;

  // Extract nested details object
  const details = question.details || {};

  // Helper to render arrays elegantly
  const renderArrayField = (arrayData) => {
    if (!arrayData || arrayData.length === 0) return t("N/A");
    return (
      <ul>
        {arrayData.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  };

  // Helper to render "options" array (which might have objects with `option_text`)
  const renderOptions = (options) => {
    if (!options || options.length === 0) return t("No options available");
    return (
      <ul>
        {options.map((option, index) => (
          <li key={index}>{option.option_text}</li>
        ))}
      </ul>
    );
  };

  // Because `correct_answer` may be an array (e.g., [2]), safely convert to string
  const renderCorrectAnswer = (correctAnswer) => {
    if (!correctAnswer) return t("N/A");
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.join(", ");
    }
    return correctAnswer;
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-8">
          <ul className="list-group list-group-flush">
            {/* Top-level fields */}
            <li className="list-group-item">
              <strong>{t("ID")}:</strong> {id}
            </li>
            <li className="list-group-item">
              <strong>{t("Question Type")}:</strong> {question_type}
            </li>

            {/* If you have an updated_at at top-level, add it here:
                <li className="list-group-item">
                  <strong>{t("Updated At")}:</strong> 
                  {new Date(question.updated_at).toLocaleString()}
                </li> 
            */}

            {/* Fields from details object (regular fields) */}
            <li className="list-group-item">
              <strong>{t("Question Text")}:</strong>{" "}
              {details.question_text || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Correct Answer")}:</strong>{" "}
              {renderCorrectAnswer(details.correct_answer)}
            </li>

            {/* Dropdown-based or name-suffixed fields */}
            <li className="list-group-item">
              <strong>{t("Question Level")}:</strong>{" "}
              {details.question_level_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Target Group")}:</strong>{" "}
              {details.target_group_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Target Organization")}:</strong>{" "}
              {details.target_organization_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Subject")}:</strong>{" "}
              {details.target_subject_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Topic")}:</strong> {details.topic_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Sub Topic")}:</strong>{" "}
              {details.sub_topic_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Sub Sub Topic")}:</strong>{" "}
              {details.sub_sub_topic_name || t("N/A")}
            </li>
            <li className="list-group-item">
              <strong>{t("Difficulty Level")}:</strong>{" "}
              {details.difficulty_level_name || t("N/A")}
            </li>

            {/* Handling arrays in details (exam_references_name, etc.) */}
            <li className="list-group-item">
              <strong>{t("Exam References")}:</strong>{" "}
              {details.exam_references_name}
            </li>

            {/* Options (MCQ, etc.) */}
            <li className="list-group-item">
              <strong>{t("Options")}:</strong> {renderOptions(details.options)}
            </li>

            {/* Matching / Column-based questions */}
            <li className="list-group-item">
              <strong>{t("Options Column A")}:</strong>{" "}
              {renderArrayField(details.options_column_a)}
            </li>
            <li className="list-group-item">
              <strong>{t("Options Column B")}:</strong>{" "}
              {renderArrayField(details.options_column_b)}
            </li>

            {/* Media URLs */}
            <li className="list-group-item">
              <strong>{t("Image URL")}:</strong>{" "}
              {details.image_url ? (
                <a href={details.image_url} target="_blank" rel="noreferrer">
                  {details.image_url}
                </a>
              ) : (
                t("N/A")
              )}
            </li>
            <li className="list-group-item">
              <strong>{t("Diagram URL")}:</strong>{" "}
              {details.diagram_url ? (
                <a href={details.diagram_url} target="_blank" rel="noreferrer">
                  {details.diagram_url}
                </a>
              ) : (
                t("N/A")
              )}
            </li>
            <li className="list-group-item">
              <strong>{t("Audio URL")}:</strong>{" "}
              {details.audio_url ? (
                <a href={details.audio_url} target="_blank" rel="noreferrer">
                  {details.audio_url}
                </a>
              ) : (
                t("N/A")
              )}
            </li>

            {/* Additional fields can be added here as needed */}
          </ul>
        </div>
      </div>
    </div>
  );
};

QuestionDetails.propTypes = {
  question: PropTypes.object,
};

export default QuestionDetails;
