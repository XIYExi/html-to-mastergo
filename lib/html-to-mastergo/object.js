export function size(obj) {
    return Object.keys(obj).length;
}


export const fastClone = (data) =>
    typeof data === "symbol" ? null : JSON.parse(JSON.stringify(data));
