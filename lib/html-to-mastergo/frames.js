import {getBoundingClientRect, getDepth, getParents, hasChildren, traverse} from "./nodes";
import {addConstraints} from "./styles";

const makeTree = ({root, layers}) => {
    const refMap = new WeakMap();
    layers.forEach((layer) => {
        if (layer.ref) {
            refMap.set(layer.ref, layer);
        }
    });

    let updated = true;
    let iterations = 0;
    while(updated){
        updated = false;
        if(iterations++ > 10000) {
            console.error("Too many tree iterations 1");
            break;
        }

        traverse(root,(layer, originalParent) => {
            const node = layer.ref;
            let parentElement= (node && node.parentElement) || null;
            do{
                if (parentElement === document.body) {
                    break;
                }
                if (parentElement && parentElement !== document.body) {
                    const parentLayer = refMap.get(parentElement);
                    if (parentLayer === originalParent) {
                        break;
                    }
                    if (parentLayer && parentLayer !== root) {
                        if (hasChildren(parentLayer)) {
                            if (originalParent) {
                                const index = originalParent.children.indexOf(layer);
                                originalParent.children.splice(index, 1);
                                parentLayer.children.push(layer);
                                updated = true;
                                return;
                            }
                        }
                        else {
                            let parentRef = parentLayer.ref;
                            if (
                                parentRef &&
                                parentRef instanceof Node &&
                                parentRef.nodeType === Node.TEXT_NODE
                            ) {
                                parentRef = parentRef.parentElement;
                            }
                            const overflowHidden =
                                parentRef instanceof Element &&
                                getComputedStyle(parentRef).overflow !== "visible";
                            const newParent = {
                                type: "FRAME",
                                clipsContent: !!overflowHidden,
                                // type: 'GROUP',
                                x: parentLayer.x,
                                y: parentLayer.y,
                                width: parentLayer.width,
                                height: parentLayer.height,
                                ref: parentLayer.ref,
                                backgrounds: [],
                                children: [parentLayer, layer],
                            };
                        }
                    }
                }
            }while (parentElement && (parentElement = parentElement.parentElement));
        });
    }

    let secondUpdate = true;
    let secondIterations = 0;
    while(secondUpdate){
        if (secondIterations++ > 10000) {
            console.error("Too many tree iterations 2");
            break;
        }
        secondUpdate = false;

        traverse(root, (layer, parent) => {
            if (secondUpdate) {
                return;
            }
            if (layer.type === "FRAME") {
                // Final all child elements with layers, and add groups around  any with a shared parent not shared by another
                const ref = layer.ref;
                if (layer.children && layer.children.length > 2) {
                    const childRefs =
                        layer.children &&
                        layer.children.map((child) => child.ref);

                    let lowestCommonDenominator = layer.ref;
                    let lowestCommonDenominatorDepth = getDepth(lowestCommonDenominator);

                    // Find lowest common demoninator with greatest depth
                    for (const childRef of childRefs) {
                        const otherChildRefs = childRefs.filter(
                            (item) => item !== childRef
                        );
                        const childParents = getParents(childRef);
                        for (const otherChildRef of otherChildRefs) {
                            const otherParents = getParents(otherChildRef);
                            for (const parent of otherParents) {
                                if (
                                    childParents.includes(parent) &&
                                    layer.ref.contains(parent)
                            ) {
                                    const depth = getDepth(parent);
                                    if (depth > lowestCommonDenominatorDepth) {
                                        lowestCommonDenominator = parent;
                                        lowestCommonDenominatorDepth = depth;
                                    }
                                }
                            }
                        }
                    }
                    if (
                        lowestCommonDenominator &&
                        lowestCommonDenominator !== layer.ref
                    ) {
                        // Make a group around all children elements
                        const newChildren = layer.children.filter((item) =>
                            lowestCommonDenominator.contains(item.ref)
                        );

                        if (newChildren.length !== layer.children.length) {
                            const lcdRect = getBoundingClientRect(lowestCommonDenominator);

                            const overflowHidden =
                                lowestCommonDenominator instanceof Element &&
                                getComputedStyle(lowestCommonDenominator).overflow !==
                                "visible";

                            const newParent = {
                                type: "FRAME",
                                clipsContent: !!overflowHidden,
                                ref: lowestCommonDenominator,
                                x: lcdRect.left,
                                y: lcdRect.top,
                                width: lcdRect.width,
                                height: lcdRect.height,
                                backgrounds: [],
                                children: newChildren,
                            };
                            refMap.set(lowestCommonDenominator, ref);
                            let firstIndex = layer.children.length - 1;
                            for (const child of newChildren) {
                                const childIndex = layer.children.indexOf(child);
                                if (childIndex > -1 && childIndex < firstIndex) {
                                    firstIndex = childIndex;
                                }
                            }
                            layer.children.splice(firstIndex, 0, newParent);
                            for (const child of newChildren) {
                                const index = layer.children.indexOf(child);
                                if (index > -1) {
                                    layer.children.splice(index, 1);
                                }
                            }
                            secondUpdate = true;
                        }
                    }
                }
            }
        });
    }

    // Update all positions
    traverse(root, (layer) => {
        if (layer.type === "FRAME" || layer.type === "GROUP") {
            const { x, y } = layer;
            if (x || y) {
                traverse(layer, (child) => {
                    if (child === layer) {
                        return;
                    }
                    child.x = child.x - x;
                    child.y = child.y - y;
                });
            }
        }
    });
}


export const getLayersForFrames = ({root, layers}) => {
    root.children = layers.slice(1);
    makeTree({root, layers});
    const framesLayers = [root];
    addConstraints(framesLayers);

    return framesLayers;
}