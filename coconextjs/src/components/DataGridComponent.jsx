import React, {
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";
import DataGrid from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { isLoggedIn, getToken } from "../utils/auth";
import {
  executeAjaxOperationStandard,
  useRouter,
} from "../utils/commonImports";
import { useTranslation } from "react-i18next";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const DataGridComponent = forwardRef(
  ({ endpoint, columns, offset, limit, t, initialData = undefined }, ref) => {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sortColumns, setSortColumns] = useState([
      { columnKey: "updated_at", direction: "DESC" },
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const token = getToken();
    const router = useRouter();

    useEffect(() => {
      if (initialData) {
        setRows(initialData);
      } else loadInitialData();
    }, [token, offset, limit, initialData]);

    async function loadInitialData() {
      if (!isLoggedIn()) {
        return;
      }
      setIsLoading(true);
      try {
        const initialData = await fetchData(token, offset, limit);
        setRows(initialData);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchData(token, offset, limit, searchTerm = "") {
      try {
        let url = `${endpoint}?offset=${offset}&limit=${limit}`;
        if (searchTerm) {
          url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        }
        const response = await executeAjaxOperationStandard({
          url: url,
          method: "get",
          token,
          locale: router.locale || "en",
        });
        // console.log(response )
        if (
          response.status >=
            parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
          response.status <
            parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
        ) {
          return response.data.data;
        } else {
          return [];
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        return [];
      }
    }

    async function deleteRow(id) {
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    }

    async function addRow(newRow) {
      setRows((prevRows) => [newRow, ...prevRows]);
    }

    function isAtBottom(event) {
      return (
        event.currentTarget.scrollTop + event.currentTarget.clientHeight >=
        event.currentTarget.scrollHeight
      );
    }

    async function handleScroll(event) {
      if (isLoading || !isAtBottom(event)) return;
      setIsLoading(true);
      try {
        const newRows = await fetchData(token, rows.length, limit, searchTerm);
        setRows((prevRows) => [...prevRows, ...newRows]);
      } catch (error) {
        console.error("Error loading more data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    const handleSort = (newSortColumns) => {
      setSortColumns(newSortColumns);
    };

    const handleSearch = async (event) => {
      const { value } = event.target;
      setSearchTerm(value);
      try {
        setIsLoading(true);
        const searchData = await fetchData(token, 0, limit, value);
        setRows(searchData);
      } catch (error) {
        console.error("Error searching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const renderHeaderCell = (column) => {
      const isSorted =
        sortColumns.length > 0 && sortColumns[0].columnKey === column.key;
      const sortIconClass = `bi bi-sort-alpha-${
        isSorted ? sortColumns[0].direction.toLowerCase() : "down"
      }`;

      return (
        <div className="d-flex align-items-center">
          <span>{column.name}</span>
          {isSorted && (
            <i className={sortIconClass} style={{ marginLeft: "5px" }}></i>
          )}
        </div>
      );
    };

    const sortedRows = useMemo(() => {
      if (sortColumns.length === 0) return rows;

      const sortedData = [...rows];
      const { columnKey, direction } = sortColumns[0];

      sortedData.sort((a, b) => {
        if (a[columnKey] > b[columnKey]) return direction === "ASC" ? 1 : -1;
        if (a[columnKey] < b[columnKey]) return direction === "ASC" ? -1 : 1;
        return 0;
      });

      return sortedData;
    }, [rows, sortColumns]);

    useImperativeHandle(
      ref,
      () => ({
        deleteRow: deleteRow,
        addRow: addRow,
      }),
      []
    );

    return (
      <>
        {!initialData && (
          <div className="row">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t("Search")}
                value={searchTerm}
                onChange={handleSearch}
                style={{ marginBottom: "10px" }}
              />
            </div>
          </div>
        )}
        <DataGrid
          style={{ height: 430, resize: "vertical" }}
          columns={columns.map((column) => ({
            ...column,
            key: column.key,
            headerRenderer: () => renderHeaderCell(column),
          }))}
          rows={sortedRows}
          rowKeyGetter={(row, index) => {
            if (row.id === undefined || row.id === null) {
              // Generate a unique key using index and other fallback methods
              return `row-${index}-${Math.random().toString(36).substr(2, 9)}`;
            }
            return row.id;
          }}
          rowHeight={40}
          onScroll={handleScroll}
          onSortColumnsChange={handleSort}
          sortColumns={sortColumns}
          className="fill-grid"
        />
        <Tooltip id="my-tooltip" />
        {isLoading && (
          <div className="loading-more-rows">Loading more rows...</div>
        )}
      </>
    );
  }
);

DataGridComponent.propTypes = {
  endpoint: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired,
  offset: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
};

export default DataGridComponent;
