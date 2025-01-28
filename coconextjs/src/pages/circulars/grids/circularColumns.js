import Swal from "sweetalert2";
import "react-tooltip/dist/react-tooltip.css";

const CircularColumns = ({
  openEditForm,
  openCloneForm,
  openShowView,
  permissionsMap,
  deleteCircular,
  t,
}) => {
  const confirmDelete = (id) => {
    Swal.fire({
      title: t("Are you sure?"),
      text: t("You will not be able to recover this circular!"),
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
          const response = await deleteCircular(id);
          if (response.status === "success") {
            Swal.fire(t("Deleted!"), response.message, "success");
          } else {
            throw new Error(response.message || t("Delete operation failed."));
          }
        } catch (error) {
          Swal.fire(
            t("Failed!"),
            error.message || t("Failed to delete the circular."),
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
      renderCell(props) {
        const { row } = props;
        return <span>{formatDate(row.updated_at)}</span>;
      },
    },
    {
      key: "title",
      name: t("Title"),
      width: "130px",
      resizable: true,
      sortable: true,
    },
    {
      key: "category",
      name: t("Category"),
      width: "95px",
      resizable: true,
      sortable: true,
      renderCell(props) {
        const { row } = props;
        return <span>{row.category.name}</span>;
      },
    },
    {
      key: "link_to_circular",
      name: t("Circular Link"),
      width: "180px",
      resizable: true,
      sortable: true,
    },
    {
      key: "organization_name",
      name: t("Organization"),
      width: "180px",
      resizable: true,
      sortable: true,
    },
    {
      key: "publication_date",
      name: t("Publication Date"),
      width: "150px",
      resizable: true,
      sortable: true,
      renderCell(props) {
        const { row } = props;
        return <span>{formatDate(row.publication_date)}</span>;
      },
    },
    {
      key: "deadline",
      name: t("Deadline"),
      width: "150px",
      resizable: true,
      sortable: true,
      renderCell(props) {
        const { row } = props;
        return <span>{formatDate(row.deadline)}</span>;
      },
    },
    {
      key: "location",
      name: t("Location"),
      resizable: true,
      sortable: true,
    },
    {
      key: "start_date",
      name: t("Start Date"),
      width: "150px",
      resizable: true,
      sortable: true,
      renderCell(props) {
        const { row } = props;
        return <span>{formatDate(row.start_date)}</span>;
      },
    },
    {
      key: "end_date",
      name: t("End Date"),
      width: "150px",
      resizable: true,
      sortable: true,
      renderCell(props) {
        const { row } = props;
        return <span>{formatDate(row.end_date)}</span>;
      },
    },
    {
      key: "status",
      name: t("Status"),
      width: "100px",
      resizable: true,
      sortable: true,
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
            {permissionsMap.permissionlist.change_circular && (
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
            {permissionsMap.permissionlist.add_circular && (
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
            {permissionsMap.permissionlist.view_circular && (
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
            {permissionsMap.permissionlist.delete_circular && (
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

export default CircularColumns;
