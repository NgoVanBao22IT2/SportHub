
import axios from 'axios';
import { getAccessToken } from '../utils/tokenStorage';

const api = axios.create({
    baseURL: '/api/v1',
});

api.interceptors.request.use(config => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
