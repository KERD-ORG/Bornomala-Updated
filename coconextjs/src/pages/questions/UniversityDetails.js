import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const QuestionDetails = ({ university:question }) => {
  const { t } = useTranslation();

  if (!question) return null;

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-8">
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>{t("ID")}:</strong> {question.id}
            </li>
            <li className="list-group-item">
              <strong>{t("Updated At")}:</strong>{" "}
              {new Date(question.updated_at).toLocaleString()}
            </li>
            <li className="list-group-item">
              <strong>{t("Question Level")}:</strong>{" "}
              {question.question_level_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Target Group")}:</strong> {question.target_group_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Subject")}:</strong> {question.subject_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Question Type")}:</strong>{" "}
              {question.question_type_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Topic")}:</strong> {question.topic_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Sub Topic")}:</strong> {question.sub_topic_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Sub Sub Topic")}:</strong>{" "}
              {question.sub_sub_topic_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Difficulty Level")}:</strong>{" "}
              {question.difficulty_level_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Target Organization")}:</strong>{" "}
              {question.target_organization_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Question Text")}:</strong> {question.question_text}
            </li>
            <li className="list-group-item">
              <strong>{t("Correct Answer")}:</strong> {question.correct_answer}
            </li>
            <li className="list-group-item">
              <strong>{t("MCQ Options")}:</strong>
              {question.mcq_options && question.mcq_options.length > 0 ? (
                <ul>
                  {question.mcq_options.map((option, index) => (
                    <li key={index}>{option.option_text}</li>
                  ))}
                </ul>
              ) : (
                t("No options available")
              )}
            </li>
            {/* You can include additional fields like explanations if needed */}
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
