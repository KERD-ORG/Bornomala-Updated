import Swal from "sweetalert2";
import "react-tooltip/dist/react-tooltip.css";
import { FaClone } from "react-icons/fa6";

const UniversityColumns = ({
  openEditForm,
  openCloneForm,
  openShowView,
  permissionsMap,
  deleteUniversity,
  t,
}) => {
  const confirmDelete = (id) => {
    Swal.fire({
      title: t("Are you sure?"),
      text: t("You will not be able to recover this question!"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t("Yes, delete it!"),
      cancelButtonText: t("Cancel"),
      customClass: {
        popup: "my-swal",
        confirmButton: "my-swal-confirm-button",
        cancelButton: "my-swal-cancel-button",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await deleteUniversity(id);
          if (response.status === "success") {
            Swal.fire(t("Deleted!"), response.message, "success");
          } else {
            throw new Error(response.message || t("Delete operation failed."));
          }
        } catch (error) {
          Swal.fire(
            t("Failed!"),
            error.message || t("Failed to delete the question."),
            "error"
          );
        }
      }
    });
  };

  const formatDate = (dateString) => {
    const dateObject = new Date(dateString);
    const year = dateObject.getFullYear();
    const month = (1 + dateObject.getMonth()).toString().padStart(2, "0");
    const day = dateObject.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const columns = [
    {
      key: "id",
      name: t("ID"),
      sortable: true,
      resizable: true,
      frozen: true,
      renderSummaryCell() {
        return <strong>Total</strong>;
      },
    },
    {
      key: "updated_at",
      name: t("Date"),
      width: "110px",
      frozen: true,
      sortable: true,
      resizable: true,
      renderCell({ row }) {
        return <span>{formatDate(row.details.updated_at)}</span>;
      },
    },
    {
      key: "question_level_name",
      name: t("Question Level"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.question_level_name}</span>;
      },
    },
    {
      key: "target_group_name",
      name: t("Target Group"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.target_group_name}</span>;
      },
    },
    {
      key: "subject_name",
      name: t("Subject"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.target_subject_name}</span>;
      },
    },
    {
      key: "question_type",
      name: t("Question Type"),
      resizable: true,
      sortable: true,
      // renderCell({ row }) {
      //   return <span>{row.details.question_type_name}</span>;
      // },
    },
    {
      key: "topic_name",
      name: t("Topic"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.topic_name}</span>;
      },
    },
    {
      key: "sub_topic_name",
      name: t("Sub Topic"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.sub_topic_name}</span>;
      },
    },
    {
      key: "sub_sub_topic_name",
      name: t("Sub Sub Topic"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.sub_sub_topic_name}</span>;
      },
    },
    {
      key: "difficulty_level_name",
      name: t("Difficulty Level"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.difficulty_level_name}</span>;
      },
    },
    {
      key: "target_organization_name",
      name: t("Target Organization"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.target_organization_name}</span>;
      },
    },
    {
      key: "question_text",
      name: t("Question Text"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{row.details.question_text}</span>;
      },
      width: "180px",
    },
    {
      key: "correct_answer",
      name: t("Correct Answer"),
      resizable: true,
      sortable: true,
      renderCell({ row }) {
        return <span>{JSON.stringify(row.details.ordering_sequence || row.details.matching_pairs || row.details.correct_answer)}</span>;
      },
    },
    {
      key: "options",
      name: t("MCQ Options"),
      resizable: true,
      sortable: false,
      renderCell({ row }) {
        // Render MCQ options as a comma-separated list or similar
        return row.details.options ? row.details.options.join(", ") : "";
      },
    },
    {
      key: "action",
      name: t("Action"),
      width: "180px",
      resizable: true,
      renderCell(props) {
        const { row } = props;
        return (
          <>
            {permissionsMap.permissionlist.change_questiontype && (
              <button
                className="btn btn-sm btn-icon"
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Edit")}
                data-tooltip-place="top"
                onClick={() => openEditForm(row)}
              >
                <i className="bx bx-edit text-warning"></i>
              </button>
            )}
            {permissionsMap.permissionlist.add_questiontype && (
              <button
                className="btn btn-icon"
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Clone")}
                data-tooltip-place="top"
                onClick={() => openCloneForm(row)}
              >
                <i className="bx bx-copy text-success"></i>
              </button>
            )}
            {permissionsMap.permissionlist.view_questiontype && (
              <button
                className="btn btn-icon"
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Details")}
                data-tooltip-place="top"
                onClick={() => openShowView(row)}
              >
                <i className="bx bx-detail text-info"></i>
              </button>
            )}
            {permissionsMap.permissionlist.delete_questiontype && (
              <button
                className="btn btn-sm btn-icon"
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Delete")}
                data-tooltip-place="top"
                onClick={() => confirmDelete(row.id)}
              >
                <i className="bx bx-trash text-danger"></i>
              </button>
            )}
          </>
        );
      },
    },
  ];

  return columns;
};

export default UniversityColumns;
