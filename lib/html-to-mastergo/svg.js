
export const processSvgUseElements = (element) => {
    for (const use of Array.from(element.querySelectorAll("use"))) {
        try {
            const symbolSelector = use.href.baseVal;
            const symbol = document.querySelector(symbolSelector);
            if (symbol) {
                use.outerHTML = symbol.innerHTML;
            }
        } catch (err) {
            console.warn("Error querying <use> tag href", err);
        }
    }
};

export const createSvgLayer = (element) => {
    const rect = element.getBoundingClientRect();
    const layer = {
        type: "SVG",
        ref: element,
        svg: element.outerHTML,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
    };
    return layer;
}