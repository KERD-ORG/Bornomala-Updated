// pages/profile/subpages/personal-details.jsx
import { React, useRef, useState, useCallback, useEffect, useRouter, axios, getToken, executeAjaxOperation, executeAjaxOperationStandard, profileTabOrder, PrevNextButtons, Select, CreatableSelect, useTranslation, Loader, CustomAlert } from '../../../utils/commonImports';
import BiographicInfo from './tabs/personal-details/biographic-info';
import ContactInfo from './tabs/personal-details/contact-info';
import CitizenshipInfo from './tabs/personal-details/citizenship-info';
import VisaInfo from './tabs/personal-details/visa-info';
import EthnicityInfo from './tabs/personal-details/ethnicity-info';
import OtherInfo from './tabs/personal-details/other-info';
import AcknowledgementInfo from './tabs/personal-details/acknowledgement-info';
import useCommonForm from '../../../hooks/useCommonForm';


const PersonalDetails = () => {
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
        previousTab,
        nextTab,

    } = useCommonForm();


    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [ethnicitys, setEthnicitys] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [biographicInfoDetails, setBiographicInfoDetails] = useState(null);
    const [contactInfoDetails, setContactInfoDetails] = useState(null);
    const [citizenshipInfoDetails, setCitizenshipInfoDetails] = useState(null);
    const [ethnicityInfoDetails, setEthnicityInfoDetails] = useState(null);
    const [otherInfoDetails, setOtherInfoDetails] = useState(null);
    const [acknowledgementInfoDetails, setAcknowledgementInfoDetails] = useState(null);


    useEffect(() => {
        const fetchedToken = getToken();
        if (!fetchedToken) {
            router.push(process.env.NEXT_PUBLIC_URL_SIGNIN);
        } else {
            setToken(fetchedToken);
        }
    }, [router]);

    useEffect(() => {
        if (token) {
            fetchCountryList();
            fetchStateList();
            fetchEthnicityList();
            fetchLanguageList();
            fetchUserBiographicInfoDetails();
            fetchUserContactInfoDetails();
            fetchUserEthnicityInfoDetails();
            fetchUserOtherInfoDetails();
            fetchUserAcknowledgementInfoDetails();
        }
    }, [token]);


    const handleChangeBiographicInfo = (e) => {
        const { name, value } = e.target;
        setBiographicInfoDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleChangeContactInfo = (e) => {
        const { name, value } = e.target;
        setContactInfoDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleChangeCitizenshipInfo = (e) => {
        const { name, value } = e.target;
        setCitizenshipInfoDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleChangeEthnicityInfo = (e) => {
        const { name, value } = e.target;
        setEthnicityInfoDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleChangeOtherInfo = (e) => {
        const { name, value } = e.target;
        setOtherInfoDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleChangeAcknowledgementInfo = (e) => {
        const { name, value } = e.target;
        setAcknowledgementInfoDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const fetchCountryList = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_COUNTRY_LIST,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.data && response.data.status) {
                setGlobalError('');
                setSuccessMessage('');
                if (response.data.data.countries) {
                    const countryOptions = response.data.data.countries.map(country => ({
                        label: country.name,
                        value: country.code,
                    }));
                    setCountries(countryOptions);
                }
            } else {
                setSuccessMessage('');
                setGlobalError(response.message || t('An error occurred while fetching countries.'));
            }

        } catch (error) {
            console.log(error);
            setSuccessMessage('');
            setGlobalError(t('An error occurred while fetching countries.'));
        }
    };

    const fetchStateList = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_STATE_LIST,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
                setGlobalError('');
                setSuccessMessage('');

                if (response.data.data.states) {
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
                setSuccessMessage('');
                setGlobalError(response.data.message || t('An error occurred while fetching states.'));
            }
        } catch (error) {
            console.error('Error fetching states:', error);
            setSuccessMessage('');
            setGlobalError(t('An error occurred while fetching states.'));
        }
    };


    const fetchEthnicityList = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_ETHINICITY_LIST,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
                setGlobalError('');
                setSuccessMessage('');

                if (response.data.data.ethnicitys) {
                    console.log(response.data.data.ethnicitys);
                    const ethnicityArray = response.data.data.ethnicitys;
                    const ethnicityOptions = ethnicityArray.map(ethnicity => ({
                        label: ethnicity.name,
                        value: ethnicity.id,
                    }));
                    setEthnicitys(ethnicityOptions);
                } else {
                    setEthnicitys([]);
                }
            } else {
                setSuccessMessage('');
                setGlobalError(response.message || t('An error occurred while fetching ethnicitys.'));
            }
        } catch (error) {
            console.error('Error fetching states:', error);
            setSuccessMessage('');
            setGlobalError(t('An error occurred while fetching ethnicitys.'));
        }
    };


    const fetchLanguageList = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_LANGUAGE_LIST,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            if (response.status >= parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_START, 10) && response.status < parseInt(process.env.NEXT_PUBLIC_HTTP_SUCCESS_END, 10)) {
                setGlobalError('');
                setSuccessMessage('');

                if (response.data.data.languages) {
                    const languagesArray = JSON.parse(response.data.data.languages);
                    const languageOptions = languagesArray.map(language => ({
                        label: language.fields.properties_name,
                        value: language.pk,
                    }));

                    setLanguages(languageOptions);
                } else {
                    setLanguages([]);
                }
            } else {
                setSuccessMessage('');
                setGlobalError(response.message || t('An error occurred while fetching languages.'));
            }
        } catch (error) {
            console.error('Error fetching states:', error);
            setSuccessMessage('');
            setGlobalError(t('An error occurred while fetching languages.'));
        }
    };




    const fetchUserBiographicInfoDetails = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_BIOGRAPHIC_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || locale,
            });
            setBiographicInfoDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const fetchUserContactInfoDetails = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_CONTACT_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || locale,
            });
            setContactInfoDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };


    const fetchUserEthnicityInfoDetails = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_ETHNICITY_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });
            setEthnicityInfoDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };


    const fetchUserOtherInfoDetails = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_OTHER_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            setOtherInfoDetails(response.data.data);

        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const fetchUserAcknowledgementInfoDetails = async () => {
        try {
            const response = await executeAjaxOperationStandard({
                url: process.env.NEXT_PUBLIC_API_ENDPOINT_USER_ACKNOWLEDGEMENT_INFO_DETAILS,
                method: 'get',
                token,
                locale: router.locale || 'en',
            });

            setAcknowledgementInfoDetails(response.data.data);

        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const handleNavigation = (targetTab) => {
        const tabElement = document.querySelector(`[href="#${targetTab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    };

    const [activeTab, setActiveTab] = useState('form-tabs-biographic');

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
    };

    return (
        <div>
            <style jsx>{`
                .tab-content {
                    background: white;
                }
            `}</style>

            <h4 className="mb-4">
                <span className="text-muted fw-light">{t('Profile')} /</span> {t('Personal Details')}
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
            <div>
                <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-biographic' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-biographic')} role="tab" aria-selected={activeTab === 'form-tabs-biographic'}>{t('Bio Info')}</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-contact' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-contact')} role="tab" aria-selected={activeTab === 'form-tabs-contact'}>{t('Contact Info')}</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-citizenship' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-citizenship')} role="tab" aria-selected={activeTab === 'form-tabs-citizenship'}>{t('Citizenship Info')}</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-visa' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-visa')} role="tab" aria-selected={activeTab === 'form-tabs-visa'}>{t('Visa Info')}</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-ethnicity' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-ethnicity')} role="tab" aria-selected={activeTab === 'form-tabs-ethnicity'}>{t('Ethnicity')}</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-other' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-other')} role="tab" aria-selected={activeTab === 'form-tabs-other'}>{t('Other Info')}</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className={`nav-link ${activeTab === 'form-tabs-acknowledgement' ? 'active' : ''}`} onClick={() => handleTabClick('form-tabs-acknowledgement')} role="tab" aria-selected={activeTab === 'form-tabs-acknowledgement'}>{t('Acknowledgement')}</button>
                    </li>
                </ul>
                <div className="tab-content">
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-biographic' ? 'show active' : ''}`} id="form-tabs-biographic" role="tabpanel">


                        <BiographicInfo
                            biographicInfoDetails={biographicInfoDetails}
                            setBiographicInfoDetails={setBiographicInfoDetails}
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            fetchUserBiographicInfoDetails={fetchUserBiographicInfoDetails}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeBiographicInfo}
                        />



                    </div>
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-contact' ? 'show active' : ''}`} id="form-tabs-contact" role="tabpanel">

                        <ContactInfo
                            countries={countries}
                            states={states}
                            contactInfoDetails={contactInfoDetails}
                            setContactInfoDetails={setContactInfoDetails}
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            fetchUserContactInfoDetails={fetchUserContactInfoDetails}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeContactInfo}
                        />

                    </div>
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-citizenship' ? 'show active' : ''}`} id="form-tabs-citizenship" role="tabpanel">

                        <CitizenshipInfo
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeCitizenshipInfo}
                        />

                    </div>
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-visa' ? 'show active' : ''}`} id="form-tabs-visa" role="tabpanel">

                        <VisaInfo
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeCitizenshipInfo}
                        />

                    </div>
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-ethnicity' ? 'show active' : ''}`} id="form-tabs-ethnicity" role="tabpanel">

                        <EthnicityInfo
                            ethnicitys={ethnicitys}
                            ethnicityInfoDetails={ethnicityInfoDetails}
                            setEthnicityInfoDetails={setEthnicityInfoDetails}
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            fetchUserEthnicityInfoDetails={fetchUserEthnicityInfoDetails}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeEthnicityInfo}
                        />

                    </div>
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-other' ? 'show active' : ''}`} id="form-tabs-other" role="tabpanel">


                        <OtherInfo
                            languages={languages}
                            otherInfoDetails={otherInfoDetails}
                            setOtherInfoDetails={setEthnicityInfoDetails}
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            fetchUserOtherInfoDetails={fetchUserOtherInfoDetails}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeOtherInfo}
                        />


                    </div>
                    <div className={`tab-pane fade ${activeTab === 'form-tabs-acknowledgement' ? 'show active' : ''}`} id="form-tabs-acknowledgement" role="tabpanel">

                    <AcknowledgementInfo
    
                            acknowledgementInfoDetails={acknowledgementInfoDetails}
                            setAcknowledgementInfoDetails={setAcknowledgementInfoDetails}
                            setLoading={setLoading}
                            setGlobalError={setGlobalError}
                            setSuccessMessage={setSuccessMessage}
                            fetchUserAcknowledgementInfoDetails={fetchUserAcknowledgementInfoDetails}
                            token={token}
                            t={t}
                            router={router}
                            handleChange={handleChangeAcknowledgementInfo}
                    />
                    </div>
                </div>

            </div>

            <PrevNextButtons
                previousTab={previousTab}
                nextTab={nextTab}
                handleNavigation={handleNavigation}
            />

            {loading && <Loader />}
        </div>
    );
};

export default PersonalDetails;
