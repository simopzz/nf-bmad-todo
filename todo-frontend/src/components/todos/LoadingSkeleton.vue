<template>
  <div class="flex flex-col">
    <div
      v-for="n in 4"
      :key="n"
      data-testid="skeleton-row"
      class="flex items-center rounded-lg px-2 py-3"
    >
      <div
        data-testid="skeleton-checkbox"
        class="h-5 w-5 shrink-0 rounded-full bg-surface-low animate-shimmer"
      />
      <div
        data-testid="skeleton-title"
        class="ml-3 h-4 flex-1 rounded bg-surface-low animate-shimmer"
        :style="{ maxWidth: widths[n - 1] }"
      />
      <div
        data-testid="skeleton-action"
        class="ml-2 h-4 w-4 rounded bg-surface-low animate-shimmer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const widths = ['75%', '60%', '85%', '50%']
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-color: theme('colors.surface-low');
  }
  50% {
    background-color: theme('colors.surface-highest');
  }
  100% {
    background-color: theme('colors.surface-low');
  }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>
