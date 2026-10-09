import { defineStore } from 'pinia';
import { useGlobalStore } from '@/stores';
import { EmailTemplateService } from '@/modules/administration/services';

export const useEmailTemplateStore = defineStore('EmailTemplateStore', () => {
    const globalStore = useGlobalStore();

    const search = (payload, params) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailTemplateService.search(payload, params);
            return res.data;
        });
    };

    const show = (uuid) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailTemplateService.show(uuid);
            return res.data;
        });
    };

    const update = (uuid, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailTemplateService.update(uuid, payload);
            globalStore.showSuccess(
                'Template saved',
                'Email template was updated successfully.'
            );
            return res.data;
        });
    };

    const changeStatus = (uuid, status) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailTemplateService.changeStatus(uuid, status);
            globalStore.showSuccess(
                'Status updated',
                'Template status was updated.'
            );
            return res.data;
        });
    };

    const previewTemplate = async (uuid, payload) => {
        const res = await EmailTemplateService.previewTemplate(uuid, payload);
        const subject = res.headers?.['x-resolved-email-subject'] ?? '';
        return { html: res.data, subject };
    };

    const sendTestEmail = (uuid, payload) => {
        return globalStore.actionWrapper(async () => {
            const res = await EmailTemplateService.sendTestEmail(uuid, payload);
            globalStore.showSuccess(
                'Test email sent',
                'The test email was sent successfully.'
            );
            return res.data;
        });
    };

    return {
        search,
        show,
        update,
        changeStatus,
        previewTemplate,
        sendTestEmail
    };
});
