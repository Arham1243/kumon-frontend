import AxiosService from '@/services/Axios.service';
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const search = (payload, params) => {
    return AxiosService.post(`${BASE_URL}/users/search`, payload, {
        params
    });
};

export const create = (payload) => {
    return AxiosService.post(`${BASE_URL}/users`, payload);
};

export const update = (id, payload) => {
    return AxiosService.put(`${BASE_URL}/users/${id}`, payload);
};

export const show = (id) => {
    return AxiosService.get(`${BASE_URL}/users/${id}`, {
        params: { include: 'role' }
    });
};

export const changeStatus = (id, payload) => {
    return AxiosService.post(`${BASE_URL}/users/${id}/change-status`, payload);
};

export const deleteItem = (id) => {
    return AxiosService.delete(`${BASE_URL}/users/${id}/delete`);
};

export const updateProfile = (payload) => {
    return AxiosService.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/auth/profile`,
        payload
    );
};
