export function getRgb(colorString){
    
    if(!colorString)
        return null;

    const [_1, r, g, b, _2, a] = (colorString.match(
        /rgba?\(([\d\.]+), ([\d\.]+), ([\d\.]+)(, ([\d\.]+))?\)/
    ) || []);

    const none = a && parseFloat(a) === 0;

    if (r && g && b && !none) {
        return {
            r: parseInt(r) / 255,
            g: parseInt(g) / 255,
            b: parseInt(b) / 255,
            a: a ? parseFloat(a) : 1,
        };
    }
    return null;
}

const toNum = (v) => {
    // if (!/px$/.test(v) && v !== '0') return v;
    if (!/px$/.test(v) && v !== "0") return 0;
    const n = parseFloat(v);
    // return !isNaN(n) ? n : v;
    return !isNaN(n) ? n : 0;
};

const LENGTH_REG = /^[0-9]+[a-zA-Z%]+?$/;
const isLength = (v) => v === "0" || LENGTH_REG.test(v);
export const parseBoxShadowStr = (str) => {
    // TODO: this is broken for multiple box shadows
    if (str.startsWith("rgb")) {
        // Werid computed style thing that puts the color in the front not back
        const colorMatch = str.match(/(rgba?\(.+?\))(.+)/);
        if (colorMatch) {
            str = (colorMatch[2] + " " + colorMatch[1]).trim();
        }
    }

    const PARTS_REG = /\s(?![^(]*\))/;
    const parts = str.split(PARTS_REG);
    const inset = parts.includes("inset");
    const last = parts.slice(-1)[0];
    const color = !isLength(last) ? last : "rgba(0, 0, 0, 1)";

    const nums = parts
        .filter((n) => n !== "inset")
        .filter((n) => n !== color)
        .map(toNum);

    const [offsetX, offsetY, blurRadius, spreadRadius] = nums;

    return {
        inset,
        offsetX,
        offsetY,
        blurRadius,
        spreadRadius,
        color,
    };
};

export const parseUnits = (str) => {
    if (!str) {
        return null;
    }
    const match = str.match(/([\d\.]+)px/);
    const val = match?.[1];
    if (val) {
        return {
            unit: "PIXELS",
            value: parseFloat(val),
        };
    }
    return null;
};