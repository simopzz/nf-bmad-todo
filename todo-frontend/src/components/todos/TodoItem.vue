<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import TaskCheckbox from '@/components/todos/TaskCheckbox.vue'
import type { Todo } from '@/types/todo'

const props = defineProps<{
  todo: Todo
  isEditing: boolean
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
  emit('editStart', props.todo.id)
  // focus management happens in the watch above, after isEditing prop updates
}

function endEditMode() {
  emit('editEnd')
  nextTick(() => rowRef.value?.focus())
}

async function commitEdit() {
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
  if (skipBlurCommit.value) {
    skipBlurCommit.value = false
    return
  }

  void commitEdit()
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
    class="flex items-center rounded-lg border-[1px] px-2 transition-colors duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
    :class="[
      isActionVisible ? 'bg-surface-highest' : 'bg-transparent',
      hasMutationFailed ? 'border-outline-variant' : 'border-transparent',
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focusin="handleRowFocusIn"
    @focusout="handleRowFocusOut"
  >
    <TaskCheckbox
      :completed="todo.completed"
      @toggle="emit('toggleComplete', todo.id, !todo.completed)"
    />

    <!-- Title display mode -->
    <span
      v-if="!isEditing"
      tabindex="0"
      data-testid="todo-title"
      class="flex-1 cursor-pointer py-3 font-body text-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm"
      :class="todo.completed ? 'line-through text-on-surface-variant' : 'text-primary-container'"
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
      class="flex-1 rounded-lg border-l-2 border-secondary bg-surface-lowest px-2 py-3 font-body text-sm text-primary-container outline-none"
      @keydown="handleEditKeydown"
      @blur="handleEditBlur"
    />

    <!-- Delete control -->
    <button
      type="button"
      data-testid="delete-btn"
      aria-label="Delete task"
      class="ml-2 flex items-center justify-center p-[14px] transition-opacity duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm [@media(hover:none)]:!opacity-100 [@media(hover:none)]:!pointer-events-auto"
      :class="isActionVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      :tabindex="isActionVisible ? 0 : -1"
      @click="emit('delete', todo.id)"
    >
      <svg
        class="h-4 w-4 text-primary-container"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
      </svg>
    </button>
  </div>
</template>
