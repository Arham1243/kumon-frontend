import AxiosService from '@/services/Axios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const search = (payload, params) => {
    return AxiosService.post(`${BASE_URL}/email-templates/search`, payload, {
        params
    });
};

export const show = (uuid) => {
    return AxiosService.get(`${BASE_URL}/email-templates/${uuid}`);
};

export const update = (uuid, payload) => {
    return AxiosService.patch(
        `${BASE_URL}/email-templates/${uuid}`,
        payload
    );
};

export const changeStatus = (uuid, status) => {
    return AxiosService.post(
        `${BASE_URL}/email-templates/${uuid}/change-status`,
        { status }
    );
};

export const previewTemplate = (uuid, payload) => {
    return AxiosService.post(
        `${BASE_URL}/email-templates/${uuid}/preview`,
        payload,
        { responseType: 'text' }
    );
};

export const sendTestEmail = (uuid, payload) => {
    return AxiosService.post(
        `${BASE_URL}/email-templates/${uuid}/send-test`,
        payload
    );
};
