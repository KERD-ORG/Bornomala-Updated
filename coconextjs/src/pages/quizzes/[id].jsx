import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useCommonForm from "@/hooks/useCommonForm";
import { Container, Card, Spinner, Badge } from "react-bootstrap";
import {
  ArrowLeft,
  BookOpen,
  ListOrdered,
  Image as ImageIcon,
  Info,
  CheckCircle,
} from "lucide-react";
import Layout from "@/components/layout";

export default function QuizDetail() {
  const router = useRouter();
  const { id, type } = router.query;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useCommonForm();

  useEffect(() => {
    if (!id || !type || !token) return;

    fetch(`http://127.0.0.1:8000/api/questions/${id}/?type=${type}`, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching quiz:", err);
        setLoading(false);
      });
  }, [id, type, token]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading quiz details...</p>
        </div>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="display-1 text-danger mb-3">
            <BookOpen size={48} />
          </div>
          <h2 className="h3 mb-3">Quiz Not Found</h2>
          <p className="text-muted mb-4">
            The quiz you're looking for doesn't exist or has been removed.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/quizzes")}
          >
            Back to Quiz List
          </button>
        </div>
      </Container>
    );
  }

  const details = quiz;

  return (
    <Layout>
      <div className="py-4 bg-light">
        <Container>
          <Card className="border-0 shadow">
            {/* Header */}
            <div className="bg-primary text-white p-4 rounded-top">
              <Link
                href="/quizzes"
                className="btn btn-link text-white p-0 mb-4 text-decoration-none"
              >
                <ArrowLeft className="me-2" />
                Back to Quizzes
              </Link>
              <h1 className="h3 mb-2 text-white">
                {details.question_type.replace(/_/g, " ")}
              </h1>
              <div className="d-flex align-items-center text-white-50">
                <BookOpen size={20} className="me-2" />
                <span>{details.target_subject_name || "General Knowledge"}</span>
              </div>
            </div>

            <Card.Body className="p-4">
              {/* Quiz Metadata */}
              <section className="mb-4">
                <h2 className="h5 mb-3">Quiz Details</h2>
                <div className="row">
                  {details.target_organization_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Organization:</strong>{" "}
                      {details.target_organization_name}
                    </div>
                  )}
                  {details.target_subject_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Subject:</strong> {details.target_subject_name}
                    </div>
                  )}
                  {details.difficulty_level_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Difficulty:</strong> {details.difficulty_level_name}
                    </div>
                  )}
                  {details.exam_references_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Exam Reference:</strong> {details.exam_references_name}
                    </div>
                  )}
                  {details.topic_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Topic:</strong> {details.topic_name}
                    </div>
                  )}
                  {details.sub_topic_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Sub Topic:</strong> {details.sub_topic_name}
                    </div>
                  )}
                  {details.question_level_name && (
                    <div className="col-md-6 mb-2">
                      <strong>Question Level:</strong> {details.question_level_name}
                    </div>
                  )}
                </div>
              </section>

              {/* Question */}
              <section className="mb-4">
                <h2 className="h5 mb-3">Question</h2>
                <Card className="bg-light border-0">
                  <Card.Body>
                    <p className="mb-0 fs-5">{details.question_text}</p>
                  </Card.Body>
                </Card>
              </section>

              {/* Options */}
              {details.options?.length > 0 && (
                <section className="mb-4">
                  <h2 className="h5 d-flex align-items-center mb-3">
                    <ListOrdered size={20} className="text-primary me-2" />
                    Options
                  </h2>
                  <div className="d-flex flex-column gap-2">
                    {details.options.map((option, idx) => (
                      <Card key={idx} className="border-0 bg-light">
                        <Card.Body className="py-2">{option}</Card.Body>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Ordering Sequence */}
              {details.ordering_sequence && (
                <section className="mb-4">
                  <h2 className="h5 d-flex align-items-center mb-3">
                    <ListOrdered size={20} className="text-primary me-2" />
                    Arrange in Order
                  </h2>
                  <div className="d-flex flex-column gap-2">
                    {details.ordering_sequence.map((item, idx) => (
                      <Card key={idx} className="border-0 bg-light">
                        <Card.Body className="d-flex align-items-center">
                          <Badge bg="primary" className="me-3">
                            {idx + 1}
                          </Badge>
                          {item}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Media (Image or Diagram) */}
              {(details.image_url || details.diagram_url) && (
                <section className="mb-4">
                  <h2 className="h5 d-flex align-items-center mb-3">
                    <ImageIcon size={20} className="text-primary me-2" />
                    Visual Aid
                  </h2>
                  <Card className="border-0 overflow-hidden">
                    <img
                      src={details.image_url || details.diagram_url}
                      alt="Quiz Media"
                      className="img-fluid"
                      style={{ maxHeight: "400px", objectFit: "cover" }}
                    />
                  </Card>
                </section>
              )}

              {/* Explanations */}
              {details.explanations?.length > 0 && (
                <section className="mb-4">
                  <h2 className="h5 d-flex align-items-center mb-3">
                    <Info size={20} className="text-primary me-2" />
                    Explanations
                  </h2>
                  <div className="d-flex flex-column gap-3">
                    {details.explanations.map((exp) => (
                      <Card
                        key={exp.id}
                        className="border-0 bg-primary bg-opacity-10"
                      >
                        <Card.Body>
                          <div className="fw-medium text-primary mb-1">
                            {exp.level}
                          </div>
                          <div>{exp.text}</div>
                          {exp.video_url && (
                            <div className="mt-2">
                              <video controls width="100%">
                                <source src={exp.video_url} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Correct Answer */}
              {details.correct_answer && (
                <section className="mb-4">
                  <h2 className="h5 d-flex align-items-center mb-3">
                    <CheckCircle size={20} className="text-success me-2" />
                    Correct Answer
                  </h2>
                  <Card className="border-0 bg-success bg-opacity-10">
                    <Card.Body className="text-success">
                      {details.correct_answer}
                    </Card.Body>
                  </Card>
                </section>
              )}

              {/* Footer Navigation */}
              <div>
                <Link href="/quizzes" className="btn btn-outline-secondary">
                  Back to List
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Layout>
  );
}
