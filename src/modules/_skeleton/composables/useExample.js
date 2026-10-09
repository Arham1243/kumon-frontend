import { ref } from 'vue';

export function useExample() {
    const ready = ref(false);

    function markReady() {
        ready.value = true;
    }

    return { ready, markReady };
}
