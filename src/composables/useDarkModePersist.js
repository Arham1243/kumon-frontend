import { AuthService } from '@/services';
import { useSessionStore } from '@/stores';

/** PATCH `dark_mode` (mirrors tenant `AuthService.updateUiPreferences`). */
export function persistDarkMode(isDark) {
    const sessionStore = useSessionStore();
    return AuthService.updateUiPreferences({ dark_mode: !!isDark })
        .then(() => {
            if (sessionStore.user) {
                sessionStore.user.dark_mode = !!isDark;
            }
        })
        .catch(() => {});
}
