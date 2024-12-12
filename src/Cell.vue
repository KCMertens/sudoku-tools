<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue';

const nineArray = Array.from({ length: 9 }, (_, i) => i + 1);

const localPencilMarks = ref(new Set<number>(nineArray));
const props = defineProps<{
  modelValue: Set<number>;
  focusClass?: string;
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', pencilMarks: Set<number>): void;
}>();
watch(localPencilMarks, (newPencilMarks, oldPencilmarks) => {
  emit('update:modelValue', newPencilMarks);
}, {deep: true});
watch(() => props.modelValue, (newPencilMarks, oldPencilmarks) => {
  localPencilMarks.value = newPencilMarks;
}, {deep: true, immediate: true});


function togglePencilmark(e: KeyboardEvent) {
  console.log(e.key);
  if (e.key === 'Delete') {
    localPencilMarks.value.clear();
    return;
  }
  if (e.key === 'Backspace') {
    const lastAdded = Array.from(localPencilMarks.value).pop();
    if (lastAdded !== undefined) {
      localPencilMarks.value.delete(lastAdded);
    }
  }
  const digit = Number(e.key);
  if (nineArray.includes(digit)) {
    localPencilMarks.value.has(digit) ? localPencilMarks.value.delete(digit) : localPencilMarks.value.add(digit);
  } 
}









</script>

<template>
 <div class="sudoku-cell bg-light border border-primary" style="--border-style: dashed" @keydown="togglePencilmark" tabindex="0">
  
  <div class=" h-100 w-100 d-flex justify-content-center align-items-center" >
    <span style="white-space: wrap; word-break: break-all; text-align: center;">
    
    <template v-for="i in nineArray" :key="i">
      <template v-if="localPencilMarks.has(i)">
        {{ i }}
      </template>
    </template>
  </span>
  </div>
 </div>
</template>

<style scoped lang="scss">
.sudoku-cell {
  width: 50px;
  height: 50px;

  &:focus {
    outline: 2px solid blue;
    z-index: 2;
  }
}


</style>
