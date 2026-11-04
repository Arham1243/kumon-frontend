import AxiosService from '@/services/Axios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const search = (payload, params) => {
    return AxiosService.post(`${BASE_URL}/student-card-histories/search`, payload, {
        params
    });
};

export const exportFile = (payload) => {
    return AxiosService.post(`${BASE_URL}/student-card-histories/export`, payload, {
        responseType: 'blob'
    });
};
