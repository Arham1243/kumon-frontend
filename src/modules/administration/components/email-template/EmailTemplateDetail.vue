<script setup>
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useGlobalStore } from '@/stores';
import { useEmailTemplateStore } from '@/modules/administration/stores';
import { useFormDirty } from '@/composables/useFormDirty';
import { ability } from '@/plugins/ability';
import BoldOnlyQuillEditor from '@/modules/administration/components/email-template/BoldOnlyQuillEditor.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';

const SLUG_LOGIN_OTP = 'login-otp';
const SLUG_RESET_PASSWORD = 'reset-password';
const SLUG_SETUP_PASSWORD = 'setup-password';

const PLACEHOLDER_YEAR = '{{year}}';
const PLACEHOLDER_NAME = '{{name}}';
const PLACEHOLDER_VERIFY_LINK = '{{verify_link}}';
const PLACEHOLDER_EXPIRES_IN_MINUTES = '{{expires_in_minutes}}';

/** Must match {@see App\Models\Admin\AdminEmailTemplate::DEFAULT_COPYRIGHT_LINE} */
const DEFAULT_COPYRIGHT_LINE = '© {{year}} AdaptiveQMS. All rights reserved.';

const route = useRoute();
const router = useRouter();
const store = useEmailTemplateStore();
const globalStore = useGlobalStore();

const busy = ref(false);
const loading = ref(false);
const templateUuid = ref(route.params.uuid);
const templateSlug = ref('');
const loadedName = ref('');
const isSystem = ref(false);

const previewUrl = ref('');
const previewSubject = ref('');
const previewLoading = ref(false);
const previewFrame = ref(null);
const debounceTimer = ref(null);
/** Skips editor debounced preview while the form mounts after {@link getItem}. */
const suppressDebouncedPreview = ref(false);
const showLivePreview = ref(true);

function resizePreviewFrame() {
    const iframe = previewFrame.value;
    if (!iframe) {
        return;
    }
    try {
        const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (!doc?.body) {
            return;
        }
        const contentHeight =
            Math.max(
                doc.documentElement?.scrollHeight ?? 0,
                doc.body.scrollHeight,
                doc.body.offsetHeight
            ) + 4;
        const maxPx = Math.min(window.innerHeight * 0.85, 900);
        const nextHeight = Math.min(contentHeight, maxPx);
        iframe.style.height = `${nextHeight}px`;
        iframe.scrolling = contentHeight > maxPx ? 'yes' : 'no';
    } catch {
        /* blob preview is same-origin; ignore if inaccessible */
    }
}

/** Shown in From helper; outbound mail uses tenant/system Mailgun domain. */
const MAIL_DOMAIN_DISPLAY = 'mail.adaptiveqms.com';

const fromDeliveryAddress = computed(() => {
    const local = (formData.value.from || 'info').trim() || 'info';
    return `${local}@${MAIL_DOMAIN_DISPLAY}`;
});

const formData = ref({
    name: '',
    from: '',
    display_name: '',
    reply_to_email: '',
    reply_to_name: '',
    bcc_recipients: [],
    subject_template: '',
    intro_html: '',
    body_html: '',
    footer_html: '',
    detail_row_keys: null,
    detail_row_labels: {},
    detail_row_catalog: null,
    status: true
});

const { isDirty, resetDirty } = useFormDirty(formData);

const showUnsavedDialog = ref(false);
const showSendTestDialog = ref(false);
const sendTestFormData = ref({ recipient_email: '' });
const sendTestBusy = ref(false);
let nextRoute = null;

const supportedVariables = computed(() => {
    const slug = templateSlug.value;
    let greeting = [];
    let body = [];
    if (slug === SLUG_LOGIN_OTP) {
        greeting = [PLACEHOLDER_NAME];
        body = [PLACEHOLDER_EXPIRES_IN_MINUTES];
    } else if (slug === SLUG_RESET_PASSWORD || slug === SLUG_SETUP_PASSWORD) {
        greeting = [PLACEHOLDER_NAME];
        body = [PLACEHOLDER_VERIFY_LINK];
    }
    return {
        greeting,
        body,
        footer: [PLACEHOLDER_YEAR],
        subject: []
    };
});

onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value) {
        showUnsavedDialog.value = true;
        nextRoute = next;
    } else {
        next();
    }
});

onBeforeUnmount(() => {
    if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
    }
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
});

watch(
    () => route.params.uuid,
    async (id) => {
        if (!id) return;
        templateUuid.value = id;
        await getItem();
    },
    { immediate: true }
);

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

async function getItem() {
    if (!templateUuid.value) return;
    try {
        loading.value = true;
        const res = await store.show(templateUuid.value);
        const item = res?.data ?? res;
        templateSlug.value = item.slug ?? '';
        loadedName.value = item.name ?? '';
        isSystem.value = !!item.is_system;
        formData.value = {
            name: item.name ?? '',
            subject_template: item.subject_template ?? '',
            from: item.from ?? '',
            display_name: item.display_name ?? '',
            reply_to_email: item.reply_to_email ?? '',
            reply_to_name: item.reply_to_name ?? '',
            bcc_recipients: Array.isArray(item.bcc_recipients)
                ? item.bcc_recipients
                : [],
            intro_html: item.intro_html ?? '',
            body_html: item.body_html ?? '',
            footer_html: item.footer_html?.trim()
                ? item.footer_html
                : DEFAULT_COPYRIGHT_LINE,
            detail_row_keys: null,
            detail_row_labels: {},
            detail_row_catalog: null,
            status: !!item.status
        };
        resetDirty(formData.value);
        suppressDebouncedPreview.value = true;
        await updatePreview();
    } finally {
        loading.value = false;
        await nextTick();
        suppressDebouncedPreview.value = false;
    }
}

function previewPayload() {
    const payload = {
        footer_html: formData.value.footer_html,
        subject_template: formData.value.subject_template,
        intro_html: formData.value.intro_html
    };
    return payload;
}

async function updatePreview() {
    if (!templateUuid.value) return;
    try {
        previewLoading.value = true;
        const { html, subject } = await store.previewTemplate(
            templateUuid.value,
            previewPayload()
        );
        previewSubject.value = subject ?? '';
        const blob = new Blob([html], { type: 'text/html' });
        if (previewUrl.value) {
            URL.revokeObjectURL(previewUrl.value);
        }
        previewUrl.value = URL.createObjectURL(blob);
    } catch (e) {
        console.error(e);
    } finally {
        previewLoading.value = false;
        nextTick(() => resizePreviewFrame());
    }
}

function debouncedPreview() {
    if (suppressDebouncedPreview.value) {
        return;
    }
    if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
    }
    debounceTimer.value = setTimeout(() => {
        if (suppressDebouncedPreview.value) {
            return;
        }
        updatePreview();
    }, 500);
}

function goBack() {
    router.push({ name: 'EmailTemplates' });
}

function cancel() {
    if (isDirty.value) {
        showUnsavedDialog.value = true;
        nextRoute = null;
    } else {
        getItem();
    }
}

function confirmDiscard() {
    showUnsavedDialog.value = false;
    if (nextRoute) {
        const go = nextRoute;
        nextRoute = null;
        go();
    } else {
        getItem();
    }
}

const savePayload = computed(() => {
    const p = {
        footer_html: formData.value.footer_html,
        subject_template: formData.value.subject_template,
        from: formData.value.from,
        display_name: formData.value.display_name,
        reply_to_email: formData.value.reply_to_email,
        reply_to_name: formData.value.reply_to_name,
        bcc_recipients: formData.value.bcc_recipients,
        name: formData.value.name,
        intro_html: formData.value.intro_html
    };
    p.status = formData.value.status;
    return p;
});

function testEmailPayload() {
    return {
        recipient_email: sendTestFormData.value.recipient_email.trim(),
        ...previewPayload(),
        from: formData.value.from,
        display_name: formData.value.display_name,
        reply_to_email: formData.value.reply_to_email,
        reply_to_name: formData.value.reply_to_name,
        bcc_recipients: formData.value.bcc_recipients
    };
}

function openSendTestDialog() {
    sendTestFormData.value = { recipient_email: '' };
    globalStore.clearErrors();
    showSendTestDialog.value = true;
}

async function sendTestEmail() {
    if (!templateUuid.value) return;
    try {
        sendTestBusy.value = true;
        await store.sendTestEmail(templateUuid.value, testEmailPayload());
        showSendTestDialog.value = false;
    } catch {
        /* validation / send errors via actionWrapper */
    } finally {
        sendTestBusy.value = false;
    }
}

async function save() {
    if (!templateUuid.value) return;
    try {
        busy.value = true;
        await store.update(templateUuid.value, savePayload.value);
        await getItem();
    } catch (e) {
        console.error(e);
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <Loader v-if="loading" />
    <template v-else>
        <TitleHeader>
            <template #title>
                <div class="flex items-center gap-5">
                    <Button
                        type="button"
                        variant="outlined"
                        icon="pi pi-chevron-left"
                        size="large"
                        @click="goBack"
                        iconClass="!text-sm"
                        :disabled="busy"
                    />
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl sm:text-3xl font-bold truncate">
                            {{ loadedName || 'Email template' }}
                        </h1>
                    </div>
                </div>
            </template>
            <template #actions>
                <Button
                    v-if="ability.can('administration.email-templates.edit')"
                    severity="success"
                    label="Send test email"
                    icon="pi pi-send"
                    :disabled="busy || !templateUuid"
                    @click="openSendTestDialog"
                />
                <Button
                    label="Cancel"
                    variant="outlined"
                    @click="cancel"
                    :disabled="!isDirty || busy"
                />
                <Button
                    v-if="ability.can('administration.email-templates.edit')"
                    :disabled="!isDirty || busy"
                    label="Save"
                    icon="pi pi-check"
                    @click="save"
                    :loading="busy"
                />
            </template>
        </TitleHeader>

        <div
            class="grid grid-cols-12 gap-6 xl:gap-8 items-start xl:items-stretch"
        >
            <div class="col-span-12 xl:col-span-7 min-h-0">
                <Card class="py-4 px-4">
                    <template #content>
                        <div class="space-y-6">
                            <div class="flex justify-end">
                                <div class="flex items-center gap-3">
                                    <ToggleSwitch
                                        binary
                                        inputId="status"
                                        v-model="formData.status"
                                        size="large"
                                        :disabled="busy"
                                    />
                                    <label
                                        for="status"
                                        class="text-gray-600 dark:text-surface-400 text-lg cursor-pointer"
                                    >
                                        {{
                                            formData.status
                                                ? 'Active'
                                                : 'Inactive'
                                        }}
                                    </label>
                                </div>
                            </div>

                            <div class="grid grid-cols-12 gap-x-6 gap-y-8">
                                <div class="col-span-12 sm:col-span-6">
                                    <label class="block mb-3 required"
                                        >Template Name</label
                                    >
                                    <InputField
                                        variant="text"
                                        id="name"
                                        v-model="formData.name"
                                        class="w-full"
                                        :disabled="busy"
                                    />
                                </div>

                                <div class="col-span-12 sm:col-span-6">
                                    <label class="block mb-3 required"
                                        >From</label
                                    >
                                    <InputField
                                        variant="text"
                                        id="from"
                                        v-model="formData.from"
                                        class="w-full"
                                        :disabled="busy"
                                    />
                                    <small
                                        class="text-gray-500 block mt-2.5 mb-1 text-sm"
                                    >
                                        Mail will be delivered using
                                        {{ fromDeliveryAddress }}.
                                    </small>
                                </div>

                                <div class="col-span-12 sm:col-span-6">
                                    <label class="block mb-3 required"
                                        >Display Name (will be shown before the
                                        email)</label
                                    >
                                    <InputField
                                        variant="text"
                                        id="display_name"
                                        v-model="formData.display_name"
                                        class="w-full"
                                        :disabled="busy"
                                    />
                                </div>

                                <div class="col-span-12 sm:col-span-6">
                                    <label class="block mb-3 required"
                                        >Reply To Email</label
                                    >
                                    <InputField
                                        variant="text"
                                        id="reply_to_email"
                                        v-model="formData.reply_to_email"
                                        class="w-full"
                                        :disabled="busy"
                                    />
                                </div>

                                <div class="col-span-12 sm:col-span-6">
                                    <label class="block mb-3 required"
                                        >Reply To Name (will be shown before the
                                        email)</label
                                    >
                                    <InputField
                                        variant="text"
                                        id="reply_to_name"
                                        v-model="formData.reply_to_name"
                                        class="w-full"
                                        :disabled="busy"
                                    />
                                </div>

                                <div class="col-span-12 sm:col-span-6">
                                    <label class="block mb-3"
                                        >BCC Recipients</label
                                    >
                                    <BccRecipientsField
                                        id="bcc_recipients"
                                        v-model="formData.bcc_recipients"
                                        :disabled="busy"
                                        placeholder="Add recipients"
                                    />
                                </div>

                                <div class="col-span-12">
                                    <label class="block mb-3 required"
                                        >Subject</label
                                    >
                                    <InputField
                                        variant="text"
                                        id="subject_template"
                                        v-model="formData.subject_template"
                                        class="w-full"
                                        :disabled="busy"
                                        @input="debouncedPreview"
                                    />
                                    <div
                                        v-if="supportedVariables.subject.length"
                                        class="mt-2 flex flex-wrap gap-2 items-center"
                                    >
                                        <span
                                            class="text-gray-600 text-sm font-medium"
                                        >
                                            Supported Variables:
                                        </span>
                                        <span
                                            v-for="v in supportedVariables.subject"
                                            :key="'s-' + v"
                                            v-tooltip.top="`Click to copy`"
                                            class="flex items-center bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm cursor-pointer transition hover:bg-blue-100"
                                            @click="copyToClipboard(v)"
                                        >
                                            {{ v }}
                                        </span>
                                    </div>
                                </div>

                                <div class="col-span-12">
                                    <label
                                        class="block mb-3"
                                        for="intro_html_editor"
                                        >Body</label
                                    >
                                    <BoldOnlyQuillEditor
                                        id="intro_html_editor"
                                        v-model="formData.intro_html"
                                        :disabled="busy"
                                        preserve-html
                                        min-height="160px"
                                        @update:model-value="debouncedPreview"
                                    />
                                    <div
                                        v-if="
                                            supportedVariables.greeting.length
                                        "
                                        class="mt-2 flex flex-wrap gap-2 items-center"
                                    >
                                        <span
                                            class="text-gray-600 text-sm font-medium"
                                        >
                                            Supported Variables:
                                        </span>
                                        <span
                                            v-for="v in supportedVariables.greeting"
                                            :key="'g-' + v"
                                            v-tooltip.top="`Click to copy`"
                                            class="flex items-center bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm cursor-pointer transition hover:bg-blue-100"
                                            @click="copyToClipboard(v)"
                                        >
                                            {{ v }}
                                        </span>
                                    </div>
                                </div>

                                <div class="col-span-12">
                                    <label class="block mb-3">Footer</label>
                                    <InputField
                                        variant="text"
                                        id="footer_html"
                                        v-model="formData.footer_html"
                                        :disabled="busy"
                                        class="w-full"
                                        @input="debouncedPreview"
                                    />
                                    <div
                                        v-if="supportedVariables.footer.length"
                                        class="mt-2 flex flex-wrap gap-2 items-center"
                                    >
                                        <span
                                            class="text-gray-600 text-sm font-medium"
                                        >
                                            Supported Variables:
                                        </span>
                                        <span
                                            v-for="v in supportedVariables.footer"
                                            :key="'f-' + v"
                                            v-tooltip.top="`Click to copy`"
                                            class="flex items-center bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm cursor-pointer transition hover:bg-blue-100"
                                            @click="copyToClipboard(v)"
                                        >
                                            {{ v }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <div
                class="col-span-12 xl:col-span-5 xl:col-start-8 xl:row-start-1 min-h-0"
            >
                <Card class="py-4 px-4 xl:sticky xl:top-6 xl:z-[1] w-full">
                    <template #content>
                        <h3
                            class="text-black dark:text-surface-0 text-2xl sm:text-3xl font-bold mb-5"
                        >
                            {{
                                showLivePreview
                                    ? 'Live Preview'
                                    : 'Static Preview'
                            }}
                        </h3>

                        <div v-if="showLivePreview" class="relative">
                            <div
                                v-if="previewLoading"
                                class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-surface-900/75 z-10 rounded"
                            >
                                <Loader />
                            </div>
                            <iframe
                                v-if="previewUrl"
                                ref="previewFrame"
                                :src="previewUrl"
                                title="Email preview"
                                class="block w-full rounded border border-gray-300 dark:border-surface-700 bg-white overflow-auto"
                                style="
                                    max-height: calc(100vh - 12rem);
                                    min-height: 0;
                                "
                                frameborder="0"
                                scrolling="no"
                                @load="resizePreviewFrame"
                            ></iframe>
                            <div
                                v-else
                                class="text-center py-12 w-full rounded border border-gray-200 bg-gray-50 dark:border-surface-700 dark:bg-surface-800"
                            >
                                <p class="text-gray-500 dark:text-surface-400">
                                    No preview available
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <BaseDialog
            v-model:visible="showSendTestDialog"
            header="Send test email"
            :busy="sendTestBusy"
            cancelLabel="Cancel"
            confirmLabel="Send"
            :formData="sendTestFormData"
            :enableDirtyCheck="false"
            :disableConfirm="
                !sendTestFormData.recipient_email?.trim() || sendTestBusy
            "
            class="w-full sm:w-1/2 md:w-1/3"
            @confirm="sendTestEmail"
        >
            <div class="col-span-12">
                <label class="block mb-3 required" for="recipient_email"
                    >Recipient email</label
                >
                <InputField
                    variant="text"
                    id="recipient_email"
                    v-model="sendTestFormData.recipient_email"
                    class="w-full"
                    :disabled="sendTestBusy"
                    @keyup.enter="sendTestEmail"
                />
            </div>
        </BaseDialog>

        <Confirmation
            v-model="showUnsavedDialog"
            header="Unsaved Changes"
            content="You have unsaved changes. If you continue, those changes will be lost. Do you want to discard them?"
            variant="danger"
            confirmButtonText="Discard Changes"
            cancelButtonText="Keep Editing"
            @confirm="confirmDiscard"
        />
    </template>
</template>
