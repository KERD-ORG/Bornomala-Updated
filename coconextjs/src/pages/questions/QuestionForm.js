import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const QuestionForm = () => {
  const [formData, setFormData] = useState({
    question_text: '',
    explanation: '',
    correct_answer: '',
    question_level: '',
    target_group: '',
    target_subject: '',
    question_type: '',
    topic: '',
    sub_topic: '',
    exam_references: [],
    question_status: false,
    difficulty_level: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for dropdown options
  const [dropdownData, setDropdownData] = useState({
    questionLevels: [],
    targetGroups: [],
    subjects: [],
    questionTypes: [],
    topics: [],
    subTopics: [],
    examReferences: [],
    difficultyLevels: []
  });

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const endpoints = {
        questionLevels: '/question-levels/',
        targetGroups: '/target-groups/',
        subjects: '/subjects/',
        questionTypes: '/question-types/',
        topics: '/topics/',
        subTopics: '/subtopics/',
        examReferences: '/exam-references/',
        difficultyLevels: '/difficulty-levels/'
      };

      const responses = await Promise.all(
        Object.entries(endpoints).map(async ([key, endpoint]) => {
          const response = await fetch(`http://127.0.0.1:8000/api${endpoint}`, {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`
            }
          });
          if (!response.ok) throw new Error(`Failed to fetch ${key}`);
          const data = await response.json();
          return [key, data];
        })
      );

      const newDropdownData = Object.fromEntries(responses);
      setDropdownData(newDropdownData);
    } catch (err) {
      setError('Failed to fetch dropdown data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/questions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to submit question');

      setSuccess('Question created successfully!');
      setFormData({
        question_text: '',
        explanation: '',
        correct_answer: '',
        question_level: '',
        target_group: '',
        target_subject: '',
        question_type: '',
        topic: '',
        sub_topic: '',
        exam_references: [],
        question_status: false,
        difficulty_level: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="question_text">Question Text</Label>
            <Input
              id="question_text"
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation</Label>
            <Input
              id="explanation"
              name="explanation"
              value={formData.explanation}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correct_answer">Correct Answer</Label>
            <Input
              id="correct_answer"
              name="correct_answer"
              value={formData.correct_answer}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="question_level">Question Level</Label>
              <Select
                id="question_level"
                name="question_level"
                value={formData.question_level}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                {dropdownData.questionLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select
                id="difficulty_level"
                name="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleChange}
                required
              >
                <option value="">Select Difficulty</option>
                {dropdownData.difficultyLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_group">Target Group</Label>
              <Select
                id="target_group"
                name="target_group"
                value={formData.target_group}
                onChange={handleChange}
                required
              >
                <option value="">Select Group</option>
                {dropdownData.targetGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_subject">Subject</Label>
              <Select
                id="target_subject"
                name="target_subject"
                value={formData.target_subject}
                onChange={handleChange}
                required
              >
                <option value="">Select Subject</option>
                {dropdownData.subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Create Question'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;