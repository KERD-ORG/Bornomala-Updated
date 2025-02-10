import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import useCommonForm from "@/hooks/useCommonForm";
import Head from "next/head";
import Navheader from "@/components/header";
import Layout from "@/components/layout";

export default function JobsList() {
  const { token } = useCommonForm();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Filter states ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch jobs on mount (once we have a token)
  useEffect(() => {
    if (!token) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("http://127.0.0.1:8000/api/circulars/", {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}`);
        }

        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [token]);

  // Gather unique categories and statuses from the job list
  const categories = Array.from(
    new Set(jobs.map((job) => job.category?.name).filter(Boolean))
  );
  const statuses = Array.from(
    new Set(jobs.map((job) => job.status).filter(Boolean))
  );

  // Helper function to check if a job's publication_date is in our date range
  const isWithinDateRange = (publicationDate) => {
    if (!publicationDate) return true; // If there's no date, let's not exclude it
    const jobDate = new Date(publicationDate);
    if (fromDate && jobDate < new Date(fromDate)) return false;
    if (toDate && jobDate > new Date(toDate)) return false;
    return true;
  };

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    // 1) Search
    const sTerm = searchTerm.toLowerCase();
    const title = job.title?.toLowerCase() || "";
    const catName = job.category?.name?.toLowerCase() || "";
    const matchesSearch = title.includes(sTerm) || catName.includes(sTerm);

    // 2) Category
    const matchesCategory =
      selectedCategory === "All" || catName === selectedCategory.toLowerCase();

    // 3) Status
    const jobStatus = job.status?.toLowerCase() || "";
    const matchesStatus =
      selectedStatus === "All" || jobStatus === selectedStatus.toLowerCase();

    // 4) Publication Date
    const withinDates = isWithinDateRange(job.publication_date);

    return matchesSearch && matchesCategory && matchesStatus && withinDates;
  });

  // Loading/Error UI
  if (loading) {
    return (
      <div className="p-4 d-flex justify-content-center">
        <Spinner animation="border" role="status" />
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-danger">{error}</div>;
  }

  // MAIN RENDER
  return (
    <Layout>
      <div className="p-4">
        <Head>
          <title>Available Jobs | Job Portal</title>
          <meta
            name="description"
            content="Find the latest available job circulars and apply now!"
          />
        </Head>
        <h1 className="mb-4">Available Jobs</h1>

        {/* Filter Controls */}
        <Form className="mb-3">
          <Row className="g-3">
            {/* Search by title or category */}
            <Col xs={12} md={3}>
              <Form.Control
                type="text"
                placeholder="Search (title/category)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>

            {/* Category Filter */}
            <Col xs={6} md={2}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Status Filter */}
            <Col xs={6} md={2}>
              <Form.Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {statuses.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Date Range Filters (publication_date) */}
            <Col xs={6} md={2}>
              <Form.Control
                type="date"
                placeholder="From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Col>
            <Col xs={6} md={2}>
              <Form.Control
                type="date"
                placeholder="To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Col>
          </Row>
        </Form>

        {/* Filtered Jobs */}
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredJobs.map((job) => (
            <Col key={job.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{job.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Category: {job.category?.name || "-"}
                  </Card.Subtitle>
                  <Card.Text>
                    Publication Date: {job.publication_date || "-"}
                  </Card.Text>
                  <Card.Text>Deadline: {job.deadline || "-"}</Card.Text>
                  <Card.Text>Status: {job.status || "-"}</Card.Text>

                  <Link href={`/jobs/${job.id}`} passHref>
                    <Button variant="primary">View Details</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* If no matches */}
        {filteredJobs.length === 0 && !loading && (
          <div className="mt-4">No matching jobs found.</div>
        )}
      </div>
    </Layout>
  );
}
