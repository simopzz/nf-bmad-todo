<script setup lang="ts">
defineProps<{
  variant: 'blank' | 'all-done'
}>()
</script>

<template>
  <div
    role="status"
    data-testid="empty-container"
    class="flex flex-col items-start rounded bg-surface-low px-6 py-10 text-left"
  >
    <template v-if="variant === 'blank'">
      <span
        data-testid="empty-icon"
        class="mb-5 grid h-12 w-12 place-items-center rounded-full bg-surface-highest text-2xl text-on-surface"
        aria-hidden="true"
        >&#10022;</span
      >
      <h2 data-testid="empty-headline" class="font-display text-[3.5rem] font-semibold leading-[0.95] text-on-surface">
        A clean slate
      </h2>
      <p data-testid="empty-body" class="mt-3 max-w-sm font-body text-sm text-on-surface-variant">
        Add your first task above and start getting things done.
      </p>
    </template>
    <template v-else>
      <span
        data-testid="empty-icon"
        class="mb-5 grid h-12 w-12 place-items-center rounded-full bg-surface-highest text-2xl text-primary"
        aria-hidden="true"
        >&#10004;</span
      >
      <h2 data-testid="empty-headline" class="font-display text-[3.5rem] font-semibold leading-[0.95] text-on-surface">
        All done!
      </h2>
      <p data-testid="empty-body" class="mt-3 max-w-sm font-body text-sm text-on-surface-variant">
        You completed everything on your list. Take a moment to celebrate!
      </p>
    </template>
  </div>
</template>
