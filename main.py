import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Select from 'react-select';
import {toast} from 'react-toastify';
import './CreateQuestion.css'; // Optional: Create and import CSS for styling

const CreateQuestion = () => {
    const BASE_URL = process.env.REACT_APP_BASE_URL;
    const TOKEN = process.env.REACT_APP_API_TOKEN;

    // State for form fields
    const [questionText, setQuestionText] = useState('');
    const [explanation, setExplanation] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState([]);
    const [questionLevel, setQuestionLevel] = useState(null);
    const [targetOrganization, setTargetOrganization] = useState(null);
    const [targetGroup, setTargetGroup] = useState(null);
    const [targetSubject, setTargetSubject] = useState(null);
    const [questionType, setQuestionType] = useState(null);
    const [topic, setTopic] = useState(null);
    const [subTopic, setSubTopic] = useState(null);
    const [subSubTopic, setSubSubTopic] = useState('');
    const [examReferences, setExamReferences] = useState([]);
    const [questionStatus, setQuestionStatus] = useState(null);
    const [difficultyLevel, setDifficultyLevel] = useState(null);
    const [mcqOptions, setMcqOptions] = useState([{option_text: ''}, {option_text: ''}]);

    // Dropdown data
    const [dropdownData, setDropdownData] = useState({
        questionLevels: [],
        organizations: [],
        targetGroups: [],
        subjects: [],
        questionTypes: [],
        topics: [],
        examReferences: [],
        questionStatuses: [],
        difficultyLevels: []
    });

    // Fetch dropdown data on component mount
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const headers = {
                    Authorization: `Token ${TOKEN}`,
                    'Content-Type': 'application/json',
                };

                const endpoints = [
                    'question-levels',
                    'organizations',
                    'target-groups',
                    'subjects',
                    'question-types',
                    'topics',
                    'exam-references',
                    'question-statuses',
                    'difficulty-levels'
                ];

                const promises = endpoints.map((endpoint) =>
                    axios.get(`${BASE_URL}/${endpoint}/`, {headers})
                );

                const results = await Promise.all(promises);

                console.log(results);

                const keys = Object.keys(dropdownData);
                const newData = results.reduce((acc, result, index) => {

                    console.log("key", keys, "res", results);

                    acc[keys[index]] = result.data.map((item) => ({
                        value: item.id,
                        label: item.name || item.reference_name
                    }));
                    return acc;
                }, {});

                setDropdownData(newData);
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
                toast.error('Failed to load dropdown data.');
            }
        };

        fetchDropdownData();
    }, [BASE_URL, TOKEN]);

    // Fetch subtopics when topic changes
    useEffect(() => {
        const fetchSubTopics = async () => {
            if (topic) {
                try {
                    const headers = {
                        Authorization: `Token ${TOKEN}`,
                        'Content-Type': 'application/json',
                    };
                    const response = await axios.get(`${BASE_URL}/subtopics/?topic=${topic.value}`, {headers});
                    setDropdownData((prev) => ({
                        ...prev,
                        subTopics: response.data.map((sub) => ({value: sub.id, label: sub.name}))
                    }));
                } catch (error) {
                    console.error('Error fetching subtopics:', error);
                    toast.error('Failed to load subtopics.');
                }
            } else {
                setDropdownData((prev) => ({...prev, subTopics: []}));
                setSubTopic(null);
            }
        };

        fetchSubTopics();
    }, [topic, BASE_URL, TOKEN]);

    // Handle MCQ options
    const handleMCQChange = (index, value) => {
        const updatedOptions = [...mcqOptions];
        updatedOptions[index].option_text = value;
        setMcqOptions(updatedOptions);
    };


    // Render Correct Answer Field
    const renderCorrectAnswerField = () => {
    if (questionType?.label === 'Multiple Choice') {
        // Multiple Choice (select one or multiple options)
        return (
            <div className="form-group">
                <label htmlFor="correctAnswer" className="label">
                    Correct Answer:
                </label>
                <Select
                    id="correctAnswer"
                    value={mcqOptions
                        .map((opt, idx) => ({ value: idx, label: opt.option_text }))
                        .filter((opt) => correctAnswer.includes(opt.value))}
                    onChange={(selectedOptions) =>
                        setCorrectAnswer(selectedOptions ? selectedOptions.map((opt) => opt.value) : [])
                    }
                    options={mcqOptions.map((opt, idx) => ({ value: idx, label: opt.option_text }))}
                    placeholder="-- Select Correct Answer(s) --"
                    styles={customStyles}
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    required
                />
            </div>
        );
    } else {
        // Other question types (input field for text-based answers)
        return (
            <div className="form-group">
                <label htmlFor="correctAnswer" className="label">
                    Correct Answer:
                </label>
                <input
                    type="text"
                    id="correctAnswer"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="input"
                    placeholder="Enter the correct answer"
                    required
                />
            </div>
        );
    }
};


    const addMCQOption = () => {
        setMcqOptions([...mcqOptions, {option_text: ''}]);
    };

    const removeMCQOption = (index) => {
        if (mcqOptions.length > 2) {
            const updatedOptions = mcqOptions.filter((_, idx) => idx !== index);
            setMcqOptions(updatedOptions);
        } else {
            toast.error('At least two options are required.');
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !questionText ||
            !explanation ||
            !correctAnswer ||
            !questionLevel ||
            !targetOrganization ||
            !targetGroup ||
            !targetSubject ||
            !questionType ||
            !topic ||
            !questionStatus ||
            !difficultyLevel ||
            mcqOptions.some((option) => !option.option_text)
        ) {
            toast.error('Please fill in all required fields and ensure all options have text.');
            return;
        }

        const newQuestion = {
            question_text: questionText,
            explanation,
            correct_answer: correctAnswer,
            question_level: questionLevel.value,
            target_organization: targetOrganization.value,
            target_group: targetGroup.value,
            target_subject: targetSubject.value,
            question_type: questionType.value,
            topic: topic.value,
            sub_topic: subTopic? subTopic.value:null,
            sub_sub_topic: subSubTopic ? parseInt(subSubTopic) : null,
            exam_references: examReferences.map((ref) => parseInt(ref.value)),
            question_status: questionStatus.value,
            difficulty_level: difficultyLevel.value,
            mcq_options: mcqOptions
        };

        try {
            const headers = {
                Authorization: `Token ${TOKEN}`,
                'Content-Type': 'application/json',
            };
            await axios.post(`${BASE_URL}/questions/`, newQuestion, {headers});
            toast.success('Question created successfully!');

            // Reset form fields
            setQuestionText('');
            setExplanation('');
            setCorrectAnswer('');
            setQuestionLevel(null);
            setTargetOrganization(null);
            setTargetGroup(null);
            setTargetSubject(null);
            setQuestionType(null);
            setTopic(null);
            setSubTopic(null);
            setSubSubTopic('');
            setExamReferences([]);
            setQuestionStatus(null);
            setDifficultyLevel(null);
            setMcqOptions([{option_text: ''}, {option_text: ''}]);
        } catch (error) {
            console.error('Error creating question:', error);
            const errorMsg =
                error.response?.data?.detail ||
                (error.response?.data && typeof error.response.data === 'object'
                    ? JSON.stringify(error.response.data)
                    : error.response?.data) ||
                'Failed to create question.';
            toast.error(`Error: ${errorMsg}`);
        }
    };

    const customStyles = {
        control: (provided) => ({
            ...provided,
            borderColor: '#ced4da',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#80bdff',
            },
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#e2e6ea',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#495057',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#495057',
            ':hover': {
                backgroundColor: '#ced4da',
                color: '#212529',
            },
        }),
    };

    return (
        <div className="create-question-container">
            <h2>Create a New Question</h2>
            <form onSubmit={handleSubmit} className="form">

                {/* Question Text */}
                <div className="form-group">
                    <label htmlFor="questionText" className="label">
                        Question Text:
                    </label>
                    <textarea
                        id="questionText"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="textarea"
                        required
                    />
                </div>

                {/* Explanation */}
                <div className="form-group">
                    <label htmlFor="explanation" className="label">
                        Explanation:
                    </label>
                    <textarea
                        id="explanation"
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        className="textarea"
                        required
                    />
                </div>

                {renderCorrectAnswerField()}

                {/* MCQ Options */}
                {mcqOptions.map((option, index) => (
                    <div key={index} className="form-group">
                        <label>Option {index + 1}:</label>
                        <input
                            type="text"
                            value={option.option_text}
                            onChange={(e) => handleMCQChange(index, e.target.value)}
                            className="input"
                            required
                        />
                        {mcqOptions.length > 2 && (
                            <button
                                type="button"
                                onClick={() => removeMCQOption(index)}
                                className="remove-option-button"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addMCQOption} className="add-option-button">
                    Add Option
                </button>

                {/* Question Level */}
                <div className="form-group">
                    <label htmlFor="questionLevel" className="label">
                        Question Level:
                    </label>
                    <Select
                        id="questionLevel"
                        value={questionLevel}
                        onChange={setQuestionLevel}
                        options={dropdownData.questionLevels}
                        placeholder="-- Select Question Level --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Target Organization */}
                <div className="form-group">
                    <label htmlFor="targetOrganization" className="label">
                        Target Organization:
                    </label>
                    <Select
                        id="targetOrganization"
                        value={targetOrganization}
                        onChange={setTargetOrganization}
                        options={dropdownData.organizations}
                        placeholder="-- Select Organization --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Target Group */}
                <div className="form-group">
                    <label htmlFor="targetGroup" className="label">
                        Target Group:
                    </label>
                    <Select
                        id="targetGroup"
                        value={targetGroup}
                        onChange={setTargetGroup}
                        options={dropdownData.targetGroups}
                        placeholder="-- Select Target Group --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Target Subject */}
                <div className="form-group">
                    <label htmlFor="targetSubject" className="label">
                        Target Subject:
                    </label>
                    <Select
                        id="targetSubject"
                        value={targetSubject}
                        onChange={setTargetSubject}
                        options={dropdownData.subjects}
                        placeholder="-- Select Target Subject --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Question Type */}
                <div className="form-group">
                    <label htmlFor="questionType" className="label">
                        Question Type:
                    </label>
                    <Select
                        id="questionType"
                        value={questionType}
                        onChange={setQuestionType}
                        options={dropdownData.questionTypes}
                        placeholder="-- Select Question Type --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Topic */}
                <div className="form-group">
                    <label htmlFor="topic" className="label">
                        Topic:
                    </label>
                    <Select
                        id="topic"
                        value={topic}
                        onChange={setTopic}
                        options={dropdownData.topics}
                        placeholder="-- Select Topic --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* SubTopic */}
                {/*<div className="form-group">*/}
                {/*  <label htmlFor="subTopic" className="label">*/}
                {/*    SubTopic:*/}
                {/*  </label>*/}
                {/*  <Select*/}
                {/*    id="subTopic"*/}
                {/*    value={subTopic}*/}
                {/*    onChange={setSubTopic}*/}
                {/*    options={dropdownData.subTopics}*/}
                {/*    placeholder="-- Select SubTopic --"*/}
                {/*    styles={customStyles}*/}
                {/*    isClearable*/}
                {/*    isDisabled={!topic}*/}
                {/*    required*/}
                {/*  />*/}
                {/*</div>*/}

                {/* SubSubTopic */}
                {/*<div className="form-group">*/}
                {/*  <label htmlFor="subSubTopic" className="label">*/}
                {/*    SubSubTopic (Optional):*/}
                {/*  </label>*/}
                {/*  <input*/}
                {/*    type="number"*/}
                {/*    id="subSubTopic"*/}
                {/*    value={subSubTopic}*/}
                {/*    onChange={(e) => setSubSubTopic(e.target.value)}*/}
                {/*    className="input"*/}
                {/*    placeholder="Enter SubSubTopic ID if applicable"*/}
                {/*  />*/}
                {/*</div>*/}

                {/* Exam References */}
                <div className="form-group">
                    <label htmlFor="examReferences" className="label">
                        Exam References (Select Multiple):
                    </label>
                    <Select
                        id="examReferences"
                        value={examReferences}
                        onChange={setExamReferences}
                        options={dropdownData.examReferences}
                        placeholder="-- Select Exam References --"
                        styles={customStyles}
                        isMulti
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        required
                    />
                </div>

                {/* Question Status */}
                <div className="form-group">
                    <label htmlFor="questionStatus" className="label">
                        Question Status:
                    </label>
                    <Select
                        id="questionStatus"
                        value={questionStatus}
                        onChange={setQuestionStatus}
                        options={dropdownData.questionStatuses}
                        placeholder="-- Select Question Status --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Difficulty Level */}
                <div className="form-group">
                    <label htmlFor="difficultyLevel" className="label">
                        Difficulty Level:
                    </label>
                    <Select
                        id="difficultyLevel"
                        value={difficultyLevel}
                        onChange={setDifficultyLevel}
                        options={dropdownData.difficultyLevels}
                        placeholder="-- Select Difficulty Level --"
                        styles={customStyles}
                        isClearable
                        required
                    />
                </div>

                {/* Submit Button */}
                <button type="submit" className="button">
                    Create Question
                </button>
            </form>
        </div>
    );
};

export default CreateQuestion;
