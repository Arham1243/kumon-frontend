<script setup>
import { ref, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores';
import { useUserStore } from '@/modules/administration/stores';
import { useFormDirty } from '@/composables/useFormDirty';
import PlaceholderImage from '@/assets/images/image_not_available.png';

const router = useRouter();
const sessionStore = useSessionStore();
const userStore = useUserStore();

const busy = ref(false);

const formData = ref({
    name: '',
    profile_image: null
});

const { isDirty, resetDirty } = useFormDirty(formData);

onBeforeMount(() => {
    loadProfile();
});

const loadProfile = async () => {
    const user = sessionStore.user;
    if (!user) return;

    formData.value = {
        name: user.name || '',
        profile_image: user.profile_image || null
    };

    resetDirty(formData.value);
};

const save = async () => {
    try {
        busy.value = true;
        const res = await userStore.updateProfile(formData.value);
        if (res?.data) {
            sessionStore.user = { ...sessionStore.user, ...res.data };
        }
        resetDirty(formData.value);
    } catch (error) {
        console.error(error);
    } finally {
        busy.value = false;
    }
};

const goBack = () => {
    router.push({ name: 'Dashboard' });
};

const cancel = () => {
    loadProfile();
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
</script>

<template>
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
                <h1 class="text-2xl font-bold">My Profile</h1>
            </div>
        </template>
        <template #actions>
            <Button
                label="Cancel"
                variant="outlined"
                class="w-full sm:w-auto"
                @click="cancel"
                :disabled="!isDirty || busy"
            />
            <Button
                label="Save"
                icon="pi pi-check"
                iconPos="left"
                class="w-full sm:w-auto"
                :disabled="!isDirty || busy"
                :loading="busy"
                @click="save"
            />
        </template>
    </TitleHeader>

    <Card>
        <template #content>
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
                    <label class="block mb-3">Email</label>
                    <InputField
                        id="email"
                        disabled
                        class="w-full"
                        :modelValue="sessionStore.user?.email"
                        variant="text"
                    />
                </div>

                <div class="col-span-12 lg:col-span-3">
                    <label class="block mb-3">Role</label>
                    <InputField
                        id="role"
                        disabled
                        class="w-full"
                        :modelValue="sessionStore.user?.role?.name || '-'"
                        variant="text"
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
