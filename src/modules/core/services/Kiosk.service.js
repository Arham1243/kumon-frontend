import PublicAxios from '@/services/PublicAxios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/public/kiosk`;

export const fetchKioskCompany = (companyUuid) => {
    return PublicAxios.get(`${BASE_URL}/${companyUuid}`);
};

export const punch = (companyUuid, studentId) => {
    return PublicAxios.post(`${BASE_URL}/${companyUuid}/punch`, {
        student_id: studentId
    });
};
