import {createSvgLayer, processSvgUseElements} from "./svg";
import {getBoundingClientRect, isHidden, textNodesUnder, traverse} from "./nodes";
import {
    addStrokesFromBorder,
    getAppliedComputedStyles,
    getBorderRadi,
    getShadowEffects,
    getStrokesRectangle
} from "./styles";
import {size} from "./object";
import {getRgb} from "./parser";
import {getImagePaintWithUrl} from "./images";
import {buildTextNode} from "./text";
import {getLayersForFrames} from "./frames";


const generateElements = (el) => {
    const getShadowEls = (el) => Array.from(el.shadowRoot?.querySelectorAll("*") || []).reduce(
        (memo, el) => [...memo, el, ...getShadowEls(el)],
        []);

    const els = Array.from(el.querySelectorAll("*")).reduce(
        (memo, el) => [...memo, el, ...getShadowEls(el)],
        []);
    return els;
}


const getLayersForElement = (element) => {
    const elementLayers = [];

    //如果元素被隐藏就直接返回空数组
    if(isHidden(element))
        return [];

    //如果为svg，就直接转换后生成layers
    if(element instanceof SVGSVGElement){
        elementLayers.push(createSvgLayer(element));
        return elementLayers;
    }
    else if (element instanceof SVGElement)
        return [];

    /*
    <picture>
        <source/>
        <img/>
    </picture>
    只要img，picture和source全部剔除掉
     */
    if((element.parentElement instanceof HTMLPictureElement && element instanceof HTMLSourceElement)
        || element instanceof HTMLPictureElement
    )
        return [];

    const appliedStyles = getAppliedComputedStyles(element);
    const computedStyle = getComputedStyle(element);

    if((size(appliedStyles)
        || element instanceof HTMLImageElement
        || element instanceof HTMLVideoElement)
        && computedStyle.display !== 'none'
    ){
        const rect = getBoundingClientRect(element);

        // 只要当前div被展示
        if(rect.width >= 1 && rect.height >= 1){
            const fills = [];
            const color = getRgb(computedStyle.backgroundColor);

            if(color){
                const solidPaint = {
                    type:'SOLID',
                    color: {
                        r: color.r,
                        g: color.g,
                        b: color.b
                    },
                    opacity: color.a || 1
                };
                fills.push(solidPaint);
            }

            const rectNode = {
                type: 'RECTANGLE',
                ref: element,
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                fills,
            };

            const strokes = addStrokesFromBorder({computedStyle});
            if(strokes)
                Object.assign(rectNode, strokes);

            if(!rectNode.strokes){
                for (const dir of ["top", "left", "right", "bottom"]){
                    const strokesLayer = getStrokesRectangle({
                        dir,
                        rect,
                        computedStyle,
                        element,
                    });

                    if (strokesLayer) {
                        elementLayers.push(strokesLayer);
                    }
                }
            }

            const imagePaint = getImagePaintWithUrl({computedStyle, element});
            if(imagePaint){
                fills.push(imagePaint);
                rectNode.name = 'IMAGE';
            }

            const shadowEffects = getShadowEffects({computedStyle});
            if(shadowEffects){
                rectNode.effects = shadowEffects;
            }

            const borderRadi = getBorderRadi({computedStyle});
            Object.assign(rectNode, borderRadi);

            elementLayers.push(rectNode);
        }
    }
    return elementLayers;
};

function removeRefs({layers, root,}) {
    layers.concat([root]).forEach((layer) => {
        traverse(layer, (child) => {
            delete child.ref;
        });
    });
}


export function htmlToMastergo(selector, useFrames, time){
    if(time){
        console.log('Parse dom');
    }

    const layers = [];
    const element = selector instanceof HTMLElement
        ? selector
        : document.querySelector(selector || 'body');

    if(element){
        processSvgUseElements(element);
        const elements = generateElements(element);

        elements.forEach((element) => {
            const elementLayers = getLayersForElement(element);
            layers.push(...elementLayers);
        });

        const textNodes = textNodesUnder(element);
        for(const node of textNodes){
            const textNode = buildTextNode({node});
            if(textNode)
                layers.push(textNode);
        }
    }


    const root = {
        type: "FRAME",
        width: Math.round(window.innerWidth),
        height: Math.round(document.documentElement.scrollHeight),
        x: 0,
        y: 0,
        ref: document.body,
    };

    layers.unshift(root);

    const framesLayers = useFrames
        ? getLayersForFrames({ layers, root })
        : layers;

    removeRefs({ layers: framesLayers, root });

    if (time) {
        console.info("\n");
        console.timeEnd("Parse dom");
    }

    return framesLayers;
}

