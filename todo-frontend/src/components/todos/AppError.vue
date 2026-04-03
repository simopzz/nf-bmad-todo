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
  <div role="status" data-testid="load-error" class="flex flex-col items-center py-12 text-center">
    <span class="mb-4 text-4xl" aria-hidden="true">&#9888;</span>
    <h2 class="font-display text-lg font-semibold text-primary-container">
      Couldn't load your tasks
    </h2>
    <p class="mt-2 max-w-xs font-body text-sm text-primary-container/70">
      Something went wrong reaching the server. Check your connection and try again.
    </p>
    <button
      type="button"
      class="mt-6 rounded-lg bg-gradient-to-r from-primary-container to-primary-container/80 px-6 py-2 font-body text-sm font-medium text-surface-lowest shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="retrying"
      @click="void handleRetry()"
    >
      Retry
    </button>
  </div>
</template>
