<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import TaskCheckbox from '@/components/todos/TaskCheckbox.vue'
import type { Todo } from '@/types/todo'

const props = defineProps<{
  todo: Todo
  isEditing: boolean
  isPending?: boolean
  mutationFailed?: boolean
  onCommitEdit?: (id: number, title: string) => Promise<boolean>
}>()

const emit = defineEmits<{
  editStart: [id: number]
  editEnd: []
  toggleComplete: [id: number, completed: boolean]
  delete: [id: number]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const rowRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const isFocusWithin = ref(false)
const skipBlurCommit = ref(false)
const editDraft = ref(props.todo.title)
const editMutationFailed = ref(false)
const isActionVisible = computed(() => isHovered.value || isFocusWithin.value)
const isPending = computed(() => props.isPending === true)
const isDeleteControlVisible = computed(() => isPending.value || isActionVisible.value)
const hasMutationFailed = computed(
  () => props.mutationFailed === true || editMutationFailed.value,
)
let editMutationFlashTimer: ReturnType<typeof setTimeout> | null = null

function scheduleEditMutationFlashReset() {
  if (editMutationFlashTimer !== null) {
    clearTimeout(editMutationFlashTimer)
  }

  editMutationFlashTimer = setTimeout(() => {
    editMutationFailed.value = false
    editMutationFlashTimer = null
  }, 1500)
}

// Reset draft each time we enter edit mode; also focus the edit input
watch(
  () => props.isEditing,
  (editing) => {
    if (editing) {
      editDraft.value = props.todo.title
      nextTick(() => inputRef.value?.focus())
    }
  },
)

function handleTitleClick() {
  if (isPending.value) {
    return
  }
  emit('editStart', props.todo.id)
  // focus management happens in the watch above, after isEditing prop updates
}

function endEditMode() {
  emit('editEnd')
  nextTick(() => rowRef.value?.focus())
}

async function commitEdit() {
  if (isPending.value) {
    return
  }

  const nextTitle = editDraft.value.trim()
  const currentTitle = props.todo.title.trim()

  if (!nextTitle || nextTitle === currentTitle) {
    editDraft.value = props.todo.title
    endEditMode()
    return
  }

  let committed = true
  try {
    committed = (await props.onCommitEdit?.(props.todo.id, nextTitle)) ?? true
  } catch {
    committed = false
  }

  if (!committed) {
    editDraft.value = props.todo.title
    editMutationFailed.value = true
    scheduleEditMutationFlashReset()
    endEditMode()
    return
  }

  endEditMode()
}

function handleEditKeydown(event: KeyboardEvent) {
  if (isPending.value) {
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    skipBlurCommit.value = true
    void commitEdit()
  } else if (event.key === 'Escape') {
    editDraft.value = props.todo.title
    endEditMode()
  }
}

function handleEditBlur() {
  if (isPending.value) {
    return
  }

  if (skipBlurCommit.value) {
    skipBlurCommit.value = false
    return
  }

  void commitEdit()
}

function handleToggle() {
  if (isPending.value) {
    return
  }
  emit('toggleComplete', props.todo.id, !props.todo.completed)
}

function handleDeleteClick() {
  if (isPending.value) {
    return
  }
  emit('delete', props.todo.id)
}

function handleRowFocusIn() {
  isFocusWithin.value = true
}

function handleRowFocusOut(event: FocusEvent) {
  const row = event.currentTarget

  if (
    row instanceof HTMLElement &&
    event.relatedTarget instanceof Node &&
    row.contains(event.relatedTarget)
  ) {
    return
  }

  isFocusWithin.value = false
}

onBeforeUnmount(() => {
  if (editMutationFlashTimer !== null) {
    clearTimeout(editMutationFlashTimer)
  }
})
</script>

<template>
  <div
    ref="rowRef"
    tabindex="-1"
    data-testid="todo-row"
    class="group flex items-center rounded px-2 transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
    :class="[
      isActionVisible ? 'bg-surface-highest' : 'bg-transparent',
      isPending ? 'opacity-70' : '',
      hasMutationFailed ? 'ring-1 ring-outline-variant/40' : '',
    ]"
    :aria-busy="isPending ? 'true' : undefined"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focusin="handleRowFocusIn"
    @focusout="handleRowFocusOut"
  >
    <TaskCheckbox
      :completed="todo.completed"
      :disabled="isPending"
      @toggle="handleToggle"
    />

    <!-- Title display mode -->
    <span
      v-if="!isEditing"
      tabindex="0"
      data-testid="todo-title"
      class="min-w-0 flex-1 cursor-pointer py-4 font-display text-[1.5rem] leading-[1.1] transition-colors duration-300 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
      :class="todo.completed ? 'line-through text-on-tertiary-fixed-variant' : 'text-on-surface'"
      @click="handleTitleClick"
      @keydown.enter.prevent="handleTitleClick"
    >
      {{ todo.title }}
    </span>

    <!-- Inline edit mode -->
    <input
      ref="inputRef"
      v-else
      v-model="editDraft"
      data-testid="edit-input"
      type="text"
      aria-label="Edit task"
      class="min-w-0 flex-1 bg-transparent py-4 font-display text-[1.5rem] font-bold leading-[1.1] text-on-surface outline-none placeholder:text-on-surface-variant/40 ring-1 ring-outline-variant/20"
      @keydown="handleEditKeydown"
      @blur="handleEditBlur"
    />

    <!-- Delete control -->
    <button
      type="button"
      data-testid="delete-btn"
      aria-label="Delete task"
      class="ml-2 shrink-0 flex items-center justify-center rounded p-[14px] text-on-surface-variant transition-all duration-300 ease-out hover:text-on-surface focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:ring-offset-surface [@media(hover:none)]:!opacity-100 [@media(hover:none)]:!pointer-events-auto"
      :class="isDeleteControlVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      :tabindex="isDeleteControlVisible && !isPending ? 0 : -1"
      :disabled="isPending"
      @click="handleDeleteClick"
    >
      <svg
        v-if="!isPending"
        class="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
      </svg>
      <svg
        v-else
        class="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 3a9 9 0 109 9" />
      </svg>
    </button>
    <span
      v-if="isPending"
      class="sr-only"
      role="status"
      aria-live="polite"
    >
      Saving task changes
    </span>
  </div>
</template>
