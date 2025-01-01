// src/hooks/useLogoutRedirect.js
import { useRouter } from 'next/router';
import { logout } from '../utils/auth';

const useLogoutRedirect = () => {
  const router = useRouter();

  const logoutAndRedirect = () => {
    logout();
    router.push('/signin'); // Redirect to login page
  };

  return logoutAndRedirect;
};

export default useLogoutRedirect;
