function computePermutationsForNumberOfCells(n: number, seenCombinations: Set<string> = new Set()): number[][] {
    const result: number[][] = [];
    if (n === 1) return [1,2,3,4,5,6,7,8,9].map(x => [x]);
    const smaller = computePermutationsForNumberOfCells(n - 1, seenCombinations);
    for (const s of smaller) {
        const numberInSet = new Set<number>(s);
        const candidates = [1,2,3,4,5,6,7,8,9].filter(x => !numberInSet.has(x));
        for (const c of candidates) {
            const value = [c, ...s].sort();
            const key = value.join(',');
            if (seenCombinations.has(key)) continue;
            seenCombinations.add(key);
            result.push(value);
        }
    }
    return result;
}

export const allCombinations: Array<{
    numbers: number[],
    sum: number,
    cageSize: number,
}> = [];


for (let i = 1; i <= 9; i++) {
    const c = computePermutationsForNumberOfCells(i);
    allCombinations.push(...c.map(numbers => {
        const sum = numbers.reduce((a, b) => a + b, 0);
        return { numbers, sum, cageSize: i };
    }));
}

function checkCells(remainingNumbers: Set<number>, cellindex: number, cellsMustContain: Array<Set<number>>, check: (remaining: Set<number>) => boolean): boolean {
    if (cellindex >= cellsMustContain.length) return check(remainingNumbers);

    const cellToCheck = cellsMustContain[cellindex];
    if (cellToCheck.size === 0) // skip 
        return checkCells(remainingNumbers, cellindex + 1, cellsMustContain, check);

    
    for (const x of cellToCheck) {
        if (remainingNumbers.has(x)) {
            const newRemaining = new Set(remainingNumbers);
            newRemaining.delete(x);
            if (checkCells(newRemaining, cellindex + 1, cellsMustContain, check)) return true;
        }
    }
    return false;
}


export default function compute(p: {
    sum: number,
    minNumbeOfCages?: number,
    maxNumberOfCages?: number,
    cellsMayOnlyContain: Set<number>,
    cellsMustContain: Array<Set<number>>,
}) {
    const { cellsMayOnlyContain, sum, maxNumberOfCages, minNumbeOfCages, cellsMustContain } = p;
    return new Set(allCombinations.filter(c => {
        return (minNumbeOfCages == null || c.cageSize >= minNumbeOfCages) && 
            (maxNumberOfCages == null || c.cageSize <= maxNumberOfCages) && 
            (sum === 0 || sum == c.sum) &&
            
            checkCells(new Set(c.numbers), 0, cellsMustContain, (remaining: Set<number>) => {
                if (cellsMayOnlyContain.size > 0) return [...remaining].every(n => cellsMayOnlyContain.has(n));
                return true;
            });
    }));
}