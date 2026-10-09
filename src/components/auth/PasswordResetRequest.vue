<script setup>
import { onBeforeMount, ref } from 'vue';
import { useAuthStore, useGlobalStore } from '@/stores';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const loading = ref(false);
const email = ref(null);

onBeforeMount(() => {
    globalStore.clearErrors();
});

const handleSubmit = async () => {
    try {
        loading.value = true;
        const res = await authStore.forgotPassword({ email: email.value });
        if (res?.status === true) {
            email.value = '';
            globalStore.clearErrors();
        }
    } catch (e) {
        // Handle error
    } finally {
        loading.value = false;
    }
};
const goBack = () => {
    router.push({ name: 'Login' });
};
</script>
<template>
    <div>
        <h4 class="text-3xl font-bold text-center mb-4">Forgot Password</h4>

        <p class="text-center mb-12 text-gray-700">
            Enter your email address and we'll send you a link to reset your
            password.
        </p>

        <form @submit.prevent="handleSubmit">
            <div class="grid mb-3">
                <div class="mb-6 col-span-12">
                    <label for="email" class="block mb-2">Email</label>
                    <InputField
                        id="email"
                        v-model="email"
                        variant="text"
                        class="w-full"
                    />
                </div>
            </div>

            <Button
                class="w-full left-loading mb-4"
                label="Continue"
                :disabled="!email || loading"
                :loading="loading"
                type="submit"
            />
            <Button
                variant="outlined"
                class="w-full left-loading"
                label="Back to Login"
                :disabled="loading"
                @click="goBack"
                type="button"
            />
        </form>
    </div>
</template>
