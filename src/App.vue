<script setup lang="ts">
import { computed, ref } from 'vue';
import Cell from './Cell.vue';

const nineArray = Array.from({ length: 9 }, (_, i) => i + 1);
const initialPencilMarks = new Set<number>(nineArray);

const globalPencilMarks = ref(new Set(initialPencilMarks));
const cellSpecificPencilMarks = ref([] as Array<Set<number>>);

function changeFocus(e: KeyboardEvent) {
  const focusElements = (e.currentTarget as HTMLElement).querySelectorAll('.sudoku-cell');
  const currentFocus = document.activeElement;

  const currentIndex = Array.from(focusElements).findIndex((cell, index) =>
    cell.contains(currentFocus) || cell === currentFocus
  );

  if (currentIndex === -1) {
    return;
  }

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 's') {
    const nextIndex = currentIndex + 1;
    if (nextIndex < focusElements.length) {
      (focusElements[nextIndex] as HTMLElement).focus();
    }
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'w') {
    const nextIndex = currentIndex - 1;
    if (nextIndex >= 0) {
      (focusElements[nextIndex] as HTMLElement).focus();
    }
  }
}

function addCell() {
  cellSpecificPencilMarks.value.push(new Set());
}
function removeCell() {
  cellSpecificPencilMarks.value.pop();
}

const minCageSize = ref(1);
const maxCageSize = ref(9);
function setSize(n: number, force: boolean) {
  if (force) {
    minCageSize.value = n;
    maxCageSize.value = n;
    return;
  }

  if (n === minCageSize.value && n === maxCageSize.value) {
    minCageSize.value = 0;
    maxCageSize.value = 0;
    return;
  }

  if (n === minCageSize.value) { minCageSize.value = maxCageSize.value; }
  else if (n === maxCageSize.value) { maxCageSize.value = minCageSize.value; }
  else {
    const closest = Math.abs(n - minCageSize.value) < Math.abs(n - maxCageSize.value) ? minCageSize : maxCageSize;
    closest.value = n;
  }

  if (minCageSize.value === 0 && maxCageSize.value !== 0) { minCageSize.value = maxCageSize.value; }
  if (maxCageSize.value === 0 && minCageSize.value !== 0) { maxCageSize.value = minCageSize.value; }

  if (minCageSize.value > maxCageSize.value && maxCageSize.value !== 0) {
    const temp = minCageSize.value;
    minCageSize.value = maxCageSize.value;
    maxCageSize.value = temp;
  }
  if (maxCageSize.value < minCageSize.value && minCageSize.value !== 0) {
    const temp = maxCageSize.value;
    maxCageSize.value = minCageSize.value;
    minCageSize.value = temp;
  }
}


const cageSumMin = ref(0);
const cageSumModelMin = computed({
  get: () => cageSumMin.value,
  set: (value: string|number) => {
    cageSumMin.value = Math.max(0, Math.min(Number(value), 45));
  }
})
const cageSumMax = ref(0);
const cageSumModelMax = computed({
  get: () => cageSumMax.value,
  set: (value: string|number) => {
    cageSumMax.value = Math.max(0, Math.min(Number(value), 45));
  }
})





import compute, { allCombinations } from './compute';

type Combination = typeof allCombinations[0];
const validCombinations = computed<Set<Combination>>(() => compute({
  cellsMustContain: cellSpecificPencilMarks.value.filter(set => set.size > 0),
  cellsMayOnlyContain: globalPencilMarks.value,
  minNumbeOfCages: minCageSize.value !== 0 ? minCageSize.value : undefined,
  maxNumberOfCages: maxCageSize.value !== 0 ? maxCageSize.value : undefined,
  cageSumRange: [cageSumMin.value, cageSumMax.value],
}))



const byCageSizeBySum = computed<Map<number, Map<number, Combination[]>>>(() => {
  const result = new Map<number /*cage size*/, Map<number/*sum*/, Combination[]>>();
  
  for (const combination of allCombinations) {
    if (!result.has(combination.cageSize)) {
      result.set(combination.cageSize, new Map());
    }
    const bySum = result.get(combination.cageSize)!;
    if (!bySum.has(combination.sum)) {
      bySum.set(combination.sum, []);
    }
    bySum.get(combination.sum)!.push(combination);
  }
  return result;
});

const shownByCageSizeBySum = computed(() => {
  const result = new Map<number, Map<number, Combination[]>>();
  for (const [cageSize, bySum] of byCageSizeBySum.value) {
    const filteredBySum = new Map<number, Combination[]>();
    for (const [sum, combinations] of bySum) {
      const valid = combinations.filter(combination => validCombinations.value.has(combination));
      if (valid.length > 0) filteredBySum.set(sum, valid);
    }
    if (filteredBySum.size > 0) result.set(cageSize, filteredBySum);
  }
  return result;
});

function resetAll() {
  globalPencilMarks.value = new Set(initialPencilMarks);
  cellSpecificPencilMarks.value = [];
  minCageSize.value = 1;
  maxCageSize.value = 9;
  cageSumMin.value = 0;
  cageSumMax.value = 0;
}



const showAll = ref(false);


</script>

<template>
  <header>
    <div class="container">
      <div class="wrapper">
        <h1>Killer solver!</h1>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="flex">
      <div class="my-3">
        Cage size:
        <div class="btn-group" role="group" aria-label="Cage size">
          <button v-for="cageSize in 9" type="button" class="btn" :class="{
            'btn-outline-secondary': !((minCageSize === cageSize || maxCageSize === cageSize) || (minCageSize < cageSize && maxCageSize > cageSize)),
            'btn-primary': minCageSize === cageSize || maxCageSize === cageSize,
            'btn-outline-primary': minCageSize < cageSize && maxCageSize > cageSize,
            'bg-primary': minCageSize < cageSize && maxCageSize > cageSize,
            'text-body': minCageSize < cageSize && maxCageSize > cageSize,
          }" :style="{
              '--bs-bg-opacity': minCageSize < cageSize && maxCageSize > cageSize ? 0.1 : 1,
            }" @click="setSize(cageSize, !($event.ctrlKey || $event.shiftKey))">
            {{ cageSize }}
          </button>
          <button class="btn btn-outline-secondary" type="button" @click="minCageSize = 1; maxCageSize=9;">reset</button>
        </div>

        <div class="input-group my-3 flex-nowrap" style="max-width: 350px;">
          <input type="number" class="form-control" v-model="cageSumModelMin" :min="0" :max="45" style="width: 100px;"/>
          <span class="input-group-text">sum</span>
          <input type="number" class="form-control" v-model="cageSumModelMax" :min="0" :max="45" style="width: 100px;"/>
          <button class="btn btn-outline-secondary" type="button" @click="cageSumModelMax = cageSumModelMin = 0 ">reset</button>
        </div>

        <div class="my-3">
          Cage may contain:
          <div class="d-flex">
            <Cell v-model="globalPencilMarks" class="me-4" />
            <div class="btn-group align-self-center" role="group" aria-label="Cage may contain">
              <button v-for="n in 9" type="button" class="btn" :class="{
                'btn-outline-secondary': !globalPencilMarks.has(n),
                'btn-primary': globalPencilMarks.has(n),
              }" @click="globalPencilMarks.has(n) ? globalPencilMarks.delete(n) : globalPencilMarks.add(n)">
                {{ n }}
              </button>
              <button class="btn btn-outline-secondary" type="button" @click="globalPencilMarks = new Set(initialPencilMarks)">reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      Cell-specific pencil marks:
      <div @keydown="changeFocus" class="d-flex flex-row">
        <div class="btn-group-vertical me-3" style="height: 50px; overflow: hidden;">
          <button class="btn btn-sm btn-primary" style="line-height: 0;width: 100%;" type="button"
            @click="addCell">+</button>
          <button class="btn btn-sm btn-danger" style="line-height: 0;width: 100%;" type="button"
            @click="removeCell">-</button>
          </div>
          <button v-if ="cellSpecificPencilMarks.length" class="btn btn-lg text-center btn-outline-secondary me-2 align-self-center" @click="cellSpecificPencilMarks =[]" type="button">&times;</button>

        <Cell v-for="i in cellSpecificPencilMarks.length" v-model="cellSpecificPencilMarks[i - 1]" />
      </div>
    </div>

    <div class="d-flex align-items-baseline mt-3">
      <button type="reset" class="btn btn-danger me-2" @click="resetAll">reset</button>
      <div class="form-check me-2">
        <input class="form-check-input" type="checkbox" v-model="showAll" id="showAllCheckbox" />
        <label class="form-check-label" for="showAllCheckbox">Show all</label>
      </div>
    </div>

    <div v-for="[cageSize, values] in (showAll ? byCageSizeBySum : shownByCageSizeBySum)">
      <h3 class="text-danger border-bottom border-danger">{{ cageSize }}</h3>
      <div v-for="[sum, combinations] in values" class="d-flex">
        <h4 class="text-dark border-end border-dark pe-1 border-2 m-0 me-3 mb-1" style="width: 2em;">{{ sum }}</h4>
        <div v-for="combination in combinations" 
          class="btn btn-sm mx-1 align-self-center"
          :class="{
             'btn-outline-secondary': !validCombinations.has(combination),
             'btn-primary': validCombinations.has(combination),
          }"
        >
          {{ combination.numbers.join('') }}
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
html,
body {
  margin: 0;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  min-height: 100vh;
  min-width: 100%;
}

body {
  padding: 100px;
}

header {
  line-height: 1.5;
  border-bottom: 1px solid var(--c-white-mute)
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
