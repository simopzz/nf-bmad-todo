<script setup lang="ts">
defineProps<{
  completed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

function handleSpaceKeydown(event: KeyboardEvent) {
  if (!event.repeat) {
    emit('toggle')
  }
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="completed"
    class="group flex items-center justify-center p-[13px]"
    @click="emit('toggle')"
    @keydown.space.prevent="handleSpaceKeydown"
  >
    <span
      class="flex h-[18px] w-[18px] items-center justify-center rounded-md border-[1.5px] transition-all duration-150 ease-in-out group-hover:border-primary-container"
      :class="
        completed
          ? 'border-secondary bg-secondary'
          : 'border-outline-variant bg-transparent'
      "
    >
      <svg
        class="h-3 w-3 text-white transition-all duration-150 ease-in-out"
        :class="completed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"
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
  </button>
</template>
