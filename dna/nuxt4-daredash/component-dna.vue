<script setup lang="ts">
/**
 * @name Component DNA
 * @description
 *  Standard MAWA component using DareDash primitives and layout components.
 *  Structure is driven by `dd-card`, `dd-stack`, and `dd-cluster`.
 *  Visual styling stays inside DareDash unless a small local override is justified.
 */

interface Props {
  title: string;
  count?: number;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  isActive: false,
});

const emit = defineEmits<{
  (e: 'click:action', value: number): void;
}>();

const displayTitle = computed(() => `${props.title} (${props.count})`);

function handleClick() {
  if (props.isActive) {
    emit('click:action', props.count + 1);
  }
}
</script>

<template lang="pug">
dd-card(data-testid="dna-component")
  dd-stack(compact)
    dd-cluster(tag="header" between)
      h2 {{ displayTitle }}

      slot(name="actions")

    div
      slot

    dd-cluster(tag="footer" end)
      dd-button(
        primary
        :disabled="!isActive"
        @click="handleClick"
      ) Action
</template>
