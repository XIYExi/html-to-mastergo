import {isHidden} from "./nodes";
import {fastClone} from "./object";
import {getRgb, parseUnits} from "./parser";

export const buildTextNode = ({node}) => {
    const trimmedText = node.textContent.trim() || "";
    if(!trimmedText.length)
        return undefined;

    const parent = node.parentElement;
    if(parent) {
        if (isHidden(parent))
            return undefined;

        const computedStyles = getComputedStyle(parent);
        const range = document.createRange();
        range.selectNode(node);
        const rect = fastClone(range.getBoundingClientRect());
        const lineHeight = parseUnits(computedStyles.lineHeight);
        range.detach();

        if (lineHeight && rect.height < lineHeight.value) {
            const delta = lineHeight.value - rect.height;
            rect.top -= delta / 2;
            rect.height = lineHeight.value;
        }

        if (rect.height < 1 || rect.width < 1) {
            return undefined;
        }

        const textNode = {
            x: Math.round(rect.left),
            ref: node,
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            type: "TEXT",
            characters: trimmedText.replace(/\s+/g, " "),
        };

        const fills = [];
        const rgb = getRgb(computedStyles.color);

        if (rgb) {
            fills.push({
                type: "SOLID",
                color: {
                    r: rgb.r,
                    g: rgb.g,
                    b: rgb.b,
                },
                opacity: rgb.a || 1,
            });
        }

        if (fills.length) {
            textNode.fills = fills;
        }
        const letterSpacing = parseUnits(computedStyles.letterSpacing);
        if (letterSpacing) {
            textNode.letterSpacing = letterSpacing;
        }
        if (lineHeight) {
            textNode.lineHeight = lineHeight;
        }

        const {textTransform} = computedStyles;
        switch (textTransform) {
            case "uppercase": {
                textNode.textCase = "UPPER";
                break;
            }
            case "lowercase": {
                textNode.textCase = "LOWER";
                break;
            }
            case "capitalize": {
                textNode.textCase = "TITLE";
                break;
            }
            default:
                break;
        }

        const fontSize = parseUnits(computedStyles.fontSize);
        if (fontSize) {
            textNode.fontSize = Math.round(fontSize.value);
        }
        if (computedStyles.fontFamily) {
            // const font = computedStyles.fontFamily.split(/\s*,\s*/);
            textNode.fontFamily = computedStyles.fontFamily;
        }

        if (
            ["underline", "strikethrough"].includes(computedStyles.textDecoration)
        ) {
            textNode.textDecoration =
                computedStyles.textDecoration.toUpperCase();
        }

        if (
            ["left", "center", "right", "justified"].includes(
                computedStyles.textAlign
            )
        ) {
            textNode.textAlignHorizontal =
                computedStyles.textAlign.toUpperCase();
        }

        return textNode;
    }
};