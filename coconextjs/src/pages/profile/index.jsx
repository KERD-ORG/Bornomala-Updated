// pages/profile/index.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Profile = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the default tab (e.g., 'resume-sop')
        router.replace('/profile/resume-sop');
    }, []);

    return null; // This page doesn't render anything visible to the user
};

export default Profile;
