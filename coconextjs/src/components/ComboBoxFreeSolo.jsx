import React, { useState } from "react";
import {
  Autocomplete,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  createFilterOptions,
  DialogActions,
  Button,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { executeAjaxOperation } from "@/utils/fetcher";
import { getToken } from "@/utils/auth";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import Loader from "./Loader";
import CustomAlert from "@/utils/CustomAlert";

const filter = createFilterOptions();

export default function ComboBoxFreeSolo({
  defaultValue,
  type = "Country",
  data,
  onValueChange,
  onNewItemAdded,
  ...restProps
}) {
  const [open, setOpen] = useState(false);
  const [dialogValue, setDialogValue] = useState({ name: "", code: "" });
  const { t } = useTranslation("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = dialogValue.name.trim();
    const trimmedCode = dialogValue.code.trim();

    if (!trimmedName) {
      setNameError(t("Name is required"));
    }

    if (!trimmedCode) {
      if (type === "Category") {
        setCodeError(t("Description is required"));
      } else setCodeError(t("Code is required"));
    }
    if (!trimmedCode || !trimmedName) {
      return;
    }

    if (trimmedName.length > 255) {
      setNameError(t("Name cannot exceed 255 characters"));
      return;
    }

    if (type !== "Category" && trimmedCode.length > 100) {
      setCodeError(t("Code cannot exceed 100 characters"));
      return;
    }

    const urlMap = {
      Country: `${process.env.NEXT_PUBLIC_API_ENDPOINT_COUNTRY}`,
      State: `${process.env.NEXT_PUBLIC_API_ENDPOINT_GEO_ADMIN_1}`,
      City: `${process.env.NEXT_PUBLIC_API_ENDPOINT_GEO_ADMIN_2}`,
      Category: `${process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION_CATEGORY}`,
    };

    const dataMap = {
      Country: {
        country_name: trimmedName,
        country_code: trimmedCode,
      },
      State: {
        geo_admin_1_code: trimmedCode,
        geo_admin_1_name: trimmedName,
        country: restProps.country,
      },
      City: {
        geo_admin_2_name: trimmedName,
        geo_admin_2_code: trimmedCode,
        country: restProps.country,
        geo_admin_1: restProps.geo_admin_1,
      },
      Category: {
        name: trimmedName,
        description: trimmedCode,
      },
    };

    try {
      setLoading(true);
      const res = await executeAjaxOperation({
        url: urlMap[type],
        method: "POST",
        token: getToken(),
        data: dataMap[type],
        locale: router.locale || locale,
      });

      if (res.success) {
        let newType = "";
        let newItem = {};
        switch (type) {
          case "Country":
            newType = "countries";
            newItem = {
              id: res.data.id,
              name: res.data.country_name,
              code: res.data.country_code,
            };
            break;
          case "State":
            newType = "states";
            newItem = {
              id: res.data.id,
              name: res.data.geo_admin_1_name,
              code: res.data.geo_admin_1_code,
            };
            break;
          case "Category":
            newType = "categories";
            newItem = {
              id: res.data.id,
              name: res.data.name,
              code: res.data.description,
            };
            break;
          case "City":
            newType = "cities";
            newItem = {
              id: res.data.id,
              name: res.data.geo_admin_2_name,
              code: res.data.geo_admin_2_code,
              country: res.data.country,
              geo_admin_1: res.data.geo_admin_1,
            };
            break;
          default:
            newType = "items";
            newItem = {
              id: res.data.id,
              name: res.data.name,
              code: res.data.code,
            };
            break;
        }

        onNewItemAdded(newType, newItem);
        setDialogValue({ name: "", code: "" });
        setOpen(false);
      } else {
        onNewItemAdded("error", t("Duplicate code found. Code must be unique"));
      }
    } catch (error) {
      console.log(error);
      onNewItemAdded("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Autocomplete
        value={defaultValue || { name: "", code: "" }}
        onChange={(event, newValue) => {
          if (typeof newValue === "string") {
            setTimeout(() => {
              setOpen(true);
              setDialogValue({ name: newValue, code: "" });
            });
          } else if (newValue && newValue.inputValue) {
            setOpen(true);
            setDialogValue({ name: newValue.inputValue, code: "" });
          } else {
            onValueChange(newValue);
          }
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          if (params.inputValue !== "") {
            filtered.push({
              inputValue: params.inputValue,
              name: t("Add: ") + `"${params.inputValue}"`,
            });
          }

          return filtered;
        }}
        id={`free-solo-dialog-demo-${type}`}
        options={data}
        getOptionLabel={(option) => {
          return typeof option === "string"
            ? option
            : option.name
            ? option.name
            : "";
        }}
        renderOption={(props, option) => <li {...props}>{option.name}</li>}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        freeSolo
        disabled={restProps.disabled}
        size="small"
        style={{ width: "100%" }}
        renderInput={(params) => (
          <TextField {...params} placeholder={restProps.placeholder} />
        )}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        disablePortal
        fullWidth
        style={{ minWidth: "450px !important" }}
      >
        <form style={{ minWidth: "450px" }}>
          <DialogTitle>{t(`Add a new ${type}`)}</DialogTitle>
          <DialogContent style={{ minWidth: "450px" }}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              value={dialogValue.name}
              onChange={(event) => {
                let value = event.target.value.replace(/\d/g, ""); // Remove all digits
                if (value.length > 255) {
                  setNameError(t("Name cannot exceed 255 characters"));
                }
                setDialogValue({ ...dialogValue, name: value });
              }}
              label={t(`${type} name`)}
              type="text"
              fullWidth
            />
            {nameError && (
              <CustomAlert
                message={nameError}
                type="danger"
                onClose={() => setNameError("")}
                dismissable={true}
                timer={2000}
              />
            )}
            <TextField
              margin="dense"
              id="code"
              value={dialogValue.code}
              onChange={(event) => {
                const value = event.target.value;
                if (value.length > 100 && type !== "Category") {
                  setCodeError(t("Code cannot exceed 100 characters"));
                }
                setDialogValue({ ...dialogValue, code: value });
              }}
              label={type === "Category" ? t("Description") : t(`${type} code`)}
              type="text"
              fullWidth
            />
            {codeError && (
              <CustomAlert
                message={codeError}
                type="danger"
                onClose={() => setCodeError("")}
                dismissable={true}
                timer={2000}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>{t("Cancel")}</Button>
            <Button type="submit" onClick={handleSubmit}>
              {t("Add")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {loading && <Loader />}
    </>
  );
}
