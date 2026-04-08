<script setup lang="ts">
defineProps<{
  variant: 'blank' | 'all-done'
}>()
</script>

<template>
  <div role="status" data-testid="empty-container" class="flex flex-col items-center py-12 text-center">
    <template v-if="variant === 'blank'">
      <span data-testid="empty-icon" class="mb-4 text-4xl" aria-hidden="true">&#10022;</span>
      <h2 data-testid="empty-headline" class="font-display text-lg font-semibold text-primary-container">
        A clean slate
      </h2>
      <p data-testid="empty-body" class="mt-2 max-w-xs font-body text-sm text-primary-container/70">
        Add your first task above and start getting things done.
      </p>
    </template>
    <template v-else>
      <span data-testid="empty-icon" class="mb-4 text-4xl" aria-hidden="true">&#10004;</span>
      <h2 data-testid="empty-headline" class="font-display text-lg font-semibold text-primary-container">
        All done!
      </h2>
      <p data-testid="empty-body" class="mt-2 max-w-xs font-body text-sm text-primary-container/70">
        You completed everything on your list. Take a moment to celebrate!
      </p>
    </template>
  </div>
</template>
