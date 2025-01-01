import Cookies from 'js-cookie';

export function isLoggedIn() {
    const token = Cookies.get('token'); // Retrieve the token from cookies
    return !!token; // Convert to boolean: true if token exists, otherwise false
}

export function logout() {
    Cookies.remove('token');
    window.location.reload();
}

export function getToken() {
    return Cookies.get('token');
}