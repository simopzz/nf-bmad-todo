<script setup lang="ts">
const props = defineProps<{
  completed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
function handleCheckboxKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('toggle')
  }
}

</script>

<template>
  <label class="group flex items-center justify-center p-[13px] cursor-pointer">
    <input
      type="checkbox"
      :checked="props.completed"
      aria-label="Toggle task completion"
      class="peer sr-only"
      @change="emit('toggle')"
      @keydown="handleCheckboxKeydown"
    />
    <span
      class="peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface peer-focus-visible:rounded-full flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] transition-all duration-200 ease-out group-hover:border-secondary"
      :class="
        props.completed
          ? 'border-primary bg-primary shadow-[inset_0_0_0_2px_rgba(12,14,20,0.4)]'
          : 'border-outline-variant bg-transparent'
      "
    >
      <svg
        class="h-3 w-3 text-surface transition-all duration-200 ease-out"
        :class="props.completed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="2 6 5 9 10 3" />
      </svg>
    </span>
  </label>
</template>
