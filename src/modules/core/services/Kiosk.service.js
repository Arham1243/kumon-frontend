import PublicAxios from '@/services/PublicAxios.service';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/public/kiosk`;

const COMPANY_UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isKioskCompanyUuid(value) {
    return COMPANY_UUID_PATTERN.test(String(value ?? '').trim());
}

function responseLooksLikeJson(res) {
    const contentType = String(res?.headers?.['content-type'] ?? '').toLowerCase();
    if (contentType.includes('application/json')) {
        return true;
    }
    if (contentType.includes('text/html')) {
        return false;
    }
    const data = res?.data;
    if (typeof data === 'string') {
        const trimmed = data.trimStart();
        return trimmed.startsWith('{') || trimmed.startsWith('[');
    }
    return data !== null && typeof data === 'object';
}

export function parseKioskCompanyResponse(res) {
    if (!responseLooksLikeJson(res)) {
        const error = new Error('Invalid kiosk API response');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    let payload = res.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            const error = new Error('Invalid kiosk API JSON');
            error.code = 'kiosk_bad_response';
            throw error;
        }
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        const error = new Error('Invalid kiosk company payload');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    const company = payload.data ?? payload;
    if (!company || typeof company !== 'object' || Array.isArray(company)) {
        const error = new Error('Invalid kiosk company payload');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    const name = company.name;
    if (typeof name !== 'string' || name.trim() === '') {
        const error = new Error('Invalid kiosk company payload');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    return company;
}

export function parseKioskPunchResponse(res) {
    if (!responseLooksLikeJson(res)) {
        const error = new Error('Invalid kiosk punch response');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    let payload = res.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            const error = new Error('Invalid kiosk punch JSON');
            error.code = 'kiosk_bad_response';
            throw error;
        }
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        const error = new Error('Invalid kiosk punch payload');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    const code = payload.code;
    if (typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Invalid kiosk punch payload');
        error.code = 'kiosk_bad_response';
        throw error;
    }

    const studentName = payload.student_name;

    return {
        code,
        studentName: typeof studentName === 'string' ? studentName.trim() : ''
    };
}

export const fetchKioskCompany = (companyUuid) => {
    return PublicAxios.get(`${BASE_URL}/${companyUuid}`);
};

export const punch = (companyUuid, studentId) => {
    return PublicAxios.post(`${BASE_URL}/${companyUuid}/punch`, {
        student_id: Number(studentId)
    });
};
