import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { EmailLogService } from '@/modules/reports/services';

export const useEmailLogStore = defineStore('EmailLogStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailLogService.search(payload, params);
            return res.data;
        });
    };

    const show = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailLogService.show(id);
            return res.data;
        });
    };

    return { search, show };
});
