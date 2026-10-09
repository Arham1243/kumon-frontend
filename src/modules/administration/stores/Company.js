import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { CompanyService } from '@/modules/administration/services';

export const useCompanyStore = defineStore('CompanyStore', () => {
    const globalStore = useGlobalStore();

    const getMyCompany = () => {
        return globalStore.actionWrapper(async () => {
            const res = await CompanyService.getMyCompany();
            return res?.data ?? res ?? null;
        });
    };

    const saveCompany = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await CompanyService.updateMyCompany(payload);
            globalStore.showSuccess(
                'Company updated',
                'Company details were saved successfully.'
            );
            return res?.data ?? res;
        });
    };

    return {
        getMyCompany,
        saveCompany
    };
});
