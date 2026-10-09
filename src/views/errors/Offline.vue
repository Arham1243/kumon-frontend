<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();

const goHome = () => {
    router.push({ name: 'Dashboard' });
};

const tryAgain = () => {
    if (navigator.onLine) {
        const redirect = route.query.redirect;
        if (typeof redirect === 'string' && redirect.length > 0) {
            router.push(redirect);
            return;
        }
        goHome();
        return;
    }

    window.location.reload();
};
</script>

<template>
    <div
        class="error-page-shell w-screen h-screen flex items-center justify-center overflow-x-hidden"
    >
        <div class="error-page-card p-12 max-w-2xl w-full text-center">
            <div class="error-page-code text-6xl font-bold mb-4">Offline</div>
            <div class="error-page-title text-xl font-semibold uppercase mb-4">
                No Internet Connection
            </div>
            <p class="error-page-message">
                It looks like you're offline. Check your connection and try
                again.
            </p>

            <div class="flex flex-col items-center gap-3">
                <Button variant="outlined" class="w-72" @click="tryAgain">
                    Try Again
                </Button>
                <Button
                    severity="secondary"
                    variant="text"
                    class="w-72"
                    @click="goHome"
                >
                    Go Home
                </Button>
            </div>
        </div>
    </div>
</template>
