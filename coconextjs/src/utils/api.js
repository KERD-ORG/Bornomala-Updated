// utils/api.js
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add authorization header
api.interceptors.request.use(
    (config) => {
        const { token } = useAuth();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle unauthorized responses
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response.status === 401) {
            // Handle unauthorized actions (e.g., logout)
            useAuth().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
