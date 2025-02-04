import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import slugify from "slugify";

const CircularDetails = ({ circular }) => {
  console.log(circular);
  const { t } = useTranslation();

  if (!circular) return null;

  // Convert status string to boolean
  const isActive = circular.status.toLowerCase() === "open";

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          {/* Circular Information */}
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>{t("ID")}:</strong> {circular.id}
            </li>
            <li className="list-group-item">
              <strong>{t("Title")}:</strong> {circular.title}
            </li>
            <li className="list-group-item">
              <strong>{t("Category")}:</strong> {circular.category.name}
            </li>
            <li className="list-group-item">
              <strong>{t("Description")}:</strong> {circular.description}
            </li>
            <li className="list-group-item">
              <strong>{t("Publication Date")}:</strong>{" "}
              {circular.publication_date}
            </li>
            <li className="list-group-item">
              <strong>{t("Deadline")}:</strong> {circular.deadline}
            </li>
            <li className="list-group-item">
              <strong>{t("Start Date")}:</strong> {circular.start_date}
            </li>
            <li className="list-group-item">
              <strong>{t("End Date")}:</strong> {circular.end_date}
            </li>
            <li className="list-group-item">
              <strong>{t("Location")}:</strong> {circular.location}
            </li>
            <li className="list-group-item">
              <strong>{t("Eligibility Criteria")}:</strong>{" "}
              {circular.eligibility_criteria}
            </li>
            <li className="list-group-item">
              <strong>{t("Web Address")}:</strong>{" "}
              <a
                href={circular.link_to_circular}
                target="_blank"
                rel="noopener noreferrer"
              >
                {circular.link_to_circular}
              </a>
            </li>
            {circular.attachment_url && (
              <li className="list-group-item">
                <strong>{t("Attachment")}:</strong>{" "}
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${circular.attachment_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", fontWeight: "600" }}
                >
                  Click to see the Attachment
                </a>
              </li>
            )}
            <li className="list-group-item">
              <strong>{t("Organization Name")}:</strong>{" "}
              {circular.organization_name}
            </li>
            <li className="list-group-item">
              <strong>{t("Updated At")}:</strong>{" "}
              {new Date(circular.updated_at).toLocaleString()}
            </li>
            <li className="list-group-item">
              <strong>{t("Status")}:</strong>{" "}
              <span
                className={`badge badge-pill ${
                  isActive ? "bg-success" : "bg-danger"
                }`}
              >
                {isActive ? t("Open") : t("Closed")}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

CircularDetails.propTypes = {
  circular: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string,
      parent_category: PropTypes.any,
    }),
    description: PropTypes.string,
    organization: PropTypes.number,
    publication_date: PropTypes.string,
    deadline: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    location: PropTypes.string,
    eligibility_criteria: PropTypes.string,
    status: PropTypes.string,
    link_to_circular: PropTypes.string,
    attachment_url: PropTypes.string,
    organization_name: PropTypes.string,
    updated_at: PropTypes.string,
  }),
};

export default CircularDetails;
