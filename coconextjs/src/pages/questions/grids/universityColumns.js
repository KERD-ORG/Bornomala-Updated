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
      renderCell(props) {
        const { row } = props;
        return <span>{formatDate(row.updated_at)}</span>;
      },
      renderSummaryCell({ row }) {
        return `${row.totalCount} records`;
      },
    },
    {
      key: "name",
      name: t("Name"),
      width: "130px",
      resizable: true,
      sortable: true,
    },
    {
      key: "under_category_name",
      name: t("Category"),
      width: "95px",
      resizable: true,
      sortable: true,
    },
    {
      key: "web_address",
      name: t("Web Address"),
      width: "180px",
      resizable: true,
      sortable: true,
    },
    {
      key: "country_name",
      name: t("Country"),
      width: "130px",
      resizable: true,
      sortable: true,
    },
    {
      key: "state_province_name",
      name: t("State"),
      width: "130px",
      resizable: true,
      sortable: true,
    },
    {
      key: "city",
      name: t("City"),
      width: "100px",
      resizable: true,
      sortable: true,
    },
    {
      key: "address_line1",
      name: t("Address Line 1"),
      width: "150px",
      resizable: true,
      sortable: true,
    },
    {
      key: "address_line2",
      name: t("Address Line 2"),
      width: "150px",
      resizable: true,
      sortable: true,
    },
    {
      key: "postal_code",
      name: t("Postal Code"),
      resizable: true,
      sortable: true,
    },
    {
      key: "status",
      name: t("Status"),
      width: "100px",
      resizable: true,
      renderCell(props) {
        const { row } = props;
        return (
          <span
            className={`badge badge-pill ${
              row.status ? "bg-success" : "bg-danger"
            }`}
            style={{ borderRadius: "2px", fontSize: "10px" }}
          >
            {row.status ? t("Active") : t("Inactive")}
          </span>
        );
      },
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
            {permissionsMap.permissionlist.change_question && (
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
            {permissionsMap.permissionlist.add_question && (
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
            {permissionsMap.permissionlist.view_question && (
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
            {permissionsMap.permissionlist.delete_question && (
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
