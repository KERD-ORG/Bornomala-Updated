import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useCommonForm from "@/hooks/useCommonForm";
import { Container, Row, Col, Badge, Button, Spinner } from "react-bootstrap";
import Head from "next/head";

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useCommonForm();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only fetch if 'id' and 'token' are available
    if (!id || !token) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://127.0.0.1:8000/api/circulars/${id}/`,
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        setJob(data);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError("Failed to load job details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, token]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center">
          <Spinner animation="border" role="status" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="py-5">
        <p>No job data found.</p>
      </Container>
    );
  }

  // Destructure the fields for readability
  const {
    title,
    category,
    description,
    publication_date,
    deadline,
    start_date,
    end_date,
    location,
    eligibility_criteria,
    status,
    link_to_circular,
    attachment_url,
    organization_name,
    updated_at,
  } = job;
  console.log(job);

  // Determine if job is open or closed
  const isActive = status?.toLowerCase() === "open";

  return (
    <Container className="py-4">
      <Head>
        <title>{title ? `${title} | Job Details` : "Job Details"}</title>
        <meta
          name="description"
          content={description || "Find out more about this job opening."}
        />
      </Head>
      {/* Optional "Go Back" button */}
      <Button
        variant="secondary"
        className="mb-3"
        onClick={() => router.back()}
      >
        &larr; Go Back
      </Button>

      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          {/* Title & Status Badge */}
          <h1 className="mb-2">{title}</h1>
          <div className="mb-4">
            <Badge bg={isActive ? "success" : "danger"}>
              {isActive ? "Open" : "Closed"}
            </Badge>
          </div>

          {/* Meta info row, simulating blog post metadata */}
          <div className="d-flex flex-wrap align-items-center mb-4 text-secondary">
            {category?.name && (
              <span className="me-3">
                <strong>Category: </strong>
                {category.name}
              </span>
            )}
            {location && (
              <span className="me-3">
                <strong>Location: </strong>
                {location}
              </span>
            )}
            {publication_date && (
              <span className="me-3">
                <strong>Published: </strong>
                {publication_date}
              </span>
            )}
            {deadline && (
              <span className="me-3">
                <strong>Deadline: </strong>
                {deadline}
              </span>
            )}
          </div>

          {/* "Body" of the job, like a blog post */}
          <section className="mb-4">
            {/* Description */}
            <h4 className="mb-2">Description</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {description || "No description provided."}
            </p>
          </section>

          {/* Another section for eligibility */}
          <section className="mb-4">
            <h4 className="mb-2">Eligibility Criteria</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {eligibility_criteria || "Not specified."}
            </p>
          </section>

          {/* Additional meta fields in a smaller text block */}
          <section className="mb-4 text-secondary">
            {start_date && (
              <p className="mb-1">
                <strong>Start Date:</strong> {start_date}
              </p>
            )}
            {end_date && (
              <p className="mb-1">
                <strong>End Date:</strong> {end_date}
              </p>
            )}
            {organization_name && (
              <p className="mb-1">
                <strong>Organization:</strong> {organization_name}
              </p>
            )}
            {updated_at && (
              <p className="mb-1">
                <strong>Last Updated:</strong>{" "}
                {new Date(updated_at).toLocaleString()}
              </p>
            )}
          </section>

          {/* Footer area for links, attachments, external resources */}
          <hr />
          <section className="d-flex flex-column flex-sm-row align-items-start mt-3">
            {/* Link to Circular (if any) */}
            {link_to_circular && (
              <Button
                as="a"
                href={link_to_circular}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="me-2 mb-2"
              >
                Go to Circular
              </Button>
            )}

            {/* Attachment Link (if any) */}
            {attachment_url && (
              <Button
                as="a"
                href={attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline-secondary"
                className="mb-2"
              >
                View Attachment
              </Button>
            )}
          </section>
        </Col>
      </Row>
    </Container>
  );
}
