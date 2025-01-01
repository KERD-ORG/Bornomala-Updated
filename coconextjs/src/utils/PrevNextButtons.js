import React from 'react';
import { useTranslation } from 'next-i18next';

const PrevNextButtons = ({ previousTab, nextTab, handleNavigation }) => {
    const { t } = useTranslation('common'); 

    const handlePrevClick = () => {
        handleNavigation(previousTab); // Navigate to the previous tab
    };

    const handleNextClick = () => {
        handleNavigation(nextTab); // Navigate to the next tab
    };

    return (
        <div className="card tour-card mt-3">
            <div className="card-body">
                <div className="col-12 d-flex justify-content-between">
                    <button
                        type="button"
                        className="btn btn-label-secondary btn-sm btn-prev"
                        disabled={!previousTab}
                        onClick={handlePrevClick} // Handle Previous button click
                    >
                        <i className="bx bx-chevron-left ms-sm-n2"></i>
                        <span className="align-middle d-sm-inline-block d-none">{t("Previous")}</span>
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm btn-next"
                        disabled={!nextTab}
                        onClick={handleNextClick} // Handle Next button click
                    >
                        <span className="align-middle d-sm-inline-block d-none me-sm-1">{t("Next")}</span>
                        <i className="bx bx-chevron-right me-sm-n2"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrevNextButtons;
