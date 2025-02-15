import Layout from "@/components/layout";
import useCommonForm from "@/hooks/useCommonForm";
import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Card, Button, Accordion, Row, Col } from "react-bootstrap";

export default function QuizList() {
  const [groupedData, setGroupedData] = useState({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const { token } = useCommonForm();

  const createQuizKey = (quiz) => {
    return `${quiz.id}-${quiz.details.question_type}-${quiz.details.question_text}-${quiz.details.target_subject_name}-${quiz.details.target_organization_name}`;
  };

  useEffect(() => {
    if (token) {
      setGroupedData({});
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

      setGroupedData((prevGrouped) => {
        const newGrouped = { ...prevGrouped };

        data.forEach((quiz) => {
          const orgName = quiz.details.target_organization_name || "Unknown Organization";
          const subjectName = quiz.details.target_subject_name || "Unknown Subject";

          if (!newGrouped[orgName]) {
            newGrouped[orgName] = {};
          }
          if (!newGrouped[orgName][subjectName]) {
            newGrouped[orgName][subjectName] = [];
          }

          const quizKey = createQuizKey(quiz);
          const quizExists = newGrouped[orgName][subjectName].some(
            (existingQuiz) => createQuizKey(existingQuiz) === quizKey
          );

          if (!quizExists) {
            newGrouped[orgName][subjectName].push(quiz);
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

  const QuizCard = ({ quiz }) => (
    <Card className="h-100 shadow-sm border-0 hover-shadow transition-all">
      <Card.Body className="d-flex flex-column p-4">
        <Card.Title className="text-primary fw-semibold mb-3" style={{ fontSize: "1rem" }}>
          {quiz.details.question_type.replace(/_/g, " ")}
        </Card.Title>

        {/* Metadata section */}
        <div className="text-secondary mb-3" style={{ fontSize: "1rem" }}>
          {quiz.details.topic_name && (
            <div className="mb-1">
              <strong>Topic:</strong> {quiz.details.topic_name}
            </div>
          )}
          {quiz.details.sub_topic_name && (
            <div className="mb-1">
              <strong>Sub Topic:</strong> {quiz.details.sub_topic_name}
            </div>
          )}
        </div>

        {/* Question text */}
        <Card.Text className="mb-4" style={{ fontSize: "1.1rem" }}>
          {quiz.details.question_text || "No question text available"}
        </Card.Text>

        {/* Options */}
        {quiz.details.options && quiz.details.options.length > 0 && (
          <div className="mb-4">
            <ul className="ps-4 mb-0" style={{ fontSize: "1.05rem" }}>
              {quiz.details.options.map((option, idx) => (
                <li key={`option-${idx}`} className="mb-2">{option}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ordering sequence */}
        {quiz.details.ordering_sequence && (
          <div className="mb-4">
            <ol className="ps-4 mb-0" style={{ fontSize: "1.05rem" }}>
              {quiz.details.ordering_sequence.map((step, idx) => (
                <li key={`step-${idx}`} className="mb-2">{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Media content */}
        {(quiz.details.image_url || quiz.details.diagram_url) && (
          <div className="text-center mb-4">
            <img
              src={quiz.details.image_url || quiz.details.diagram_url}
              alt="Question media"
              className="img-fluid rounded"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Explanations */}
        {quiz.details.explanations && quiz.details.explanations.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>Explanations:</h6>
            {quiz.details.explanations.map((explanation, idx) => (
              <div key={`explanation-${idx}`} className="mb-3">
                <p className="mb-2" style={{ fontSize: "1.05rem" }}>
                  <strong>{explanation.level}:</strong> {explanation.text}
                </p>
                {explanation.video_url && (
                  <div className="mt-2">
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

        <Link
          href={{
            pathname: `/quizzes/${quiz.id}`,
            query: { type: quiz.details.question_type },
          }}
          passHref
          className="mt-auto"
        >
          <Button 
            variant="outline-primary" 
            className="w-100 py-2"
            style={{ fontSize: "1rem" }}
          >
            View Quiz
          </Button>
        </Link>
      </Card.Body>
    </Card>
  );

  return (
    <Layout>
      <Head>
        <title>Quiz Questions by Organization and Subject</title>
      </Head>

      <Container>
        <h1 className="mb-5 text-center fw-bold" style={{ fontSize: "2rem" }}>
          Quiz Questions
        </h1>

        {Object.keys(groupedData).length === 0 && !isLoading && (
          <div className="text-center text-muted" style={{ fontSize: "1.25rem" }}>
            No quizzes available
          </div>
        )}

        {/* Organization Accordion */}
        <Accordion defaultActiveKey="0" className="mb-5">
          {Object.entries(groupedData).map(([orgName, subjects], orgIndex) => (
            <Accordion.Item 
              eventKey={String(orgIndex)} 
              key={orgName}
              className="border-0 mb-3 shadow-sm"
            >
              <Accordion.Header className="py-2">
                <span style={{ fontSize: "1.35rem" }}>{orgName}</span>
              </Accordion.Header>
              <Accordion.Body className="p-4">
                {/* Subject Accordion */}
                <Accordion defaultActiveKey="0">
                  {Object.entries(subjects).map(([subjectName, quizzes], subjectIndex) => (
                    <Accordion.Item 
                      eventKey={String(subjectIndex)} 
                      key={subjectName}
                      className="border-0 mb-3 shadow-sm"
                    >
                      <Accordion.Header className="py-2">
                        <span style={{ fontSize: "1.25rem" }}>{subjectName}</span>
                      </Accordion.Header>
                      <Accordion.Body className="p-4">
                        <Row className="g-4">
                          {quizzes.map((quiz) => (
                            <Col key={createQuizKey(quiz)} xs={12} md={6} xl={4}>
                              <QuizCard quiz={quiz} />
                            </Col>
                          ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-5 mb-5">
            <Button
              onClick={() => fetchQuestions(offset)}
              disabled={isLoading}
              variant="primary"
              className="px-4 py-1.5"
              style={{ fontSize: "1rem" }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </Container>
    </Layout>
  );
}