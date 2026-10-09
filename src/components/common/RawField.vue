<script setup>
import DateField from './DateField.vue';
import TimeField from './TimeField.vue';
import { truncate } from 'lodash-es';
import { useAttrs, computed } from 'vue';
const attrs = useAttrs();

const selectPlaceholder = computed(() => {
    const p = attrs.placeholder;
    if (typeof p === 'string' && p.trim() !== '') {
        return p.trim();
    }
    return 'Select';
});

defineProps({
    variant: {
        type: String,
        required: true
    },
    invalid: {
        type: Boolean,
        default: false
    },
    errorMessages: {
        type: [String, Array]
    }
});
</script>
<template>
    <InputText
        v-if="variant == 'text'"
        v-bind="$attrs"
        :invalid="invalid"
        @input="
            $attrs['onUpdate:modelValue'] &&
            $attrs['onUpdate:modelValue'](
                $event.target.value === '' ? null : $event.target.value
            )
        "
    />
    <Textarea
        v-else-if="variant == 'textarea'"
        v-bind="$attrs"
        :invalid="invalid"
        spellcheck="true"
        @input="
            $attrs['onUpdate:modelValue'] &&
            $attrs['onUpdate:modelValue'](
                $event.target.value === '' ? null : $event.target.value
            )
        "
    />
    <AutoComplete
        v-else-if="variant == 'autocomplete'"
        v-bind="$attrs"
        :invalid="invalid"
    />
    <Chips v-else-if="variant == 'chips'" v-bind="$attrs" />
    <Checkbox v-else-if="variant == 'checkbox'" v-bind="$attrs" />
    <RadioButton v-else-if="variant == 'radio'" v-bind="$attrs" />
    <InputNumber
        v-else-if="variant == 'number'"
        v-bind="$attrs"
        :invalid="invalid"
        :maxFractionDigits="2"
        :max="999999999999999"
        @input="
            $attrs['onUpdate:modelValue'] &&
            $attrs['onUpdate:modelValue']($event.value)
        "
        @keydown="
            (event) => {
                const input = event.target;
                const currentValue = input.value;
                const key = event.key;

                // If user types a decimal point as the first character or after clearing
                if (
                    key === '.' &&
                    (!currentValue ||
                        currentValue === '' ||
                        currentValue === '-')
                ) {
                    event.preventDefault();
                    const newValue = currentValue === '-' ? '-0.' : '0.';
                    input.value = newValue;
                    // Trigger input event to update the model
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        "
    />
    <Password
        v-else-if="variant == 'password'"
        v-bind="$attrs"
        :invalid="invalid"
    />
    <MultiSelect
        v-else-if="variant == 'multiselect'"
        v-bind="$attrs"
        :placeholder="selectPlaceholder"
        :invalid="invalid"
    />
    <Select
        v-else-if="variant == 'dropdown'"
        v-bind="$attrs"
        :placeholder="selectPlaceholder"
        :invalid="invalid"
    >
        <template #option="{ option }" v-if="$attrs.tooltip">
            <div
                v-if="
                    option.value
                        ? option.value.length > ($attrs.tooltipLength ?? 20)
                        : option.name.length > ($attrs.tooltipLength ?? 20)
                "
                v-tooltip.top="option.value ?? option.name"
            >
                {{
                    truncate(option.name, {
                        length: $attrs.tooltipLength ?? 20
                    })
                }}
            </div>
        </template>
    </Select>
    <SelectButton v-else-if="variant == 'selectButton'" v-bind="$attrs" />
    <ToggleSwitch v-else-if="variant == 'switch'" v-bind="$attrs" />
    <DateField
        v-else-if="variant == 'date'"
        v-bind="$attrs"
        :class="{ 'date-field--invalid': invalid }"
    />
    <TimeField
        v-else-if="variant == 'time'"
        v-bind="$attrs"
        :invalid="invalid"
        :class="{ 'time-field--invalid': invalid }"
    />
</template>

<style lang="scss" scoped></style>
