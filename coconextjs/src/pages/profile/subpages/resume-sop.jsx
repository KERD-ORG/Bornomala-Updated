// pages/profile/subpages/resume-sop.jsx

import {
    React,
    useState,
    useEffect,
    executeAjaxOperationStandard,
    getToken,
    PrevNextButtons,
    Loader,
    CustomAlert,
    CommonModal,
} from '../../../utils/commonImports';
import useCommonForm from '../../../hooks/useCommonForm';

import Resume from './resume';
import SOP from './sop'; // Import SOP component similar to Resume

const ResumeSOP = () => {

    const {
        t,
        router,
        loading,
        setLoading,
        globalError,
        setGlobalError,
        successMessage,
        setSuccessMessage,
        token,
        setToken,
        tab,
        currentIndex,
        previousTab,
        nextTab,

    } = useCommonForm();

    const [resumeData, setResumeData] = useState(null); // State to store existing resume data
    const [showResumeUpload, setShowResumeUpload] = useState(false); // State to toggle resume upload field
    const [sopData, setSopData] = useState(null); // State to store existing SOP data
    const [showSopUpload, setShowSopUpload] = useState(false); // State to toggle SOP upload field
    const [extractedData, setExtractedData] = useState(null); // State to store extracted data
    const [showModal, setShowModal] = useState(false); // State to toggle the modal



    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
        } else {
            setToken(fetchedToken); // Set the token in state
            fetchUserData(fetchedToken); // Fetch existing resume and SOP data
        }
    }, []);

    // Function to fetch existing resume and SOP data
    const fetchUserData = async (token) => {
        try {
            // Fetch resume data
            const responseResume = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_RESUME_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (responseResume.data.data.resume) {
                setResumeData(responseResume.data.data.resume);
            }

        } catch (error) {
            console.error('Error fetching resume data:', error);
        }

        try {
            // Fetch SOP data
            const responseSop = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_SOP_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (responseSop.data.data.sop) {
                setSopData(responseSop.data.data.sop);
            }

        } catch (error) {
            console.error('Error fetching SOP data:', error);

        }
    };


    // Callback for successful resume upload
    const handleResumeUploadSuccess = (data) => {
        if (data && data.status === 'success') {
            setSuccessMessage(data.message);
            setGlobalError('');
            setExtractedData(data.data); // Store the extracted data
            setShowModal(true); // Show the modal for user confirmation
            fetchUserData(token); // Refresh user data after successful upload
            setShowResumeUpload(false); // Automatically switch to modify state
        } else {
            if (data.message) {
                setGlobalError(data.message || t('An error occurred.'));
            } else {
                setGlobalError(data || t('An error occurred.'));
            }
            setSuccessMessage('');
        }
    };

    // Callback for successful SOP upload
    const handleSopUploadSuccess = (data) => {
        if (data && data.status === 'success') {
            setSuccessMessage(data.message);
            setGlobalError('');
            fetchUserData(token); // Refresh user data after successful upload
            setShowSopUpload(false); // Automatically switch to modify state
        } else {
            if (data.message) {
                setGlobalError(data.message || t('An error occurred.'));
            } else {
                setGlobalError(data || t('An error occurred.'));
            }
            setSuccessMessage('');
        }
    };
    //  // Function to save extracted data to session storage
    //  const saveExtractedDataToSession = () => {
    //     sessionStorage.setItem('extractedData', JSON.stringify(extractedData));
    //     setSuccessMessage(t('Data saved to session storage successfully.'));
    //     setShowModal(false);
    // };
    // Handle user confirmation to save extracted data
    const handleSaveExtractedData = async () => {
        setLoading(true);
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_SAVE_EXTRACTED_DATA,
                method: 'post',
                token,
                data: extractedData,
                locale: router.locale || 'en',
            }); 

            if (response.status === 200) {
                setSuccessMessage(t('Data saved successfully.'));
                setGlobalError('');
                setShowModal(false); // Close the modal
            } else {
                setGlobalError(t('An error occurred while saving data.'));
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Error saving extracted data:', error);
            setGlobalError(t('An error occurred while saving data.'));
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };



    const handleNavigation = (targetTab) => {
        const tabElement = document.querySelector(`[href="#${targetTab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    };
    const handleInputChange = (section, index, key, value) => {
        setExtractedData((prevData) => {
            // Copy the previous data object
            const newData = { ...prevData };
    
            // Access the first item in the 'extracted_data' array
            const firstItem = { ...newData.extracted_data[0] };
    
            // Copy the section (e.g., 'profile_app_educationalbackground') which is an array
            const sectionData = [...firstItem[section]];
    
            // Update the specific field in the item
            const updatedItem = { ...sectionData[index], [key]: value };
            sectionData[index] = updatedItem; // Replace the updated item
    
            // Update the section in the first item
            firstItem[section] = sectionData;
    
            // Update the 'extracted_data' array in the main data object
            newData.extracted_data[0] = firstItem;
    
            return newData; // Return the updated data object
        });
    };
    const formatSectionTitle = (section) => {
        const sectionTitleMap = {
            educationalbackground: 'Educational Background',
            researchexperience: 'Research Experience',
            skill: 'Skills',
            testscore: 'Test Scores',
            trainingworkshop: 'Training & Workshops',
            userdetails: 'User Details',
            volunteeractivity: 'Volunteer Activity',
            workexperience: 'Work Experience',
            // Add more mappings as needed
        };
    
        return sectionTitleMap[section] || section.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };
    const renderFormSection = (sectionTitle, sectionData, handleInputChange) => (
        <div className="com-md-12">
            {sectionData.map((item, index) => (
                <form key={index} className="mb-3">
                    <div className="row">
                        {Object.entries(item).map(([key, value], i) => (
                            <div className="col-md-6 mb-1" key={i}>
                                <label htmlFor={key} className="form-label">{t(key)}</label>
                                <input
                                    type="text"
                                    id={key}
                                    className="form-control form-control-sm"
                                    value={value}
                                    readOnly={true}
                                    onChange={(e) => handleInputChange(sectionTitle, index, key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </form>
            ))}
        </div>
    );
    
    
    const renderExtractedData = () => {
        if (!extractedData || extractedData.length === 0) return null;
    
        const data = extractedData['extracted_data'][0]; // Accessing the first item in extracted_data since it's an array
    
        return (
            <div>
            <h5>Do you want to save this data? You will be able update this data in specific tabs.</h5>
            <br />
                {Object.keys(data).map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-3">
                        <h6>{t(formatSectionTitle(section))}</h6>
                        {Array.isArray(data[section]) && data[section].length > 0 ? (
                            renderFormSection(formatSectionTitle(section), data[section], handleInputChange)
                        ) : (
                            <p>{t('No data available')}</p>
                        )}
                        <hr />
                    </div>
                ))} 
                <div className="d-flex justify-content-between">
                   
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('Close')}</button>
                    <button className="btn btn-primary" onClick={handleSaveExtractedData}>{t('Save Data')}</button>
            </div>            </div>
        );
    };
    

    return (
        <div>
            <style>
                {`
                .cancelButton {
                    float: right;
                    margin-top: -27px;
                }
                `}
            </style>
            <h4 className="mb-4">
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Resume and SOP')}
            </h4>
            {globalError && (
                <CustomAlert
                    message={globalError}
                    dismissable={true}
                    timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
                    onClose={() => setGlobalError('')}
                    type="danger"
                />
            )}
            {successMessage && (
                <CustomAlert
                    message={successMessage}
                    dismissable={true}
                    timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
                    onClose={() => setSuccessMessage('')}
                    type="success"
                />
            )}
            <div className="row">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{t('Resume')}</h5>
                            {resumeData && !showResumeUpload ? (



                                <div className="mb-2">

                                    <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${resumeData.url}`} className='btn btn-sm btn-label-info me-sm-2 me-1' target="_blank" rel="noopener noreferrer">
                                        {t('View Uploaded Resume')}
                                    </a>
                                    <button className="btn btn-sm btn-warning" onClick={() => setShowResumeUpload(true)}>{t('Edit')}</button>

                                </div>

                            ) : (
                                <Resume onReply={handleResumeUploadSuccess} token={token} locale={router.locale} />
                            )}
                            {showResumeUpload && (
                                <button className="btn btn-outline-danger btn-sm me-2 cancelButton" onClick={() => setShowResumeUpload(false)}>{t('Cancel')}</button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{t('SOP')}</h5>
                            {sopData && !showSopUpload ? (
                                <div className="mb-2">

                                    <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${sopData.url}`} className='btn btn-sm btn-label-info me-sm-2 me-1' target="_blank" rel="noopener noreferrer" >
                                        {t('View Uploaded SOP')}
                                    </a>
                                    <button className="btn btn-sm btn-warning" onClick={() => setShowSopUpload(true)}>{t('Edit')}</button>

                                </div>

                            ) : (
                                <SOP onReply={handleSopUploadSuccess} token={token} locale={router.locale} />
                            )}
                            {showSopUpload && (
                                <button className="btn btn-secondary btn-sm me-2 cancelButton" onClick={() => setShowSopUpload(false)}>{t('Cancel')}</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <PrevNextButtons previousTab={previousTab} nextTab={nextTab} handleNavigation={handleNavigation} />
            {loading && <Loader />}
            <CommonModal
                title={t('Data we got from your resume!')}
                formComponent={renderExtractedData()}
                showModal={showModal}
                closeModal={() => setShowModal(false)}
            />
        </div>
    );
};

export default ResumeSOP;