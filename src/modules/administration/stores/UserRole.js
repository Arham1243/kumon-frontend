import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { UserRoleService } from '@/modules/administration/services';

export const useUserRoleStore = defineStore('UserRoleStore', () => {
    const globalStore = useGlobalStore();
    const currentItem = ref({});

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.search(payload, params);
            return res.data;
        });
    };

    const getItem = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.show(id);
            currentItem.value = res.data.data;
            return res.data;
        });
    };

    const create = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.create(payload);
            globalStore.showSuccess(
                'Role created',
                'Role created successfully'
            );
            return res.data;
        });
    };

    const update = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.update(id, payload);
            globalStore.showSuccess(
                'Role updated',
                'Role updated successfully'
            );
            return res.data;
        });
    };

    const changeStatus = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.changeStatus(id, payload);
            globalStore.showSuccess(
                'Role status updated',
                'Role status updated successfully'
            );
            return res.data;
        });
    };

    const deleteItem = async (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.deleteItem(id);
            globalStore.showSuccess(
                'Role deleted',
                'Role deleted successfully'
            );
            return res.data;
        });
    };

    const getRolePermissions = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.getRolePermissions(id);
            return res.data;
        });
    };

    const syncRolePermissions = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserRoleService.syncRolePermissions(id, payload);
            globalStore.showSuccess(
                'Role permissions synced',
                'Role permissions synced successfully'
            );
            return res.data;
        });
    };

    return {
        search,
        create,
        update,
        deleteItem,
        changeStatus,
        getItem,
        getRolePermissions,
        syncRolePermissions,
        currentItem
    };
});
