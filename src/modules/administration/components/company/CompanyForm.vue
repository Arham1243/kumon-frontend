<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { ability } from '@/plugins/ability';
import { COMPANY_DEFAULT_TIMEZONE, dateFormats } from '@/config/enums';
import { timezoneSelectOptionsEnsuring } from '@/config/timezoneOptions';
import { useGlobalStore, useSessionStore } from '@/stores';
import { useCompanyStore } from '@/modules/administration/stores';
import { useFormDirty } from '@/composables/useFormDirty';
import AddressFields from '@/components/common/AddressFields.vue';
import InputField from '@/components/common/InputField.vue';
import TitleHeader from '@/components/common/TitleHeader.vue';
import Loader from '@/components/common/Loader.vue';
import Confirmation from '@/components/common/Confirmation.vue';
import PlaceholderImage from '@/assets/images/image_not_available.png';

const PHP_TO_UI_DATE_FORMAT = {
    'Y-m-d': 'yy-mm-dd',
    'm/d/Y': 'mm/dd/yy',
    'd/m/Y': 'dd/mm/yy'
};

function normalizeDateFormatFromApi(value) {
    if (!value) {
        return 'mm/dd/yy';
    }
    if (dateFormats.some((option) => option.code === value)) {
        return value;
    }
    return PHP_TO_UI_DATE_FORMAT[value] || 'mm/dd/yy';
}

const globalStore = useGlobalStore();
const sessionStore = useSessionStore();
const myCompanyStore = useCompanyStore();
const busy = ref(false);
const loading = ref(false);
const showUnsavedDialog = ref(false);
const activeCompanyTab = ref('0');
const formData = ref({
    name: '',
    street_address_1: '',
    street_address_2: '',
    street_address_3: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    timezone: COMPANY_DEFAULT_TIMEZONE,
    date_format: 'mm/dd/yy',
    logo: null
});

const { isDirty, resetDirty } = useFormDirty(formData);
let nextRoute = null;

const canEditCompany = computed(() =>
    ability.can('administration.company.edit')
);
const formFieldDisabled = computed(() => busy.value || !canEditCompany.value);

const timezoneSelectOptions = computed(() =>
    timezoneSelectOptionsEnsuring(formData.value.timezone)
);

onBeforeRouteLeave((to, from, nextFn) => {
    if (isDirty.value) {
        showUnsavedDialog.value = true;
        nextRoute = nextFn;
    } else {
        nextFn();
    }
});

function buildCompanyPayload() {
    return {
        name: formData.value.name,
        street_address_1: formData.value.street_address_1,
        street_address_2: formData.value.street_address_2,
        street_address_3: formData.value.street_address_3,
        city: formData.value.city,
        state: formData.value.state,
        zip: formData.value.zip,
        country: formData.value.country,
        timezone: formData.value.timezone,
        date_format: formData.value.date_format,
        logo: formData.value.logo
    };
}

function onFileSelect(event) {
    const file = event.files?.[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        formData.value.logo = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function cancel() {
    if (isDirty.value) {
        showUnsavedDialog.value = true;
    } else {
        await getDetails();
    }
}

async function confirmDiscard() {
    showUnsavedDialog.value = false;
    if (nextRoute) {
        const go = nextRoute;
        nextRoute = null;
        go();
    } else {
        await getDetails();
    }
}

function applyCompanyResponse(res) {
    if (!res) {
        return;
    }
    formData.value = {
        ...formData.value,
        name: res.name ?? '',
        street_address_1: res.street_address_1 ?? '',
        street_address_2: res.street_address_2 ?? '',
        street_address_3: res.street_address_3 ?? '',
        city: res.city ?? '',
        state: res.state ?? '',
        zip: res.zip ?? '',
        country: res.country ?? '',
        timezone: res.timezone || COMPANY_DEFAULT_TIMEZONE,
        date_format: normalizeDateFormatFromApi(res.date_format),
        logo: res.logo_url || res.logo || null
    };
    resetDirty(formData.value);
}

const getDetails = async ({ showLoader = true } = {}) => {
    try {
        if (showLoader) {
            loading.value = true;
        }
        const res = await myCompanyStore.getMyCompany();
        applyCompanyResponse(res);
    } finally {
        if (showLoader) {
            loading.value = false;
        }
        globalStore.clearErrors();
    }
};

const save = async () => {
    try {
        busy.value = true;
        await myCompanyStore.saveCompany(buildCompanyPayload());
        await sessionStore.me();
        await getDetails({ showLoader: false });
    } finally {
        busy.value = false;
    }
};

onBeforeMount(() => {
    getDetails();
});
</script>

<template>
    <Loader v-if="loading" />
    <template v-else>
        <TitleHeader>
            <template #title>
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold">My Company</h1>
                </div>
            </template>
            <template v-if="canEditCompany" #actions>
                <Button
                    label="Cancel"
                    variant="outlined"
                    class="w-full sm:w-auto"
                    :disabled="!isDirty || busy"
                    @click="cancel"
                />
                <Button
                    :disabled="!isDirty || busy"
                    label="Save"
                    icon="pi pi-check"
                    icon-pos="left"
                    :loading="busy"
                    class="w-full sm:w-auto"
                    @click="save"
                />
            </template>
        </TitleHeader>

        <Card class="tabs-card">
            <template #content>
                <Tabs
                    :value="activeCompanyTab"
                    @update:value="activeCompanyTab = $event"
                >
                    <TabList>
                        <Tab value="0">Information</Tab>
                        <Tab value="1">Settings</Tab>
                    </TabList>
                    <div class="pt-4 pb-2">
                        <TabPanels class="!px-0 !pb-0">
                            <TabPanel value="0">
                                <div class="grid grid-cols-12 gap-6">
                                    <div class="col-span-12 lg:col-span-6">
                                        <label class="block mb-3 required"
                                            >Name</label
                                        >
                                        <InputField
                                            id="name"
                                            v-model="formData.name"
                                            variant="text"
                                            class="w-full"
                                            :disabled="formFieldDisabled"
                                            @keyup.enter="save"
                                        />
                                    </div>

                                    <div class="col-span-12">
                                        <AddressFields
                                            :form-data="formData"
                                            :disabled="formFieldDisabled"
                                            :required-fields="{
                                                country: true,
                                                state: true,
                                                city: true,
                                                zip: true
                                            }"
                                            @enter="save"
                                        />
                                    </div>

                                    <div
                                        class="col-span-12 flex justify-center mt-4"
                                    >
                                        <div
                                            class="flex flex-col items-center gap-4"
                                        >
                                            <label
                                                class="block font-semibold flex items-center gap-2"
                                            >
                                                Company logo
                                                <i
                                                    class="pi pi-info-circle text-gray-400 cursor-pointer"
                                                    v-tooltip.top="
                                                        'PNG, JPG, GIF, or WebP. Max 500 KB.'
                                                    "
                                                ></i>
                                            </label>
                                            <div
                                                class="border border-gray-300 rounded-lg shadow-sm flex items-center justify-center bg-gray-50 dark:bg-gray-800 h-40 w-40 overflow-hidden p-2"
                                            >
                                                <img
                                                    v-if="formData.logo"
                                                    :src="formData.logo"
                                                    alt="Company logo"
                                                    class="max-h-full max-w-full object-contain"
                                                />
                                                <img
                                                    v-else
                                                    :src="PlaceholderImage"
                                                    alt=""
                                                    class="object-contain h-full w-full opacity-40"
                                                />
                                            </div>
                                            <div
                                                v-if="canEditCompany"
                                                class="flex justify-center"
                                            >
                                                <FileUpload
                                                    name="companyLogo"
                                                    mode="basic"
                                                    custom-upload
                                                    auto
                                                    choose-label="Upload"
                                                    choose-icon="pi pi-upload"
                                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                                    :max-file-size="512000"
                                                    :disabled="formFieldDisabled"
                                                    @select="onFileSelect"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel value="1">
                                <div class="grid grid-cols-12 gap-6">
                                    <!-- Home timezone hidden for now
                                    <div class="col-span-12 md:col-span-4">
                                        <label class="block mb-3"
                                            >Home timezone</label
                                        >
                                        <InputField
                                            id="timezone"
                                            v-model="formData.timezone"
                                            variant="dropdown"
                                            :options="timezoneSelectOptions"
                                            option-label="name"
                                            option-value="code"
                                            placeholder="Select"
                                            class="w-full"
                                            :disabled="formFieldDisabled"
                                            filter
                                            :filter-fields="['name', 'code']"
                                            filter-placeholder="Search timezone"
                                        />
                                    </div>
                                    -->
                                    <div class="col-span-12 md:col-span-4">
                                        <label class="block mb-3"
                                            >Date format</label
                                        >
                                        <InputField
                                            id="date_format"
                                            v-model="formData.date_format"
                                            variant="dropdown"
                                            :options="dateFormats"
                                            option-label="name"
                                            option-value="code"
                                            placeholder="Select"
                                            class="w-full"
                                            :disabled="formFieldDisabled"
                                        />
                                    </div>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </div>
                </Tabs>
            </template>
        </Card>

        <Confirmation
            v-model="showUnsavedDialog"
            header="Unsaved Changes"
            content="You have unsaved changes. If you continue, those changes will be lost. Do you want to discard them?"
            confirm-button-text="Discard Changes"
            cancel-button-text="Keep Editing"
            variant="danger"
            @confirm="confirmDiscard"
        />
    </template>
</template>
