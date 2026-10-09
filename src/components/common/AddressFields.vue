<script setup>
import InputField from '@/components/common/InputField.vue';

const props = defineProps({
    formData: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    idPrefix: { type: String, default: '' },
    showTitle: { type: Boolean, default: true },
    title: { type: String, default: 'Address' },
    zipLabel: { type: String, default: 'ZIP/Postal Code' },
    requiredFields: {
        type: Object,
        default: () => ({
            country: false,
            state: false,
            city: false,
            zip: false
        })
    },
    layout: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'contact'].includes(value)
    }
});

const emit = defineEmits(['enter']);

function fieldId(name) {
    return props.idPrefix ? `${props.idPrefix}${name}` : name;
}

function labelClass(field) {
    return ['block', 'mb-3', props.requiredFields[field] ? 'required' : '']
        .filter(Boolean)
        .join(' ');
}

function onEnter() {
    emit('enter');
}

function colClass(field) {
    const streetFields = [
        'street_address_1',
        'street_address_2',
        'street_address_3'
    ];

    if (props.layout === 'contact') {
        return streetFields.includes(field) ? 'col-span-12' : 'col-span-6';
    }

    const locationFields = ['country', 'state', 'city', 'zip'];
    if (streetFields.includes(field)) {
        return 'col-span-12 sm:col-span-6 lg:col-span-4';
    }
    if (locationFields.includes(field)) {
        return 'col-span-12 sm:col-span-6 lg:col-span-3';
    }
    return 'col-span-12 sm:col-span-6 lg:col-span-4';
}
</script>

<template>
    <div class="panel-surface">
        <div v-if="showTitle" class="mb-5">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {{ title }}
            </h3>
        </div>
        <div class="grid grid-cols-12 gap-6">
            <div :class="colClass('country')">
                <label :class="labelClass('country')" :for="fieldId('country')">
                    Country
                </label>
                <InputField
                    :id="fieldId('country')"
                    v-model="formData.country"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>

            <div :class="colClass('state')">
                <label :class="labelClass('state')" :for="fieldId('state')">
                    State/Province
                </label>
                <InputField
                    :id="fieldId('state')"
                    v-model="formData.state"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>

            <div :class="colClass('city')">
                <label :class="labelClass('city')" :for="fieldId('city')">
                    City
                </label>
                <InputField
                    :id="fieldId('city')"
                    v-model="formData.city"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>

            <div :class="colClass('zip')">
                <label :class="labelClass('zip')" :for="fieldId('zip')">
                    {{ zipLabel }}
                </label>
                <InputField
                    :id="fieldId('zip')"
                    v-model="formData.zip"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>

            <div :class="colClass('street_address_1')">
                <label class="block mb-3" :for="fieldId('street_address_1')">
                    Street Address 1
                </label>
                <InputField
                    :id="fieldId('street_address_1')"
                    v-model="formData.street_address_1"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>

            <div :class="colClass('street_address_2')">
                <label class="block mb-3" :for="fieldId('street_address_2')">
                    Street Address 2
                </label>
                <InputField
                    :id="fieldId('street_address_2')"
                    v-model="formData.street_address_2"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>

            <div :class="colClass('street_address_3')">
                <label class="block mb-3" :for="fieldId('street_address_3')">
                    Street Address 3
                </label>
                <InputField
                    :id="fieldId('street_address_3')"
                    v-model="formData.street_address_3"
                    variant="text"
                    class="w-full"
                    inputClass="w-full"
                    :disabled="disabled"
                    @keyup.enter="onEnter"
                />
            </div>
        </div>
    </div>
</template>
