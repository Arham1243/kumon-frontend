import AxiosService from '@/services/Axios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const search = (payload, params) => {
    return AxiosService.post(`${BASE_URL}/examples/search`, payload, {
        params
    });
};

export const show = (id) => {
    return AxiosService.get(`${BASE_URL}/examples/${id}`);
};
