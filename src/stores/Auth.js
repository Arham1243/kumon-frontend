import { defineStore } from 'pinia';
import { AuthService } from '@/services';
import { useGlobalStore, useSessionStore } from '@/stores';

export const useAuthStore = defineStore('AuthStore', () => {
    const globalStore = useGlobalStore();
    const sessionStore = useSessionStore();

    const login = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AuthService.login(payload);

            // Check if OTP verification is required
            if (res.data.challenge === 'OTP_REQUIRED') {
                sessionStore.setEmail(payload.email);
                return res.data;
            }

            sessionStore.setEmail(payload.email);
            sessionStore.startUserSession(res.data.data);
            try {
                await sessionStore.me();
            } catch (e) {
                sessionStore.clearSessionState();
                throw e;
            }
            return res.data;
        });
    };

    const forgotPassword = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AuthService.forgotPassword(payload);
            globalStore.showSuccess(
                'Password link sent successfully',
                'Please Check your email for the reset link'
            );
            return res.data;
        });
    };

    const resetPassword = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AuthService.resetPassword(payload);
            globalStore.showSuccess(
                'Password changed successfully',
                'Your password has been changed successfully'
            );
            return res.data;
        });
    };

    const setupPassword = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AuthService.setupPassword(payload);
            sessionStore.startUserSession(res.data.data);
            try {
                await sessionStore.me();
            } catch (e) {
                sessionStore.clearSessionState();
                throw e;
            }
            return res.data;
        });
    };

    const logout = async () => {
        const res = await AuthService.logout();
        const sessionStore = useSessionStore();
        sessionStore.clearSessionState();
        return res.data;
    };

    const verifyOtp = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AuthService.verifyOtp(payload);
            sessionStore.startUserSession(res.data.data);
            try {
                await sessionStore.me();
            } catch (e) {
                sessionStore.clearSessionState();
                throw e;
            }
            return res.data;
        });
    };

    const resendOtp = (payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await AuthService.resendOtp(payload);
            globalStore.showSuccess(
                'OTP Resent',
                'A new verification code has been sent to your email'
            );
            return res.data;
        });
    };

    return {
        login,
        logout,
        forgotPassword,
        resetPassword,
        setupPassword,
        verifyOtp,
        resendOtp
    };
});
