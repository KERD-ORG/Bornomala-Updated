// pages/profile/subpages/others-information.jsx
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { profileTabOrder } from '../../../utils/tabConfig'; // Adjust the import path as needed
import PrevNextButtons from '../../../utils/PrevNextButtons';

const OthersInformation = () => {
    const router = useRouter();
    const { tab } = router.query;
    const formRef = useRef(null);

    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save the form data
        console.log('Form submitted');
        // Perform form data saving logic here
    };
    const handleNavigation = (targetTab) => {
        // Trigger form submission programmatically
        if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            // Only navigate if form is valid and submission is successful
            if (!formRef.current.querySelector(':invalid')) {
                const tabElement = document.querySelector(`[href="#${targetTab}"]`);
                if (tabElement) {
                    tabElement.click();
                }
            }
        }
    };


    return (

        <div>
            <h4 className="mb-4">
                <span className="text-muted fw-light">Profile /</span> Others Information
            </h4>
            <div className="card">
                <div className="card-body">

                    <form ref={formRef} onSubmit={handleSubmit}>


                    </form>

                </div>
            </div>
            <PrevNextButtons
                previousTab={previousTab}
                nextTab={nextTab}
                handleNavigation={handleNavigation}
            />
        </div>

    );
};

export default OthersInformation;
