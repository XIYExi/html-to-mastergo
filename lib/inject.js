import {htmlToMastergo} from "./html-to-mastergo";


const handleButton = () => {
    const layers = htmlToMastergo('body', true);
    let json = JSON.stringify({ layers });
    console.log(json);
}
