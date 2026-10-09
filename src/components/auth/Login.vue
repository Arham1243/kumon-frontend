<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useGlobalStore, useSessionStore } from '@/stores';
import { RecaptchaV2, useRecaptcha } from 'vue3-recaptcha-v2';
import { getDeviceFingerprint, getDeviceInfo } from '@/utils/deviceFingerprint';

const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const sessionStore = useSessionStore();
const { handleExecute, handleReset } = useRecaptcha();

const loading = ref(false);
const credentials = ref({
    email: '',
    password: '',
    remember_me: false
});

const recaptchaWidgetId = ref(null);
const recaptchaToken = ref('');
const recaptchaLoginQueued = ref(false);
const waitingForRecaptcha = ref(false);

const loginSubmitBlocked = computed(
    () =>
        loading.value ||
        waitingForRecaptcha.value ||
        recaptchaWidgetId.value == null
);

onBeforeMount(() => {
    globalStore.clearErrors();
});

function resetRecaptcha() {
    recaptchaToken.value = '';
    if (recaptchaWidgetId.value != null) {
        try {
            handleReset(recaptchaWidgetId.value);
        } catch {
            // ignore
        }
    }
}

const submitLogin = async () => {
    if (!recaptchaToken.value) {
        return;
    }

    try {
        loading.value = true;

        const deviceFingerprint = getDeviceFingerprint();
        const deviceInfo = getDeviceInfo();

        const payload = {
            ...credentials.value,
            device_fingerprint: deviceFingerprint,
            device_info: deviceInfo
        };

        const response = await authStore.login(payload);

        if (response?.challenge === 'OTP_REQUIRED') {
            sessionStore.setEmail(credentials.value.email);
            await router.push({
                name: 'CodeVerification',
                query: {
                    session: response.session
                }
            });
            return;
        }

        await router.push({ name: 'Dashboard' });
    } catch (e) {
        resetRecaptcha();
    } finally {
        loading.value = false;
    }
};

const onRecaptchaWidgetId = (id) => {
    recaptchaWidgetId.value = id;
};

const handleErrorCallback = () => {
    recaptchaLoginQueued.value = false;
    waitingForRecaptcha.value = false;
    globalStore.showError(
        'reCAPTCHA',
        'Security check failed to load. Please refresh the page.'
    );
};

const handleExpiredCallback = () => {
    recaptchaToken.value = '';
    recaptchaLoginQueued.value = false;
    waitingForRecaptcha.value = false;
    globalStore.showError(
        'reCAPTCHA',
        'Security check expired. Please try again.'
    );
};

const handleLoadCallback = (token) => {
    recaptchaToken.value = token;
    if (recaptchaLoginQueued.value) {
        recaptchaLoginQueued.value = false;
        waitingForRecaptcha.value = false;
        void submitLogin();
    }
};

const login = () => {
    if (recaptchaWidgetId.value == null) {
        globalStore.showError(
            'reCAPTCHA',
            'Security check is still loading. Please wait a moment and try again.'
        );
        return;
    }
    if (loading.value) {
        return;
    }

    recaptchaLoginQueued.value = true;
    waitingForRecaptcha.value = true;
    try {
        handleExecute(recaptchaWidgetId.value);
    } catch {
        recaptchaLoginQueued.value = false;
        waitingForRecaptcha.value = false;
        globalStore.showError(
            'reCAPTCHA',
            'Security check could not start. Please refresh.'
        );
    }
};
</script>

<template>
    <div>
        <h4 class="text-3xl font-bold text-center mb-12">Login</h4>
        <form @submit.prevent="login">
            <div class="grid">
                <div class="mb-6 col-span-12">
                    <label class="block mb-2" for="email"> Email </label>
                    <InputField
                        variant="text"
                        id="email"
                        v-model="credentials.email"
                        class="w-full"
                    />
                </div>

                <div class="mb-4 col-span-12">
                    <label class="block mb-2" for="password"> Password </label>
                    <InputField
                        id="password"
                        variant="password"
                        v-model="credentials.password"
                        class="w-full"
                        inputClass="w-full"
                        toggleMask
                        :feedback="false"
                    />
                </div>
            </div>

            <div class="flex justify-between items-center pt-1">
                <div class="flex items-center">
                    <InputField
                        variant="checkbox"
                        v-model="credentials.remember_me"
                        binary
                        inputId="remember"
                    />
                    <label for="remember" class="ml-2 cursor-pointer">
                        Remember me
                    </label>
                </div>
                <router-link
                    class="primary-text"
                    :to="{ name: 'Password Reset Request' }"
                >
                    Forgot Password
                </router-link>
            </div>

            <RecaptchaV2
                size="invisible"
                @widget-id="onRecaptchaWidgetId"
                @error-callback="handleErrorCallback"
                @expired-callback="handleExpiredCallback"
                @load-callback="handleLoadCallback"
            />

            <Button
                class="w-full left-loading mt-5"
                label="Login"
                :disabled="loginSubmitBlocked"
                :loading="loading || waitingForRecaptcha"
                type="submit"
            />
        </form>
    </div>
</template>
