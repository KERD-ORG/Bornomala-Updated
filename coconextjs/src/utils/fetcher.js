// src/utils/fetcher.js
import axios from 'axios';
import { logout } from '../utils/auth';

export const fetcher = {
    post: async (url, data) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        return {
            status: response.status,
            ...result,
        };
    },
};

export const executeAjaxOperation = async ({ url, method = 'get', token = null, data = null, formData = null, locale = 'en', csrfToken = null }) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // Fetch base URL directly here
    try {
        const headers = {
            'Accept-Language': locale,
            'Content-Type': formData ? 'multipart/form-data' : 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }

        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await axios({
            method,
            url: baseUrl + url, // Combining base URL with endpoint URL
            headers,
            data: formData || data,
        });

        return { success: true, data: response.data, error: null };
    } catch (error) {
        console.error('Error performing AJAX operation:', error);
        if (error.response && error.response.status === 400) {
            // Handle 400 Bad Request error response
            return { success: false, data: null, error: error.response.data };
        } else {
            return { success: false, data: null, error: error.message };
        }
    }
};

export const executeAjaxOperationStandard = async ({ url, method = 'get', token = null, data = null, formData = null, locale = 'en', csrfToken = null }) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // Fetch base URL directly here
    try {
        const headers = {
            'Accept-Language': locale,
            'Content-Type': formData ? 'multipart/form-data' : 'application/json',
        }
        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await axios({
            method,
            url: baseUrl + url, // Combining base URL with endpoint URL
            headers,
            data: formData || data,
        });

        return response;
        
    } catch (error) {
        let errorMessage = 'An error occurred';
        let errorCode = null;
        let details = null;

        if (error.response && error.response.status === 401) {
            // Clear the session and redirect to signin
            logout(); // Clears any client-side session information
            window.location.href = '/signin'; // Use window.location for redirect
        }

        if (error.response) {
            // Server responded with an error (4xx or 5xx)
            errorMessage = error.response.data.error || error.response.data.detail || 'Server error';
            errorCode = error.response.data.error_code || null;
            details = error.response.data.details || null;
        } else if (error.message) {
            // Network or client-side error
            errorMessage = error.message;
        }

        return {
            status: 'error',
            message: errorMessage,
            error_code: errorCode,
            details: details,
        };
    }
};
