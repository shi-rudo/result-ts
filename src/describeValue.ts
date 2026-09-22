// `Object.prototype.toString` reads `Symbol.toStringTag`, which can be a
// getter that throws, so even the fallback needs its own guard.
const describeUnprintable = (value: unknown): string => {
    try {
        return Object.prototype.toString.call(value);
    } catch {
        return `[unprintable ${typeof value}]`;
    }
};

/**
 * Formats a foreign value for an error message.
 *
 * `String(value)` runs the `toString`, `valueOf` or `Symbol.toPrimitive` of
 * that value. An object with a null prototype has none of them, and a hostile
 * one throws. Without this guard the conversion failure replaces the coded
 * library error, and a caller that matches on the code never sees it.
 */
export function describeValue(value: unknown): string {
    try {
        return String(value);
    } catch {
        return describeUnprintable(value);
    }
}
