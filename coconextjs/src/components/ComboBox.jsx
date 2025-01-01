import * as React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

export default function ComboBox({ data, defaultValue, onValueChange }) {
  return (
    <Autocomplete
      value={defaultValue || { id: "", label: "" }}
      disablePortal
      id="combo-box-demo"
      options={data}
      size="small"
      isOptionEqualToValue={(option, value) => option.id === value.id}
      style={{ width: "100%" }}
      onChange={(e, value) => onValueChange(value)}
      renderOption={(props, option) => <li {...props}>{option["label"]}</li>}
      renderInput={(params) => <TextField {...params} />}
    />
  );
}
