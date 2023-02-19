/**
 * @param element 当前节点
 */
export const processSvgUseElements = (element) => {
    //处理使用use标签复制出来的svg https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
    for (const use of Array.from(element.querySelectorAll("use"))) {
        try {
            //查询出来的use为SVGUseElement
            const symbolSelector = use.href.baseVal;
            const symbol = document.querySelector(symbolSelector);
            //查询复制的节点是否为单标签（有没有children），没用就不操作，有就直接替换use
            if (symbol) {
                use.outerHTML = symbol.innerHTML;
            }
        } catch (err) {
            console.warn("Error querying <use> tag href", err);
        }
    }
};


/**
 * 获取当前svg的渲染参数
 * @param element
 * @returns {{ref, svg: *, x: number, width: number, y: number, type: string, height: number}}
 */
export const createSvgLayer = (element) => {
    //getBoundingClientRect() 返回的是矩形的集合，表示了当前盒子在浏览器中的位置以及自身占据的空间的大小，
    // 除了 width 和 height 以外的属性是相对于 视图窗口的左上角 来计算的
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
