import { useEffect } from 'react';
import { logout, getToken } from '../utils/auth';

const useIdleLogout = (timeout = parseInt(process.env.NEXT_PUBLIC_AUTO_LOGOUT_DURATION) || 60000) => {
    useEffect(() => {
        let timer;

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                logout();
            }, timeout);
        };

        const handleActivity = () => {
            resetTimer();
        };

        const isLoggedIn = !!getToken(); // Check if the user is logged in based on token existence

        if (isLoggedIn) {
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keypress', handleActivity);
            window.addEventListener('click', handleActivity);
            window.addEventListener('scroll', handleActivity);
            window.addEventListener('touchstart', handleActivity);

            resetTimer();
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keypress', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, [timeout]);
};

export default useIdleLogout;
