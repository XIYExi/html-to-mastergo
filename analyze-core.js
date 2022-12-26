const fs = require('fs');
const xpath = require('xpath');
const util = require('util');
const dom = require('xmldom').DOMParser;
const FileSaver = require('file-saver');
const Blob = require('blob');
const path = require("path");

let content = fs.readFileSync("assets/index.html", {encoding: 'UTF-8'});
let doc = new dom().parseFromString(content);

// 数据结构，每一个节点解析后的最小单元（结构）
function DomNode(
    coreId, tagName, id='', className,
    CssPrototype={}, attr={}, children=[], lever){
    this.coreId = coreId; // 唯一标识
    this.tagName = tagName;
    this.id = id;
    this.className = className; // class
    this.CssPrototype = CssPrototype; // style
    this.attr = attr; // other attribute
    this.children = children; // 所有子标签
    this.lever = lever; //当前层级
}

// 根节点
let root = xpath.select("//div[@class='reveal']", doc);

/**
 * @type {number} coreId 每个组件的唯一标识，每次进入到新的标签就自增
 */
let coreId = 0;

/**
 * @type {number} lever 使用dfs的思想回溯dom树，lever用于记录当前层
 */
let lever = 0;
/**
 * 用于解析当前节点的属性
 * @param root
 */
const analyzeItemAttr = (item) => {
    coreId++;

    // 标签名
    let tagName = item['tagName'];
    let className, id, cssPrototype, otherAttr = {};


    const attrNum = item['attributes'].length;
    for (let i = 0; i < attrNum; ++i) {
        const curItem = item['attributes'][`${i}`];
        //nodeName和name保持一直，均为属性的名字
        switch (curItem.name) {
            case 'class':
                className = curItem.value;
                break;
            case 'id':
                id = curItem.value;
                break;
            case 'style':
                cssPrototype = curItem.value;
                break;
            default:
                otherAttr[`${curItem.nodeName}`] = curItem.value;
                break;
        }
    }
    let Node = new DomNode(
        coreId,
        tagName,
        id,
        className,
        cssPrototype,
        otherAttr,
        [],
        lever);
    return Node;
}



//nodeType === 1为 HTMLdom节点 nodeType===3为Text节点，直接舍去
//不可以使用filter，因为整合出了是json数据，不是数组！
// item - root[0]

/**
 * 使用回溯法，循环解析
 * @param root 需要解析的根节点
 * @param father 保存数组
 */
const analyzeDomToNode = (item, father) => {
    const rootLength = root.length;

        lever++;
        let domNode = analyzeItemAttr(item);
        father.children.push(domNode);
        // 得到item所有合规的子标签
        for(let i = 0; i < item['childNodes'].length; ++i){
            if(item['childNodes'][i].nodeType!==1)
                continue;
            analyzeDomToNode(item['childNodes'][i], domNode);
        }
        lever--;
}

let headNode = new DomNode(0, 'html', 'html', '', '', {}, [], 0);
analyzeDomToNode(root[0], headNode);
console.log(headNode)

let jsonContent = JSON.stringify(headNode);
let file = path.join(__dirname, 'assets/test.json');
fs.writeFile(file, jsonContent, function(err) {
    if (err) {
        return console.log(err);
    }
    console.log('文件创建成功，地址：' + file);
});
