// apiService.js

import { executeAjaxOperationStandard } from './commonImports';

export const fetchCountryList = async (token, locale, setGlobalError, setSuccessMessage, setCountries) => {
  try {
      const response = await executeAjaxOperationStandard({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_COUNTRY_LIST,
          method: 'get',
          token,
          locale: locale || 'en',
      });

      if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
          if (response.data && response.data.data && response.data.data.countries) {
              const countryOptions = response.data.data.countries.map(country => ({
                  label: country.name,
                  value: country.code,
              }));
              setCountries(countryOptions);
          } else {
              setCountries([]);
          }
      } else {
          setGlobalError('Failed to fetch country list');
      }
  } catch (error) {
      console.error('Error fetching country list:', error);
      setGlobalError('Error fetching country list');
  }
};

export const fetchStateList = async (token, locale, setGlobalError, setSuccessMessage, setStates) => {
  try {
      const response = await executeAjaxOperationStandard({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_STATE_LIST,
          method: 'get',
          token,
          locale: locale || 'en' // Include country_code in params for state list
      });

      if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
          if (response.data && response.data.data && response.data.data.states) {
              const statesArray = JSON.parse(response.data.data.states);
              const stateOptions = statesArray.map(state => ({
                  label: state.fields.name,
                  value: state.pk,
                  country_code: state.fields.country_code,
              }));
              setStates(stateOptions);
          } else {
              setStates([]);
          }
      } else {
          setGlobalError('Failed to fetch state list');
      }
  } catch (error) {
      console.error('Error fetching state list:', error);
      setGlobalError('Error fetching state list');
  }
};

export const fetchOrganizationCategoryList = async (token, locale, setGlobalError, setSuccessMessage, setOrganizationCategories) => {
  try {
      const response = await executeAjaxOperationStandard({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_ORGANIZATION_CATEGORY_LIST,
          method: 'get',
          token,
          locale: locale || 'en' // Include country_code in params for state list
      });

      if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
          if (response.data && response.data.data && response.data.data.organizational_categories) {
              const organizationalCategoriesArray = JSON.parse(response.data.data.organizational_categories);
              const organizationalCategoriesOptions = organizationalCategoriesArray.map(organizationalCategoriesArrayEach => ({
                  label: organizationalCategoriesArrayEach.fields.name,
                  value: organizationalCategoriesArrayEach.pk
              }));
              setOrganizationCategories(organizationalCategoriesOptions);
          } else {
              setOrganizationCategories([]);
          }
      } else {
          setGlobalError('Failed to fetch organizational categories list');
      }
  } catch (error) {
      console.error('Error fetching organizational categories options list:', error);
      setGlobalError('Error fetching organizational categories list');
  }
};

export const fetchEducationalOrganizations = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setEducationalOrganizations,
  t
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_EDUCATIONAL_ORAGANIZATION,
      method: "get",
      token,
      locale: locale || "en", // Include country_code in params for state list
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        const educationalOrganizationsArray = response.data.data;
        
        const educationalOrganizationsOptions =
          educationalOrganizationsArray.map(
            (educationalOrganizationsArrayEach) => ({
              label: educationalOrganizationsArrayEach.name,
              value: educationalOrganizationsArrayEach.id,
            })
          );
        setEducationalOrganizations(educationalOrganizationsOptions);
      } else {
        setEducationalOrganizations([]);
      }
    } else {
      setGlobalError(t("Failed to fetch educational organization"));
    }
  } catch (error) {
    console.error(
      "Error fetching organizational categories options list:",
      error
    );
    //setGlobalError(t("Error fetching educational organization"));
    setGlobalError("Error fetching educational organization");
  }
};

export const fetchCampuses = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setCampuses
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_CAMPUS,
      method: "get",
      token,
      locale: locale || "en", // Include country_code in params for state list
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        const campusArray = response.data.data;
        const campusOptions = campusArray.map((c) => ({
          label: c.campus_educational_organization,
          value: c.id,
          educational_organization: c.educational_organization,
        }));
        setCampuses(campusOptions);
      } else {
        setCampuses([]);
      }
    } else {
      setGlobalError(t("Failed to fetch campus"));
    }
  } catch (error) {
    console.error(
      "Error fetching organizational categories options list:",
      error
    );
    setGlobalError("Error fetching campus");
  }
};

export const fetchColleges = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setColleges
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_COLLEGE,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        const collegeArray = response.data.data;
        const collegeOption = collegeArray.map((clg) => ({
          label: clg.college_campus_educational_organization,
          value: clg.id,
          campus_id: clg.campus,
        }));
        setColleges(collegeOption);
      } else {
        setColleges([]);
      }
    } else {
      setGlobalError("Failed to fetch colleges");
    }
  } catch (error) {
    console.error("Error fetching colleges options list:", error);
    setGlobalError("Error fetching colleges");
  }
};

export const fetchFacultyMembers = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setFacultymembers,
  faculty = 1 // Default value is 1 if not provided
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_FACULTY_MEMBERS}?faculty=${faculty}`, // Add the query parameter
      method: "get",
      token,
      locale: locale || "en",
    });

    if (
      response.status >=
        parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data) {
        const facultymembersArray = response.data.data;
        const facultymembersOptions = facultymembersArray.map(
          (facultymembersArrayEach) => ({
            label: facultymembersArrayEach.faculty_dept_institute,
            value: facultymembersArrayEach.id,
          })
        );
        setFacultymembers(facultymembersOptions);
      } else {
        setFacultymembers([]);
      }
    } else {
      //setGlobalError("Failed to fetch faculty members");
    }
  } catch (error) {
    console.error("Error fetching facultymembers options list:", error);
    setGlobalError("Error fetching facultymembers");
  }
};


export const fetchFaculty = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setFacultymembers
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_FACULTY_MEMBERS,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
        parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data) {
        const facultymembersArray = response.data;
        const facultymembersOptions = facultymembersArray.map(
          (facultymembersArrayEach) => ({
            label: facultymembersArrayEach.id,
            value: facultymembersArrayEach.id,
          })
        );
        setFacultymembers(facultymembersOptions);
      } else {
        setFacultymembers([]);
      }
    } else {
      setGlobalError("Failed to fetch faculty members");
    }
  } catch (error) {
    console.error("Error fetching facultymembers options list:", error);
    setGlobalError("Error fetching facultymembers");
  }
};

export const fetchBenefitList = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setBenefits
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_BENEFITS,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
        parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        const benefitsArray = response.data.data;
        const benefitsOptions = benefitsArray.map((benefitsArrayEach) => ({
          label: benefitsArrayEach.name,
          value: benefitsArrayEach.id,
        }));
        setBenefits(benefitsOptions);
      } else {
        setBenefits([]);
      }
    } else {
      setGlobalError("Failed to fetch benefits");
    }
  } catch (error) {
    console.error("Error fetching benefits options list:", error);
    setGlobalError("Error fetching benefits");
  }
};

export const fetchDepartmentList = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setDepartments
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_DEPARTMENT,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        const departmentsArray = response.data.data;

        const departmentsOptions = departmentsArray.map(
          (departmentsArrayEach) => ({
            label: departmentsArrayEach.department_college_campus_educational_organization,
            value: departmentsArrayEach.id,
            college_id: departmentsArrayEach.college_id,
            //label: departmentsArrayEach.dept_college_institute,
            //value: departmentsArrayEach.id,
          })
        );
        setDepartments(departmentsOptions);
      } else {
        setDepartments([]);
      }
    } else {
      setGlobalError('Failed to fetch departments');
    }
  } catch (error) {
    console.error("Error fetching departments options list:", error);
    setGlobalError('Error fetching departments');
  }
};

export const fetchUsers = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setUsers
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: `${process.env.NEXT_PUBLIC_API_ENDPOINT_FACULTY_MEMBERS}?users`,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data) {
        const collegeArray = response.data;
        const collegeOption = collegeArray.map((clg) => ({
          label: clg.username,
          value: clg.id,
        }));
        setUsers(collegeOption);
      } else {
        setUsers([]);
      }
    } else {
      setGlobalError("Failed to fetch users");
    }
  } catch (error) {
    console.error("Error fetching colleges options list:", error);
    setGlobalError("Error fetching users");
  }
};

export const fetchDegreeList = async (token, locale, setGlobalError, setSuccessMessage, setDegreeOptions) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_DEGREE_LIST,
      method: 'get',
      token,
      locale: locale || 'en',
    });

    if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
      if (response.data && response.data.data && response.data.data.degrees) {
        const degreeOptions = response.data.data.degrees.map(degree => ({
          name: degree.name,
          id: degree.id,
        }));
        setDegreeOptions(degreeOptions);
      } else {
        setDegreeOptions([]);
      }
    } else {
      setGlobalError('Failed to fetch degree list');
    }
  } catch (error) {
    console.error('Error fetching degree list:', error);
    setGlobalError('Error fetching degree list');
  }
};


export const fetchCustomGroups = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setCustomGroups
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_CUSTOM_GROUP,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      
      if (response.data && response.data.data.custom_groups) {
        const customGroupArray = response.data.data.custom_groups;
        const customGroupsOptions = customGroupArray.map(
          (customGroupsArrayEach) => ({
            label: customGroupsArrayEach.name,
            value: customGroupsArrayEach.id,
            educational_organization: customGroupsArrayEach.organization
          })
        );
        setCustomGroups(customGroupsOptions);
      } else {
        setCustomGroups([]);
      }
    } else {
      setGlobalError('Failed to fetch custom groups');
    }
  } catch (error) {
    console.error("Error fetching custom groups list:", error);
    setGlobalError('Error fetching custom groups');
  }
};




export const fetchUserTypes = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setUserTypes
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_TYPES,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      
      if (response.data && response.data.data.user_types) {
        const userTypeArray = response.data.data.user_types;
        const userTypesOptions = userTypeArray.map(
          (userTypesArrayEach) => ({
            label: userTypesArrayEach.name,
            value: userTypesArrayEach.id
          })
        );
        setUserTypes(userTypesOptions);
      } else {
        setUserTypes([]);
      }
    } else {
      setGlobalError('Failed to fetch user types');
    }
  } catch (error) {
    console.error("Error fetching user types list:", error);
    setGlobalError('Error fetching user types');
  }
};


export const fetchDepartments = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setDepartment
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_API_ENDPOINT_DEPARTMENT,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
      parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        const departmentArray = response.data.data;
        const departmentOption = departmentArray.map((dpt) => ({
          label: dpt.department_college_campus_educational_organization,
          value: dpt.id,
        }));
        setDepartment(departmentOption);
      } else {
        setDepartment([]);
      }
    } else {
      setGlobalError("Failed to fetch Department");
    }
  } catch (error) {
    console.error("Error fetching Department options list:", error);
    setGlobalError("Error fetching Department");
  }
};

export const fetchFundingChoices = async (
  token,
  locale,
  setGlobalError,
  setSuccessMessage,
  setBenefits
) => {
  try {
    const response = await executeAjaxOperationStandard({
      url: process.env.NEXT_PUBLIC_FUNDING_CHOICE,
      method: "get",
      token,
      locale: locale || "en",
    });
    if (
      response.status >=
        parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) &&
      response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)
    ) {
      if (response.data && response.data.data) {
        setBenefits(response.data.data);
      } else {
        setBenefits([]);
      }
    } else {
      setGlobalError("Failed to fetch funding choices");
    }
  } catch (error) {
    console.error("Error fetching funding choices:", error);
    setGlobalError("Error fetching funding choices");
  }
};