<script setup>
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores';

const router = useRouter();
const sessionStore = useSessionStore();

const goHome = () => {
    router.push({ name: 'Dashboard' });
};
</script>

<template>
    <div
        class="error-page-shell w-screen h-screen flex items-center justify-center overflow-x-hidden"
    >
        <div class="error-page-card p-12 max-w-2xl w-full text-center">
            <div class="error-page-code text-6xl font-bold mb-4">404</div>
            <div class="error-page-title text-xl font-semibold uppercase mb-4">
                Page Not Found
            </div>
            <p class="error-page-message">
                Sorry! We can't find the content you're looking for.
            </p>

            <Button variant="outlined" class="w-72" @click="goHome">
                Go Home
            </Button>
        </div>
    </div>
</template>
