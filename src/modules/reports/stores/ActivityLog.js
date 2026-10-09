import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { ActivityLogService } from '@/modules/reports/services';

export const useActivityLogStore = defineStore('ActivityLogStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await ActivityLogService.search(payload, params);
            return res.data;
        });
    };

    const show = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await ActivityLogService.show(id);
            return res.data;
        });
    };

    return { search, show };
});
