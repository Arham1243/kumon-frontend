import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { StudentCardHistoryService } from '@/modules/reports/services';

export const useStudentCardHistoryStore = defineStore('StudentCardHistoryStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentCardHistoryService.search(payload, params);
            return res.data;
        });
    };

    return { search };
});
