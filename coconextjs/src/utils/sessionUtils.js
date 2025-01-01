// export const saveEducationalBackground = (data) => {
//     sessionStorage.setItem('profile_app_educationalbackground', JSON.stringify(data));
//   };
  
  export const getEducationalBackground = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_educationalbackground'] || [];
};

export const getResearchExperience = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_researchexperience'] || [];
};

export const getSkills = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_skill'] || [];
};

export const getTestScores = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_testscore'] || [];
};

export const getTrainingWorkshops = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_trainingworkshop'] || [];
};

export const getVolunteerActivities = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_volunteeractivity'] || [];
};

export const getWorkExperience = () => {
    const extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
    return extractedData["extracted_data"][0]['profile_app_workexperience'] || [];
};