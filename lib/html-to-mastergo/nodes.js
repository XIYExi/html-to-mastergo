

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


export function getBoundingClientRect(element) {
    const computed = getComputedStyle(element);
    const display = computed.display;
    if (display.includes("inline") && element.children.length) {
        const elRect = element.getBoundingClientRect();
        const aggregateRect = getAggregateRectOfElements(Array.from(element.children));

        if (elRect.width > aggregateRect.width) {
            return {
                ...aggregateRect,
                width: elRect.width,
                left: elRect.left,
                right: elRect.right,
            };
        }
        return aggregateRect;
    }

    return element.getBoundingClientRect();
}


export function textNodesUnder(element) {
    let n = null;
    const a = [];
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
