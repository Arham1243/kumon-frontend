import AppLayout from '@/layout/AppLayout.vue';
import AuthLayout from '@/layout/AuthLayout.vue';

const modules = import.meta.glob('@/modules/*/index.js', { eager: true });
const moduleRoutes = Object.keys(modules)
    .sort()
    .flatMap((path) => {
        const mod = modules[path].default;
        return mod?.routes ?? [];
    });

export default [
    {
        path: '/',
        component: AppLayout,
        redirect: '/students',
        children: [
            {
                path: 'dashboard',
                redirect: '/students'
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/profile/index.vue'),
                meta: {
                    breadcrumb: [{ label: 'My Profile' }]
                }
            },
            ...moduleRoutes
        ]
    },
    {
        path: '/kiosk/:companyUuid',
        redirect: (to) => ({
            path: `/attendance/${to.params.companyUuid}`
        })
    },
    {
        path: '/attendance/:companyUuid',
        name: 'StudentAttendance',
        component: () => import('@/views/kiosk/AttendanceKiosk.vue'),
        meta: {
            public: true
        }
    },
    {
        path: '/auth',
        component: AuthLayout,
        children: [
            {
                path: 'login',
                name: 'Login',
                component: () => import('@/views/auth/Login.vue')
            },
            {
                path: 'verify/email',
                name: 'CodeVerification',
                component: () => import('@/views/auth/VerifyEmailCode.vue')
            },
            {
                path: 'password/forget',
                name: 'Password Reset Request',
                component: () => import('@/views/auth/PasswordResetRequest.vue')
            },
            {
                path: 'password/reset',
                name: 'New Password Setup',
                component: () => import('@/views/auth/PasswordResetForm.vue')
            },
            {
                path: 'password/set',
                name: 'Password Setup',
                component: () => import('@/views/auth/PasswordSetup.vue')
            }
        ]
    },
    {
        path: '/offline',
        name: 'Offline',
        component: () => import('@/views/errors/Offline.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/errors/NotFound.vue')
    }
];
