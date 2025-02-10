import Layout from "@/components/layout";
import useCommonForm from "@/hooks/useCommonForm";
import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

export default function QuizList() {
  const [groupedQuizzes, setGroupedQuizzes] = useState({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;
  const { token } = useCommonForm();

  // Create a unique identifier for each quiz
  const createQuizKey = (quiz) => {
    return `${quiz.id}-${quiz.details.question_type}-${quiz.details.question_text}-${quiz.details.target_subject_name}`;
  };

  useEffect(() => {
    if (token) {
      setGroupedQuizzes({});
      setOffset(0);
      setHasMore(true);
      fetchQuestions(0);
    }
  }, [token]);

  const fetchQuestions = async (newOffset) => {
    if (!token || !hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/questions/?offset=${newOffset}&limit=${limit}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setGroupedQuizzes((prevGrouped) => {
        const newGrouped = { ...prevGrouped };
        data.forEach((quiz) => {
          const subject = quiz.details.target_subject_name || "Unknown Subject";
          if (!newGrouped[subject]) {
            newGrouped[subject] = [];
          }
          // Check for duplicates using the composite key
          const quizKey = createQuizKey(quiz);
          const quizExists = newGrouped[subject].some(
            (existingQuiz) => createQuizKey(existingQuiz) === quizKey
          );
          if (!quizExists) {
            newGrouped[subject].push(quiz);
          }
        });
        return newGrouped;
      });

      setOffset(newOffset + limit);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Quiz Questions by Subject</title>
      </Head>

      <Container className="mt-4">
        <h1 className="mb-4 text-center fw-bold" style={{ fontSize: "2rem" }}>
          Quiz Questions by Subject
        </h1>

        {Object.entries(groupedQuizzes).length === 0 && !isLoading && (
          <div className="text-center text-muted" style={{ fontSize: "1.2rem" }}>
            No quizzes available
          </div>
        )}

        {Object.entries(groupedQuizzes).map(([subject, quizzes]) => (
          <div key={subject} className="mb-5">
            <h2
              className="mb-3 text-primary fw-bold border-bottom pb-2"
              style={{ fontSize: "1.75rem" }}
            >
              {subject}
            </h2>
            <Row className="g-4">
              {quizzes.map((quiz) => (
                <Col key={createQuizKey(quiz)} sm={12} md={6} lg={4}>
                  <Card className="h-100 shadow-sm border-0 p-3">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title
                        className="text-primary fw-semibold mb-3"
                        style={{ fontSize: "1.3rem" }}
                      >
                        {quiz.details.question_type.replace(/_/g, " ")}
                      </Card.Title>

                      {/* Additional Metadata: Organization, Topic, Sub Topic */}
                      <Card.Text className="text-secondary" style={{ fontSize: "0.9rem" }}>
                        {quiz.details.target_organization_name && (
                          <>
                            <strong>Organization:</strong> {quiz.details.target_organization_name} <br />
                          </>
                        )}
                        {quiz.details.topic_name && (
                          <>
                            <strong>Topic:</strong> {quiz.details.topic_name} <br />
                          </>
                        )}
                        {quiz.details.sub_topic_name && (
                          <>
                            <strong>Sub Topic:</strong> {quiz.details.sub_topic_name}
                          </>
                        )}
                      </Card.Text>

                      <Card.Text className="text-muted flex-grow-1" style={{ fontSize: "1rem" }}>
                        {quiz.details.question_text || "No question text available"}
                      </Card.Text>

                      {/* Render options if available */}
                      {quiz.details.options && quiz.details.options.length > 0 && (
                        <div className="mb-3">
                          <ul className="ps-3 mb-0" style={{ fontSize: "0.95rem" }}>
                            {quiz.details.options.map((option, idx) => (
                              <li key={`${createQuizKey(quiz)}-option-${idx}`}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Render ordering sequence if available */}
                      {quiz.details.ordering_sequence && (
                        <div className="mb-3">
                          <ol className="ps-3 mb-0" style={{ fontSize: "0.95rem" }}>
                            {quiz.details.ordering_sequence.map((step, idx) => (
                              <li key={`${createQuizKey(quiz)}-step-${idx}`}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Render explanations if available */}
                      {quiz.details.explanations && quiz.details.explanations.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold">Explanations:</h6>
                          {quiz.details.explanations.map((explanation, idx) => (
                            <div key={`explanation-${idx}`} className="mb-2">
                              <p className="mb-0">
                                <strong>{explanation.level}:</strong> {explanation.text}
                              </p>
                              {explanation.video_url && (
                                <div className="mt-1">
                                  <video controls width="100%">
                                    <source src={explanation.video_url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render image or diagram if available */}
                      {(quiz.details.image_url || quiz.details.diagram_url) && (
                        <div className="text-center mb-3">
                          <img
                            src={quiz.details.image_url || quiz.details.diagram_url}
                            alt="Question media"
                            className="img-fluid rounded"
                            style={{ maxHeight: "150px", objectFit: "cover" }}
                          />
                        </div>
                      )}

                      <Link
                        href={{
                          pathname: `/quizzes/${quiz.id}`,
                          query: { type: quiz.details.question_type },
                        }}
                        passHref
                      >
                        <Button
                          variant="outline-primary"
                          className="w-100 mt-auto"
                          style={{
                            fontSize: "1rem",
                            padding: "0.75rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          View Quiz
                        </Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        {hasMore && (
          <div className="text-center mt-4 mb-5">
            <Button
              onClick={() => fetchQuestions(offset)}
              disabled={isLoading}
              className="btn btn-primary px-4"
              style={{ fontSize: "1.1rem", padding: "0.75rem 2rem" }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </Container>
    </Layout>
  );
}
