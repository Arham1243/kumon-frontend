import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { StudentService } from '@/modules/core/services';

export const useStudentStore = defineStore('StudentStore', () => {
    const globalStore = useGlobalStore();

    const nextStudentId = () => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.nextStudentId();
            return res.data;
        });
    };

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.search(payload, params);
            return res.data;
        });
    };

    const create = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.create(payload);
            globalStore.showSuccess(
                'Student created',
                'Student created successfully'
            );
            return res.data;
        });
    };

    const update = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.update(id, payload);
            globalStore.showSuccess(
                'Student updated',
                'Student updated successfully'
            );
            return res.data;
        });
    };

    const show = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.show(id);
            return res.data;
        });
    };

    const updateCardUid = (id, cardUid, { isReplace = false } = {}) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.update(id, { card_uid: cardUid });
            globalStore.showSuccess(
                isReplace ? 'Card replaced' : 'Card assigned',
                isReplace
                    ? 'Student card replaced successfully'
                    : 'Student card assigned successfully'
            );
            return res.data;
        });
    };

    const changeStatus = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.changeStatus(id, payload);
            globalStore.showSuccess(
                'Student updated',
                'Student status updated successfully'
            );
            return res.data;
        });
    };

    const deleteItem = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await StudentService.deleteItem(id);
            globalStore.showSuccess(
                'Student deleted',
                'Student deleted successfully'
            );
            return res.data;
        });
    };

    return {
        nextStudentId,
        search,
        create,
        update,
        show,
        updateCardUid,
        changeStatus,
        deleteItem
    };
});
