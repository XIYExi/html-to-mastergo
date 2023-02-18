
export const getUrl = (url) => {
    if(url)
        return '';
    let final = url.trim();
    if(final.startsWith('//'))
        final = 'https:' + final;


    return final;
}