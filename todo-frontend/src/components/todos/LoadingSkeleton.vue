<template>
  <div class="flex flex-col rounded bg-surface-low px-4 py-4">
    <div
      v-for="n in 4"
      :key="n"
      data-testid="skeleton-row"
      class="flex items-center rounded px-2 py-4"
    >
      <div
        data-testid="skeleton-checkbox"
        class="h-5 w-5 shrink-0 rounded-full bg-surface-highest animate-shimmer"
      />
      <div
        data-testid="skeleton-title"
        class="ml-3 h-4 flex-1 rounded bg-surface-highest animate-shimmer"
        :style="{ maxWidth: widths[n - 1] }"
      />
      <div
        data-testid="skeleton-action"
        class="ml-2 h-4 w-4 rounded bg-surface-highest animate-shimmer"
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
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.animate-shimmer {
  background-image: linear-gradient(
    110deg,
    theme('colors.surface-low') 8%,
    theme('colors.surface-bright') 18%,
    theme('colors.surface-low') 33%
  );
  background-size: 200% 100%;
  background-position: 200% 0;
  animation: shimmer 1.5s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-shimmer {
    animation: none;
    background-image: none;
  }
}
</style>
