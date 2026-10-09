<script setup>
import { computed } from 'vue';
import AppSubMenu from './AppSubMenu.vue';
import { useSessionStore } from '@/stores';

const moduleMenus = import.meta.glob('@/modules/*/menu.js', { eager: true });

const menuItems = Object.keys(moduleMenus)
    .sort()
    .flatMap((path) => {
        const mod = moduleMenus[path].default;
        return Array.isArray(mod) ? mod : [];
    });

const sessionStore = useSessionStore();

// Helper function to check if user has any of the required permissions
const hasPermission = (requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true; // No permissions required, show the item
    }

    const userPermissions = sessionStore.permissions || [];
    return requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
    );
};

// Recursive function to filter menu items based on permissions
const filterMenuItems = (items) => {
    return items
        .filter((item) => hasPermission(item.permissions))
        .map((item) => {
            if (item.items && item.items.length > 0) {
                const filteredSubItems = filterMenuItems(item.items);
                if (filteredSubItems.length > 0 || item.to) {
                    return { ...item, items: filteredSubItems };
                }
                return null;
            }
            return item;
        })
        .filter((item) => item !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
};

// Computed property that filters menu based on user permissions
const model = computed(() => {
    const filteredItems = filterMenuItems(menuItems);
    return [{ items: filteredItems }];
});
</script>

<template>
    <AppSubMenu :model="model" />
</template>
