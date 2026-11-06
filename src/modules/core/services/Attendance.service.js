import AxiosService from '@/services/Axios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const search = (payload, params) => {
    return AxiosService.post(`${BASE_URL}/attendances/search`, payload, {
        params
    });
};

export const create = (payload) => {
    return AxiosService.post(`${BASE_URL}/attendances`, payload);
};

export const update = (id, payload) => {
    return AxiosService.put(`${BASE_URL}/attendances/${id}`, payload);
};

export const studentOptions = (params) => {
    return AxiosService.get(`${BASE_URL}/attendances/student-options`, {
        params
    });
};

export const exportFile = (payload) => {
    return AxiosService.post(`${BASE_URL}/attendances/export`, payload, {
        responseType: 'blob'
    });
};

export const summary = (payload) => {
    return AxiosService.post(`${BASE_URL}/attendances/summary`, payload);
};
