import AxiosService from '@/services/Axios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const search = (payload, params) => {
    return AxiosService.post(`${BASE_URL}/scheduled-jobs/search`, payload, {
        params
    });
};

export const show = (id) => {
    return AxiosService.get(`${BASE_URL}/scheduled-jobs/${id}`);
};

export const update = (id, payload) => {
    return AxiosService.patch(`${BASE_URL}/scheduled-jobs/${id}`, payload);
};

export const runs = (id, params) => {
    return AxiosService.get(`${BASE_URL}/scheduled-jobs/${id}/runs`, {
        params
    });
};

export const run = (id) => {
    return AxiosService.post(`${BASE_URL}/scheduled-jobs/${id}/run`);
};
