<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  onRetry: () => Promise<void> | void
}>()

const retrying = ref(false)

async function handleRetry() {
  if (retrying.value) return

  retrying.value = true
  try {
    await props.onRetry()
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <div
    role="status"
    data-testid="load-error"
    class="flex flex-col items-start rounded bg-surface-low px-6 py-10 text-left"
  >
    <span
      class="mb-5 grid h-12 w-12 place-items-center rounded-full bg-surface-highest text-2xl text-on-surface"
      aria-hidden="true"
      >&#9888;</span
    >
    <h2 class="font-display text-[2rem] font-semibold leading-tight text-on-surface">
      Couldn't load your tasks
    </h2>
    <p class="mt-3 max-w-sm font-body text-sm text-on-surface-variant">
      Something went wrong reaching the server. Check your connection and try again.
    </p>
    <button
      type="button"
      class="mt-6 rounded bg-primary-container px-6 py-3 font-body text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-on-primary-container transition duration-300 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="retrying"
      @click="void handleRetry()"
    >
      Retry
    </button>
  </div>
</template>
