// eslint-disable-next-line
export function deepEqual(a: any, b: any, skipMissedKeys = false) {
    // If values are strictly equal, return true (handles primitives and same object references)
    if (a === b) {
        return true;
    }

    // If either value is null or not an object, and they are not strictly equal, they are not deep equal
    if (
        a == null ||
        typeof a !== "object" ||
        b == null ||
        typeof b !== "object"
    ) {
        return false;
    }

    // Handle Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }

    // Handle Objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length && !skipMissedKeys) {
        return false;
    }

    for (const key of keysA) {
        if (
            (!keysB.includes(key) && !skipMissedKeys) ||
            !deepEqual(a[key], b[key])
        ) {
            return false;
        }
    }

    return true;
}
