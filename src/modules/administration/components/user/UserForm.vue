<script setup>
import { ref, computed, onBeforeMount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    useUserStore,
    useUserRoleStore
} from '@/modules/administration/stores';
import { useFormDirty } from '@/composables/useFormDirty';
import PlaceholderImage from '@/assets/images/image_not_available.png';
import StatusTag from '@/components/common/StatusTag.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import useEventsBus from '@/composables/useEventsBus';

const props = defineProps({
    mode: { type: String, required: true }
});

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const roleStore = useUserRoleStore();
const { emit: emitEvent } = useEventsBus();

const busy = ref(false);
const loading = ref(props.mode === 'edit');
const adminUuid = computed(() => route.params.uuid);
const isEditMode = ref(props.mode === 'edit');

const formData = ref({
    name: '',
    email: '',
    password: '',
    role_id: null,
    status: 'active',
    profile_image: null
});

const { isDirty, resetDirty } = useFormDirty(formData, null, {
    excludeKeys: ['password']
});

const roles = ref([]);
const loadingRoles = ref(false);

const canToggleActiveInactive = computed(() => {
    if (!isEditMode.value) {
        return false;
    }
    const status = formData.value.status;
    return status === 'active' || status === 'inactive' || status === 'pending';
});

const statusIsActive = computed({
    get() {
        return formData.value.status === 'active';
    },
    set(value) {
        if (!canToggleActiveInactive.value) return;
        formData.value.status = value ? 'active' : 'inactive';
    }
});

const statusSwitchLabel = computed(() => {
    if (formData.value.status === 'pending') {
        return 'Pending';
    }
    return statusIsActive.value ? 'Active' : 'Inactive';
});

onBeforeMount(async () => {
    await getRoles();
    if (isEditMode.value) {
        await getItem();
    } else {
        resetDirty();
    }
});

watch(
    () => route.params.uuid,
    async (uuid, prev) => {
        if (!isEditMode.value || !uuid || uuid === prev) return;
        await getItem();
    }
);

const getRoles = async () => {
    try {
        loadingRoles.value = true;
        const res = await roleStore.search(
            { sort: [{ field: 'name', direction: 'asc' }] },
            { limit: 100 }
        );
        roles.value = res.data;
    } catch {
        roles.value = [];
    } finally {
        loadingRoles.value = false;
    }
};

const getItem = async () => {
    if (!adminUuid.value) {
        loading.value = false;
        return;
    }
    try {
        loading.value = true;
        const res = await userStore.show(adminUuid.value);
        const admin = res.data;

        formData.value = {
            name: admin.name || '',
            email: admin.email || '',
            password: '',
            role_id: admin.role?.id ?? admin.role_id ?? null,
            status: admin.status || 'active',
            profile_image: admin.profile_image || null
        };

        resetDirty(formData.value);

        const breadcrumbLabel =
            formData.value.name?.trim() || formData.value.email?.trim() || '';
        if (breadcrumbLabel) {
            emitEvent('updateDetailsBreadcrumb', breadcrumbLabel);
        }
    } finally {
        loading.value = false;
    }
};

const buildPayload = () => {
    const payload = { ...formData.value };
    if (!payload.password) {
        delete payload.password;
    }
    if (!isEditMode.value) {
        delete payload.password;
        delete payload.status;
    } else if (payload.status !== 'active' && payload.status !== 'inactive') {
        delete payload.status;
    }
    return payload;
};

const save = async () => {
    try {
        busy.value = true;
        const payload = buildPayload();

        if (isEditMode.value) {
            await userStore.update(adminUuid.value, payload);
            resetDirty(formData.value);
        } else {
            await userStore.create(payload);
            router.push({ name: 'Users' });
        }
    } catch (error) {
        console.error(error);
    } finally {
        busy.value = false;
    }
};

const goBack = () => {
    router.push({ name: 'Users' });
};

const cancel = () => {
    if (isEditMode.value) {
        getItem();
    } else {
        goBack();
    }
};

const onFileSelect = (event) => {
    const file = event.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        formData.value.profile_image = e.target.result;
    };
    reader.readAsDataURL(file);
};

const hasPasswordChange = computed(() => {
    const password = formData.value.password?.trim() ?? '';
    return password.length >= 8;
});

const hasUnsavedChanges = computed(
    () => isDirty.value || hasPasswordChange.value
);

const canSave = computed(() => {
    if (!isEditMode.value) {
        return (
            formData.value.name &&
            formData.value.email &&
            formData.value.role_id
        );
    }
    return hasUnsavedChanges.value;
});

const saveDisabled = computed(() => {
    if (isEditMode.value) {
        return !canSave.value || busy.value;
    }
    return !canSave.value || busy.value;
});

const cancelDisabled = computed(() => {
    if (isEditMode.value) {
        return !hasUnsavedChanges.value || busy.value;
    }
    return busy.value;
});
</script>

<template>
    <Loader v-if="loading" />
    <template v-else>
        <TitleHeader>
            <template #title>
                <div class="flex items-center gap-5">
                    <Button
                        type="button"
                        variant="outlined"
                        icon="pi pi-chevron-left"
                        size="large"
                        @click="goBack"
                        iconClass="!text-sm"
                        :disabled="busy"
                    />
                    <div class="flex items-center gap-2 flex-wrap min-w-0">
                        <h1
                            class="text-2xl sm:text-3xl font-bold capitalize truncate"
                        >
                            {{
                                isEditMode
                                    ? formData.name?.trim() || 'Edit User'
                                    : 'New User'
                            }}
                        </h1>
                        <StatusTag
                            v-if="isEditMode && formData.status"
                            :status="formData.status"
                        />
                    </div>
                </div>
            </template>
            <template #actions>
                <Button
                    label="Cancel"
                    variant="outlined"
                    class="w-full sm:w-auto"
                    @click="cancel"
                    :disabled="cancelDisabled"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    iconPos="left"
                    class="w-full sm:w-auto"
                    :disabled="saveDisabled"
                    :loading="busy"
                    @click="save"
                />
            </template>
        </TitleHeader>

        <Card>
            <template #content>
                <div v-if="isEditMode" class="flex justify-end mb-6">
                    <div class="flex items-center gap-3">
                        <ToggleSwitch
                            inputId="admin_status"
                            v-model="statusIsActive"
                            size="large"
                            :disabled="busy || !canToggleActiveInactive"
                        />
                        <label
                            v-if="canToggleActiveInactive"
                            for="admin_status"
                            class="text-gray-600 dark:text-surface-400 text-lg cursor-pointer"
                        >
                            {{ statusSwitchLabel }}
                        </label>
                        <span
                            v-else
                            class="text-gray-600 dark:text-surface-400 text-lg"
                        >
                            {{ statusSwitchLabel }}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-6">
                    <div class="col-span-12 lg:col-span-3">
                        <label class="block mb-3 required">Name</label>
                        <InputField
                            id="name"
                            :disabled="busy"
                            class="w-full"
                            v-model="formData.name"
                            variant="text"
                            @keyup.enter="save"
                        />
                    </div>

                    <div class="col-span-12 lg:col-span-3">
                        <label class="block mb-3 required">Email</label>
                        <InputField
                            id="email"
                            :disabled="busy"
                            class="w-full"
                            v-model="formData.email"
                            variant="text"
                            @keyup.enter="save"
                        />
                    </div>

                    <div class="col-span-12 lg:col-span-3">
                        <label class="block mb-3 required">Role</label>
                        <InputField
                            id="role_id"
                            :disabled="busy || loadingRoles"
                            class="w-full"
                            v-model="formData.role_id"
                            variant="dropdown"
                            optionLabel="name"
                            optionValue="id"
                            :options="roles"
                            filter
                            showClear
                        />
                    </div>

                    <div v-if="isEditMode" class="col-span-12 lg:col-span-3">
                        <label class="block mb-3">
                            Password (leave blank to keep current)
                        </label>
                        <Password
                            id="password"
                            v-model="formData.password"
                            toggleMask
                            :feedback="false"
                            class="w-full"
                            inputClass="w-full"
                            :disabled="busy"
                        />
                    </div>

                    <div class="col-span-12 flex justify-center mt-4">
                        <div class="flex flex-col items-center gap-4">
                            <label
                                class="block font-semibold flex items-center gap-2"
                            >
                                Profile Picture
                                <i
                                    class="pi pi-info-circle text-gray-400 cursor-pointer"
                                    v-tooltip.top="
                                        'Max size 500KB. Best viewed as a square.'
                                    "
                                ></i>
                            </label>
                            <div
                                class="border border-gray-300 rounded-full shadow-sm flex items-center justify-center bg-gray-50 dark:bg-gray-800 h-40 w-40 overflow-hidden"
                            >
                                <img
                                    v-if="formData.profile_image"
                                    :src="formData.profile_image"
                                    alt="Profile Picture"
                                    class="object-cover h-full w-full"
                                />
                                <img
                                    v-else
                                    :src="PlaceholderImage"
                                    alt="Default Profile"
                                    class="object-contain h-full w-full"
                                />
                            </div>
                            <div class="flex justify-center">
                                <FileUpload
                                    name="profileImage"
                                    mode="basic"
                                    customUpload
                                    auto
                                    chooseLabel="Upload"
                                    chooseIcon="pi pi-upload"
                                    :maxFileSize="500 * 1024"
                                    accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                                    @select="onFileSelect"
                                    :disabled="busy"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </template>
</template>
