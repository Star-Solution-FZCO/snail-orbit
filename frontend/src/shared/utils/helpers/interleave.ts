export const interleave = <T, H>(arr: T[], x: H) =>
    arr.flatMap((e) => [e, x]).slice(0, -1);
