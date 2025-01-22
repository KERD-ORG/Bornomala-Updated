import * as yup from "yup";
import { executeAjaxOperationStandard } from "./fetcher";

export const MAX_OPTIONS = 8;
export const EXPLANATION_LEVELS = ["Preliminary", "Intermediate", "Advanced"];

export const QuestionSchema = yup.object().shape({
  question_text: yup.string(), //required("Question Text is required"),
  correct_answer: yup.mixed().when("question_type", (question_type, schema) => {
    switch (question_type[0]) {
      case "MCQ_SINGLE":
        return yup
          .number()
          .typeError("Select a valid answer")
          .required("Select one correct answer");
      case "MCQ_MULTI":
        return yup
          .array()
          .of(yup.number().typeError("Each answer must be a number"))
          .min(1, "Select at least one correct answer");
      case "NUMERICAL":
        return yup
          .number()
          .typeError("Correct Answer must be a number")
          .required("Correct Answer is required");
      case "MATCHING":
        return yup.string().required("Correct answer mapping is required");
      default:
        return yup.string().notRequired();
    }
  }),
  ordering_sequence: yup.array().when("question_type", {
    is: (val) => val === "ORDERING",
    then: () =>
      yup
        .array()
        .transform((value) =>
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value
        )
        .of(yup.string().required("Ordering items cannot be empty"))
        .min(2, "At least two items are required"),
    otherwise: () => yup.array().notRequired(),
  }),
  target_subject: yup.string().required("Subject is required"),
  exam_references: yup.array(),
  question_type: yup.string().required("Question Type is required"),
  topic: yup.string().required("Topic is required"),
  sub_topic: yup.string(),
  difficulty_level: yup.string().required("Difficulty Level is required"),
  options: yup.array().when("question_type", {
    is: (val) => ["MCQ_SINGLE", "MCQ_MULTI"].includes(val),
    then: () =>
      yup
        .array()
        .of(
          yup.object({
            option_text: yup.string().required("Option text cannot be empty"),
          })
        )
        .min(2, "At least two options are required"),
    otherwise: () => yup.array().notRequired(),
  }),
  options_column_a: yup.array().when("question_type", {
    is: (val) => val == "MATCHING",
    then: () =>
      yup
        .array()
        .transform((value) =>
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value
        )
        .of(yup.string().required())
        .min(1, "At least one option required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  options_column_b: yup.array().when("question_type", {
    is: (val) => val == "MATCHING",
    then: () =>
      yup
        .array()
        .transform((value) =>
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value
        )
        .of(yup.string().required())
        .min(1, "At least one option required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  image_url: yup.string().when("question_type", {
    is: (val) => val === "IMAGE",
    then: () => yup.string().required("Image upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  diagram_url: yup.string().when("question_type", {
    is: (val) => val === "DIAGRAM",
    then: () => yup.string().required("Diagram upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  audio_url: yup.string().when("question_type", {
    is: (val) => val === "AUDIO",
    then: () => yup.string().required("Audio upload is required"),
    otherwise: () => yup.mixed().notRequired(),
  }),
  target_group: yup.string().required("Target Group is required"),
});

export const FetchDropdownData = async (token) => {
  if (!token) return;
  const endpoints = {
    questionLevels: "api/question-levels",
    organizations: "api/organizations",
    targetGroups: "api/target-groups",
    subjects: "api/subjects",
    questionTypes: "api/question-types",
    topics: "api/topics",
    examReferences: "api/exam-references",
    questionStatuses: "api/question-statuses",
    difficultyLevels: "api/difficulty-levels",
    subTopics: "api/subtopics",
    subSubTopics: "api/subsubtopics",
  };

  try {
    const promises = Object.entries(endpoints).map(([key, endpoint]) =>
      executeAjaxOperationStandard({
        url: `/${endpoint}/`,
        method: "get",
        token,
      })
    );

    const results = await Promise.all(promises);
    const newData = {};
    let index = 0;
    for (let key in endpoints) {
      const response = results[index];
      if (response && response.status >= 200 && response.status < 300) {
        const data = response.data;
        newData[key] = data.map((item) => ({
          ...item,
          value: item.id,
          label: item.name || item.reference_name || item.title || "",
        }));
      } else {
        newData[key] = [];
      }
      index++;
    }
    return newData;
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
  }
};

export const ExtractDetailedErrorMessage = (details, path = "") => {
  if (!details || typeof details !== "object") return null;

  for (const key in details) {
    const currentPath = path ? `${path} -> ${key}` : key;

    if (Array.isArray(details[key])) {
      // Handle arrays that contain strings or objects
      for (const item of details[key]) {
        if (typeof item === "string") {
          return `${currentPath}: ${item}`; // Found a string error
        } else if (typeof item === "object") {
          const nestedError = ExtractDetailedErrorMessage(item, currentPath);
          if (nestedError) return nestedError;
        }
      }
    } else if (typeof details[key] === "object") {
      // Handle nested objects
      const nestedError = ExtractDetailedErrorMessage(
        details[key],
        currentPath
      );
      if (nestedError) return nestedError;
    } else if (typeof details[key] === "string") {
      // Direct string error
      return `${currentPath}: ${details[key]}`;
    }
  }

  return null;
};
