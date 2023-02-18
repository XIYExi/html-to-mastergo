export const getImagePaintWithUrl = ({computedStyle, element}) => {
    if(element instanceof SVGSVGElement){
        const url = `data:image/svg+xml,${encodeURIComponent(
            element.outerHTML.replace(/\s+/g, " ")
        )}`;
        return {
            url,
            type: "IMAGE",
            // TODO: object fit, position
            scaleMode: "FILL",
            imageHash: null,
        };
    }
    else{
        const baseImagePaint = {
            type: "IMAGE",
            // TODO: object fit, position
            scaleMode: computedStyle.objectFit === "contain" ? "FIT" : "FILL",
            imageHash: null,
        };

        if(element instanceof HTMLImageElement){
            const url = element.currentSrc;
            if (url) {
                return {
                    url,
                    ...baseImagePaint,
                };
            }
            else if(element instanceof HTMLVideoElement){
                const url = element.poster;
                if(url){
                    return {
                        url,
                        ...baseImagePaint
                    };
                }
            }
        }
    }

    if(computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none'){
        const urlMatch = computedStyle.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
        const url = urlMatch?.[1];
        if(url)
            return {
                url,
                type: "IMAGE",
                // TODO: background size, position
                scaleMode: computedStyle.backgroundSize === "contain" ? "FIT" : "FILL",
                imageHash: null,
            };
    }
    return undefined;
};