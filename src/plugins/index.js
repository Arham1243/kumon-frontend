import { startVersionCheck } from '@/composables/useVersionCheck';
import router from '@/routes';
import pinia from '@/stores';
import PrimeVue from 'primevue/config';
import AppPreset from './app-preset';
import { abilitiesPlugin } from '@casl/vue';
import { ability } from '@/plugins/ability';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Search from '@/components/common/Search.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import ApiDropdown from '@/components/common/ApiDropdown.vue';
import ApiMultiselect from '@/components/common/ApiMultiselect.vue';
import BccRecipientsField from '@/components/common/BccRecipientsField.vue';
import { install as VueRecaptchaInstall } from 'vue3-recaptcha-v2';
import '@vue-js-cron/light/dist/light.css';
import '@/assets/css/styles.scss';

import CronLightPlugin from '@vue-js-cron/light';

export function registerPlugins(app) {
    app.use(router);
    app.use(pinia);

    startVersionCheck();

    app.use(PrimeVue, {
        ripple: true,
        theme: {
            preset: AppPreset,
            options: {
                darkModeSelector: '.app-dark'
            }
        }
    });
    app.use(CronLightPlugin);
    app.component('Search', Search);
    app.component('BaseDialog', BaseDialog);
    app.component('ApiDropdown', ApiDropdown);
    app.component('ApiMultiselect', ApiMultiselect);
    app.component('BccRecipientsField', BccRecipientsField);
    app.use(abilitiesPlugin, ability, {
        useGlobalProperties: true
    });

    app.use(ToastService);
    app.use(ConfirmationService);

    app.use(VueRecaptchaInstall, {
        sitekey: '6Ld_hcgsAAAAAFGLs0kl7QyQEHM8Qctq1mmquAWi',
        useRecaptchaNet: true
    });
}
