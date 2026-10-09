import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { AttendanceService } from '@/modules/core/services';

export const useAttendanceStore = defineStore('AttendanceStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await AttendanceService.search(payload, params);
            return res.data;
        });
    };

    const create = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AttendanceService.create(payload);
            globalStore.showSuccess(
                'Attendance created',
                'Attendance record created successfully'
            );
            return res.data;
        });
    };

    const update = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AttendanceService.update(id, payload);
            globalStore.showSuccess(
                'Attendance updated',
                'Attendance record updated successfully'
            );
            return res.data;
        });
    };

    const deleteItem = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await AttendanceService.deleteItem(id);
            globalStore.showSuccess(
                'Attendance deleted',
                'Attendance record deleted successfully'
            );
            return res.data;
        });
    };

    const studentOptions = (params) => {
        return globalStore.actionWrapper(async () => {
            const res = await AttendanceService.studentOptions(params);
            return res.data;
        });
    };

    return {
        search,
        create,
        update,
        deleteItem,
        studentOptions
    };
});
