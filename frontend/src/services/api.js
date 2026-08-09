import axios from 'axios';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('plantbot_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register') &&
            !originalRequest.url.includes('/auth/refresh')
        ) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;
            const refreshToken = localStorage.getItem('plantbot_refresh_token');
            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {
                const res = await api.post('/auth/refresh', { token: refreshToken });
                localStorage.setItem('plantbot_token', res.data.access_token);
                localStorage.setItem('plantbot_refresh_token', res.data.refresh_token);
                api.defaults.headers.common.Authorization = `Bearer ${res.data.access_token}`;
                onRefreshed(res.data.access_token);
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('plantbot_token');
                localStorage.removeItem('plantbot_refresh_token');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;