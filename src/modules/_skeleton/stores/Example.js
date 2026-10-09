import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { ExampleService } from '@/modules/_skeleton/services';

export const useExampleStore = defineStore('ExampleStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await ExampleService.search(payload, params);
            return res.data;
        });
    };

    const getItem = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await ExampleService.show(id);
            return res.data;
        });
    };

    return {
        search,
        getItem
    };
});
