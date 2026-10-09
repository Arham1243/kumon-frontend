import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { ScheduledJobService } from '@/modules/reports/services';

export const useScheduledJobStore = defineStore('ScheduledJobStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await ScheduledJobService.search(payload, params);
            return res.data;
        });
    };

    const show = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await ScheduledJobService.show(id);
            return res.data;
        });
    };

    const update = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await ScheduledJobService.update(id, payload);
            return res.data;
        });
    };

    const runs = (id, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await ScheduledJobService.runs(id, params);
            return res.data;
        });
    };

    const run = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await ScheduledJobService.run(id);
            return res.data;
        });
    };

    return { search, show, update, runs, run };
});
