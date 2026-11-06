<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import TitleHeader from '@/components/common/TitleHeader.vue';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const formData = ref({
    current_password: '',
    password: '',
    password_confirmation: ''
});

const rules = ref({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false
});

const validatePassword = () => {
    const password = formData.value.password;

    rules.value.minLength = password.length >= 8;
    rules.value.uppercase = /[A-Z]/.test(password);
    rules.value.lowercase = /[a-z]/.test(password);
    rules.value.number = /[0-9]/.test(password);
    rules.value.symbol = /[@$!%*#?&]/.test(password);
};

const isPasswordValid = computed(
    () =>
        rules.value.minLength &&
        rules.value.uppercase &&
        rules.value.lowercase &&
        rules.value.number &&
        rules.value.symbol
);

const canSubmit = computed(
    () =>
        isPasswordValid.value &&
        Boolean(formData.value.current_password?.trim())
);

const goBack = () => {
    router.push({ name: 'Profile' });
};

const handleSubmit = async () => {
    try {
        loading.value = true;
        await authStore.changePassword({
            current_password: formData.value.current_password,
            password: formData.value.password,
            password_confirmation: formData.value.password_confirmation
        });
        await router.push({ name: 'Profile' });
    } catch {
        // Handled by actionWrapper
    } finally {
        loading.value = false;
    }
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
                    :disabled="loading"
                />
                <h1 class="text-2xl font-bold">Change Password</h1>
            </div>
        </template>
    </TitleHeader>

    <Card>
        <template #content>
            <form @submit.prevent="handleSubmit">
                <div class="grid">
                    <div class="mb-6 col-span-12">
                        <label class="block !mb-2" for="current_password"
                            >Current Password</label
                        >
                        <InputField
                            id="current_password"
                            variant="password"
                            v-model="formData.current_password"
                            class="w-full"
                            inputClass="w-full"
                            toggleMask
                            :feedback="false"
                            :disabled="loading"
                        />
                    </div>

                    <div class="mb-6 col-span-12">
                        <label class="block !mb-2" for="password"
                            >New Password</label
                        >
                        <InputField
                            id="password"
                            variant="password"
                            v-model="formData.password"
                            class="w-full"
                            inputClass="w-full"
                            toggleMask
                            @input="validatePassword"
                            :feedback="false"
                            :disabled="loading"
                        />
                    </div>

                    <div class="mb-6 col-span-12">
                        <label class="block !mb-2" for="password_confirmation"
                            >Confirm New Password</label
                        >
                        <InputField
                            id="password_confirmation"
                            variant="password"
                            v-model="formData.password_confirmation"
                            class="w-full"
                            inputClass="w-full"
                            toggleMask
                            :feedback="false"
                            :disabled="loading"
                        />
                    </div>

                    <div class="mb-6 col-span-12 mt-3">
                        <label class="font-semibold mb-4 block"
                            >Password must contain the following:</label
                        >
                        <div class="space-y-1">
                            <div
                                :class="[
                                    'font-medium !mb-2',
                                    {
                                        valid: rules.minLength,
                                        invalid: !rules.minLength
                                    }
                                ]"
                            >
                                <span class="pl-3">At least 8 characters</span>
                            </div>
                            <div
                                :class="[
                                    'font-medium !mb-2',
                                    {
                                        valid: rules.uppercase,
                                        invalid: !rules.uppercase
                                    }
                                ]"
                            >
                                <span class="pl-3">One upper case letter</span>
                            </div>
                            <div
                                :class="[
                                    'font-medium !mb-2',
                                    {
                                        valid: rules.lowercase,
                                        invalid: !rules.lowercase
                                    }
                                ]"
                            >
                                <span class="pl-3">One lower case letter</span>
                            </div>
                            <div
                                :class="[
                                    'font-medium !mb-2',
                                    {
                                        valid: rules.number,
                                        invalid: !rules.number
                                    }
                                ]"
                            >
                                <span class="pl-3">At least one number</span>
                            </div>
                            <div
                                :class="[
                                    'font-medium !mb-2',
                                    {
                                        valid: rules.symbol,
                                        invalid: !rules.symbol
                                    }
                                ]"
                            >
                                <span class="pl-3"
                                    >At least one symbol @$!%*#?&</span
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-4">
                    <Button
                        :disabled="!canSubmit || loading"
                        label="Change Password"
                        class="w-full sm:w-auto left-loading"
                        :loading="loading"
                        type="submit"
                    />
                </div>
            </form>
        </template>
    </Card>
</template>

<style lang="scss" scoped>
.valid,
.valid::before {
    color: #0e4f26;
}
.valid::before {
    content: '\e909';
    font-family: 'PrimeIcons';
}
.invalid,
.invalid::before {
    color: #b32b23;
}
.invalid::before {
    content: '\e90b';
    font-family: 'PrimeIcons';
}
</style>
