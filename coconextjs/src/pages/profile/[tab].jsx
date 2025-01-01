// pages/profile/[tab].jsx
import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import ResumeSOP from './subpages/resume-sop'; // Import tab components
import PersonalDetails from './subpages/personal-details';
import ResearchInterests from './subpages/research-interests';
import AcademicHistory from './subpages/academic-history';
import Dissertation from './subpages/dissertation';
import ResearchExperience from './subpages/research-experience';
import Publication from './subpages/publication';
import WorkExperience from './subpages/work-experience';
import Skill from './subpages/skill';
import TrainingWorkshop from './subpages/training-workshop';
import AwardGrantScholarships from './subpages/award-grant-scholarships';
import TestScore from './subpages/test-score';
import VolunteerActivities from './subpages/volunteer-activities';
import AdditionalDocuments from './subpages/additional-documents';
import References from './subpages/references';
import ContactInformation from './subpages/contact-information';
import OthersInformation from './subpages/others-information';
import Acknowledgement from './subpages/acknowledgement';

const Profile = ({ locale }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [activeMenuItem, setActiveMenuItem] = useState(router.query.tab || 'resume-sop');

    const handleMenuItemClick = (menuItem) => {
        setActiveMenuItem(menuItem);
        router.push(`/profile/${menuItem}`);
    };

    // Map activeMenuItem to corresponding component
    const tabComponents = {
        'resume-sop': <ResumeSOP />,
        'personal-details': <PersonalDetails />,
        'research-interests': <ResearchInterests />,
        'academic-history': <AcademicHistory />,
        'dissertation': <Dissertation />,
        'research-experience': <ResearchExperience />,
        'publication': <Publication />,
        'work-experience': <WorkExperience />,
        'skill': <Skill />,
        'training-workshop': <TrainingWorkshop />,
        'award-grant-scholarships': <AwardGrantScholarships />,
        'test-score': <TestScore />,
        'volunteer-activities': <VolunteerActivities />,
        'additional-documents': <AdditionalDocuments />,
        'references': <References />,
        'contact-information': <ContactInformation />,
        'others-information': <OthersInformation />,
        'acknowledgement': <Acknowledgement />,
    };


    return (
        <Layout>
            <Head>
                <title>{t("My Profile")}</title>
                <meta name='description' content={t("My Profile description")} />
                {/* Include Bootstrap Icons CSS */}
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet" />
            </Head>
            <style jsx>{`
                .list-group-item {
                    --bs-list-group-bg: white; /* Override background color */
                }
                .main-content {
                    min-height: calc(100vh - 56px); /* 56px is an example of the height of your header/navbar, adjust as needed */
                }
                .card {
                    height: 100%; /* Set card height to 100% to fill the parent container */
                }
            `}</style>
            <div className="row">
                <div className="col-lg-3 mb-4 order-0">



                    <div className="list-group" role="tablist">
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'resume-sop' ? 'active' : ''}`}
                            href="#resume-sop"
                            onClick={() => handleMenuItemClick('resume-sop')}
                        >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            {t("Resume and SOP")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'personal-details' ? 'active' : ''}`}
                            href="#personal-details"
                            onClick={() => handleMenuItemClick('personal-details')}
                        >
                            <i className="bi bi-person me-2"></i>
                            {t("Personal Details")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'research-interests' ? 'active' : ''}`}
                            href="#research-interests"
                            onClick={() => handleMenuItemClick('research-interests')}
                        >
                            <i className="bi bi-lightbulb me-2"></i>
                            {t("Research Interests")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'academic-history' ? 'active' : ''}`}
                            href="#academic-history"
                            onClick={() => handleMenuItemClick('academic-history')}
                        >
                            <i className="bi bi-journal-text me-2"></i>
                            {t("Academic History")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'dissertation' ? 'active' : ''}`}
                            href="#dissertation"
                            onClick={() => handleMenuItemClick('dissertation')}
                        >
                            <i className="bi bi-file-earmark-bar-graph me-2"></i>
                            {t("Dissertation")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'research-experience' ? 'active' : ''}`}
                            href="#research-experience"
                            onClick={() => handleMenuItemClick('research-experience')}
                        >
                            <i className="bi bi-journal-medical me-2"></i>
                            {t("Research Experience")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'publication' ? 'active' : ''}`}
                            href="#publication"
                            onClick={() => handleMenuItemClick('publication')}
                        >
                            <i className="bi bi-journal-bookmark me-2"></i>
                            {t("Publication")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'work-experience' ? 'active' : ''}`}
                            href="#work-experience"
                            onClick={() => handleMenuItemClick('work-experience')}
                        >
                            <i className="bi bi-briefcase me-2"></i>
                            {t("Work Experience")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'skill' ? 'active' : ''}`}
                            href="#skill"
                            onClick={() => handleMenuItemClick('skill')}
                        >
                            <i className="bi bi-tools me-2"></i>
                            {t("Skill")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'training-workshop' ? 'active' : ''}`}
                            href="#training-workshop"
                            onClick={() => handleMenuItemClick('training-workshop')}
                        >
                            <i className="bi bi-briefcase me-2"></i>
                            {t("Training and Workshop")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'award-grant-scholarships' ? 'active' : ''}`}
                            href="#award-grant-scholarships"
                            onClick={() => handleMenuItemClick('award-grant-scholarships')}
                        >
                            <i className="bi bi-award me-2"></i>
                            {t("Award, Grant and Scholarships")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'test-score' ? 'active' : ''}`}
                            href="#test-score"
                            onClick={() => handleMenuItemClick('test-score')}
                        >
                            <i className="bi bi-card-checklist me-2"></i>
                            {t("Test Score")}
                        </a>
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'volunteer-activities' ? 'active' : ''}`}
                            href="#volunteer-activities"
                            onClick={() => handleMenuItemClick('volunteer-activities')}
                        >
                            <i className="bi bi-people-fill me-2"></i>

                            {t("Volunteer Activities")}
                        </a>
                        
                        <a
                            className={`list-group-item list-group-item-action ${activeMenuItem === 'references' ? 'active' : ''}`}
                            href="#references"
                            onClick={() => handleMenuItemClick('references')}
                        >
                            <i className="bi bi-person-lines-fill me-2"></i>
                            {t("References")}
                        </a>
                        
                        {/* Add more menu items as needed */}
                    </div>



                </div>
                <div className="col-lg-9 mb-4 order-1 main-content">
                    {/* Main content */}

                    {tabComponents[activeMenuItem]}
                    

                </div>
            </div>
        </Layout>
    );
};

// Server-side props for internationalization
export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}

// Define the layout for the Profile component
Profile.layout = 'default';

// Export the Profile component
export default Profile;
