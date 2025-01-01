import { useState, useEffect } from 'react';

export default function UniversityForm({ mode, onSubmit, initialData, errors }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null); 

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
    } else {
      resetForm();
    }
  }, [mode, initialData]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFile(null); 
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    if (file) {
      formData.append('document', file); //
    }  

    onSubmit(formData); 
    //onSubmit({ name, description });
    //resetForm();
  };
  

  const handleSubmit_ = (event) => {
    event.preventDefault();
    onSubmit({ name, description });
    resetForm();
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); 
  };

  return (
    <form onSubmit={handleSubmit} className="add-new-record pt-0 row g-2 fv-plugins-bootstrap5 fv-plugins-framework"
                            id="form-add-new-record">
      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="name">
          Name
        </label>
        <div className="input-group input-group-merge has-validation">
          <span className="input-group-text">
            <i className="bx bx-user" />
          </span>
          <input
            type="text"
            id="name"
            className="form-control dt-full-name"
            name="name"
            placeholder="University of Idaho"
            aria-label="University of Idaho"
            value={name}
            onChange={(e) => setName(e.target.value)}
            
          />
          {errors?.name && <div className="invalid-feedback d-block">{errors.name}</div>}
        </div>
     
        <div className="fv-plugins-message-container invalid-feedback" />
      </div>

      <div className="col-sm-12 fv-plugins-icon-container">
        <label className="form-label" htmlFor="description">
          Description
        </label>
        <div className="input-group input-group-merge has-validation">
          <textarea
            id="description"
            className="form-control"
            aria-label="With textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
             {errors?.description && <div className="invalid-feedback d-block">{errors.description}</div>}
        </div>
        <div className="fv-plugins-message-container invalid-feedback" />
      </div>

      <div className="col-sm-12">
        <label className="form-label" htmlFor="fileUpload">
          Upload File
        </label>
        <input
          type="file"
          id="fileUpload"
          name="fileUpload"
          onChange={handleFileChange}
          className="form-control"
        />
      </div>

      <div className="col-sm-12">
        <button
          type="submit"
          className="btn btn-primary data-submit me-sm-3 me-1 btn-sm"
        >
          Submit
        </button>
        <button
          type="reset"
          className="btn btn-outline-secondary btn-sm"
          data-bs-dismiss="offcanvas"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
