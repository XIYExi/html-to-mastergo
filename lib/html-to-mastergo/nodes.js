

export function isHidden(element){
    let el = element;
    do{
        //计算节点样式
        const computed = getComputedStyle(el);

        // 判断节点是否为空
        // 传统方式，display:none || visibility: hidden
        if(computed.display === 'none' || computed.visibility === 'hidden')
            return true;

        // 通过使用overflow:hidden 或者 height:0 来隐藏元素
        if(computed.overflow !== 'visible' && el.getBoundingClientRect().height < 1)
            return true;
    }while((el = el.parentElement))//通过双括号判断，如果el.parentElement存在就会为true然后执行循环
    return false;
}

/**
 * 得到当前方向上最大的元素
 * @param direction
 * @param elements
 * @returns {*}
 */
function getDirectionMostOfElements(direction, elements){
    if(elements.length === 1)
        return elements[0];

    return elements.reduce((memo, value) => {
        if(!memo)
            return value;

        const valueDirection = getBoundingClientRect(value)[direction];
        const memoDirection = getBoundingClientRect(memo)[direction];

        if(direction === 'left' || direction === 'top') {
            if (valueDirection < memoDirection)
                return value;
        }
        else{
            if(valueDirection > memoDirection)
                return value;
        }
        return memo;
    }, null);
}

/**
 * 通过getBoundingClientRect得到四个方向上最大的值，最后计算得出长宽，得到绝对布局（相对来说最大的）
 * @param elements
 * @returns {{top: *, left: *, bottom: *, width: number, right: *, height: number}|null}
 */
function getAggregateRectOfElements(elements){
    if(!elements.length)
        return null;

    const {top} = getBoundingClientRect(
        getDirectionMostOfElements('top', elements)
    );
    const { left } = getBoundingClientRect(
        getDirectionMostOfElements("left", elements)
    );
    const { bottom } = getBoundingClientRect(
        getDirectionMostOfElements("bottom", elements)
    );
    const { right } = getBoundingClientRect(
        getDirectionMostOfElements("right", elements)
    );
    const width = right - left;
    const height = bottom - top;
    return {
        top,
        left,
        bottom,
        right,
        width,
        height,
    };
}


/**
 * 返回当前节点可能占的最大空间
 * @param element
 * @returns {{top: *, left: number, bottom: *, width: number, right: number, height: number}|{top: *, left: *, bottom: *, width: number, right: *, height: number}|DOMRect}
 */
export function getBoundingClientRect(element) {
    //得到计算后的样式
    const computed = getComputedStyle(element);
    const display = computed.display;
    //处理行内元素
    if (display.includes("inline") && element.children.length) {
        //当前
        const elRect = element.getBoundingClientRect();
        //计算绝对定位
        const aggregateRect = getAggregateRectOfElements(Array.from(element.children));

        //inline可能发生的宽度问题，导致超出了父空气，如span中文字超出浏览器
        if (elRect.width > aggregateRect.width) {
            return {
                ...aggregateRect,
                width: elRect.width,
                left: elRect.left,
                right: elRect.right,
            };
        }
        //反则就用，说明当前元素未能用满空间，但是还是要返回空间大的数据。
        return aggregateRect;
    }
    // 反则说明元素使用的是block或者其余布局，则直接返回数据
    return element.getBoundingClientRect();
}


export function textNodesUnder(element) {
    let n = null;
    const a = [];
    //获得dom结构
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    while ((n = walk.nextNode())) {
        a.push(n);
    }
    return a;
}


export const hasChildren = (node) =>
    node && Array.isArray(node.children);

export function traverse(layer, cb, parent) {
    if (layer) {
        cb(layer, parent);
        if (hasChildren(layer)) {
            layer.children.forEach((child) => traverse(child, cb, layer));
        }
    }
}


export function getParents(node) {
    let el = node instanceof Node && node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : node;

    const parents = [];
    while (el && (el = el.parentElement)) {
        parents.push(el);
    }
    return parents;
}

export function getDepth(node) {
    return getParents(node).length;
}
