import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { UserService } from '@/modules/administration/services';

export const useUserStore = defineStore('UserStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.search(payload, params);
            return res.data;
        });
    };

    const create = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.create(payload);
            globalStore.showSuccess(
                'User created',
                'User created successfully'
            );
            return res.data;
        });
    };

    const update = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.update(id, payload);
            globalStore.showSuccess(
                'User updated',
                'User updated successfully'
            );
            return res.data;
        });
    };

    const show = (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.show(id);
            return res.data;
        });
    };

    const deleteItem = async (id) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.deleteItem(id);
            globalStore.showSuccess(
                'User deleted',
                'User deleted successfully'
            );
            return res.data;
        });
    };

    const changeStatus = (id, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.changeStatus(id, payload);
            globalStore.showSuccess(
                'User updated',
                'User status updated successfully'
            );
            return res.data;
        });
    };

    const updateProfile = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await UserService.updateProfile(payload);
            globalStore.showSuccess(
                'Profile updated',
                'Profile updated successfully'
            );
            return res.data;
        });
    };

    return {
        changeStatus,
        search,
        create,
        update,
        show,
        deleteItem,
        updateProfile
    };
});
