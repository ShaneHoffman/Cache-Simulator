import {main} from "./cache.js";

const myForm = document.getElementById("myForm");
const canvas = document.getElementById("firstc");
const canvas2 = document.getElementById("secondc");


const height = window.innerHeight * .90;
const width = window.innerWidth * .75;
canvas.height = height;
canvas.width = width;
const height2 = window.innerHeight * .25;
const width2 = window.innerWidth * .20;
canvas2.height = height2;
canvas2.width = width2;

const c = canvas.getContext("2d");
const c2 = canvas2.getContext("2d");
myForm.querySelector(".button").disabled = true;

// Rectangle Class for each cache
export function Rectangle(x, y, width, height, lineWidth) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.lineWidth = lineWidth;
}

// Rectangle method for drawing and updating the cache 
Rectangle.prototype.update = function(color) {
    c.clearRect(this.x-2, this.y-2, this.width+4, this.height+4);
    c.lineWidth = this.lineWidth;
    c.strokeStyle = color;
    c.strokeRect(this.x, this.y, this.width, this.height);
    c.strokeStyle = "black";
    c.lineWidth = 1;
}

// Block class for the blocks within the cache
export function Blocks(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.valid = 0;
    this.tag = null;
    this.timer = 0;
    this.block1 = null;
    this.block2 = null;
    this.block3 = null;
    this.block4 = null;
}

// Block method for drawing and updating the blocks
Blocks.prototype.update = function(color) {
    // clear block and timer
    c.clearRect(this.x-2, this.y-2, this.width+4, this.height+4);
    c.clearRect(this.x+this.width/6 * 5, this.y-this.height/3, this.width/6, this.height/3);

    c.strokeStyle = color;
    c.lineWidth = 3;
    c.strokeRect(this.x, this.y, this.width, this.height);
    let tempX = this.x;
    c.font="15px Georgia";
    c.fillText(`Valid: ${this.valid}`, tempX + this.width/48, this.y + this.height/2);
    c.fillText(`Timer: ${this.timer}`, tempX + this.width/6 * 5, this.y - this.height/12);

    if(this.tag != null) {
        c.font="10px Georgia";
        c.fillText(`Tag: ${this.tag}`, tempX + this.width/6 + this.width/48, this.y + this.height/2);
        c.font="15px Georgia";
    }
    if(this.block1 != null)
        c.fillText(`${this.block1}`, tempX + this.width/6*2 + this.width/24, this.y + this.height/2);
    if(this.block2 != null)
        c.fillText(`${this.block2}`, tempX + this.width/6*3 + this.width/24, this.y + this.height/2);
    if(this.block3!= null)
        c.fillText(`${this.block3}`, tempX + this.width/6*4 + this.width/24, this.y + this.height/2);
    if(this.block4 != null)
        c.fillText(`${this.block4}`, tempX + this.width/6*5 + this.width/24, this.y + this.height/2);
    for(let i = 0; i < 5; i++) {
        tempX += this.width/6;
        c.strokeRect(tempX, this.y, 0, this.height);
    }

    c.strokeStyle = "black";
    c.lineWidth = 1;
}

// Class to store all of the outputs
export function Output(width, height) {
    this.memread = 0;
    this.memwrite = 0;
    this.l1cachehit = 0;
    this.l1cachemiss = 0;
    this.l2cachehit = 0;
    this.l2cachemiss = 0;
    this.width = width;
    this.height = height;
}

// Output method for writing all of the outputs
Output.prototype.draw = function() {
    c2.clearRect(0, 0, this.width, this.height)
    c2.font="25px Georgia";
    c2.fillText(`memread: ${this.memread}    memwrite: ${this.memwrite}`, 
        this.width/12, this.height/8);
    c2.fillText(`l1cachehit: ${this.l1cachehit}    l1cachemiss: ${this.l1cachemiss}`, 
        this.width/12, this.height/8*2);
    c2.fillText(`l2cachehit: ${this.l2cachehit}    l2cachemiss: ${this.l2cachemiss}`, 
        this.width/12, this.height/8*3);
}


let startX = 25;
let startY = 25;

let cacheWidth = (width/2)-50;
let cacheHeight = height-50;
let l1 = new Rectangle(startX, startY, cacheWidth, cacheHeight, 1);
let l2 = new Rectangle((width/2)+25, startY, cacheWidth, cacheHeight, 1);
l1.update();
l2.update();


myForm.querySelector(".button").onclick = function() {
    location = location;
}

// Listening for the submit button to start the cache simulator
myForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    switchButtons(true);

    const policy = document.getElementById("policy").value;
    let lru = true;
    if(policy == "FIFO")
        lru = false;

    const l1cachetype = document.getElementById("c-type").value;
    const l2cachetype = document.getElementById("c2-type").value;
    const input = document.getElementById("address").value;
    const speed = document.getElementById("speed").value;
    let speedNum = 3000/parseInt(speed);

    let output = new Output(width2, height2);
    output.draw();
    // Direct = 4 Sets, 1 Line Each Set, Block Size 4
    // Full A = 1 Set, 4 Lines Each Set, Block Size 4
    // N Assoc = 2 Sets, 2 Lines Each Set, Block Size 4

    startX += 25, startY += 25;
    let setWidth = cacheWidth - 50;

    // l1 sets array
    let l1sets = drawSets(l1cachetype, startX, startY, cacheHeight, setWidth, 10, 19, 25);

    startX = (width/2)+50;
    // l2 sets array
    let l2sets = drawSets(l2cachetype, startX, startY, cacheHeight, setWidth, 
        10, 25, 68 + cacheWidth);

    // create blocks
    let blockWidth = setWidth - 50;
    let l1blocks = drawBlocks(l1sets, l1cachetype, blockWidth);
    let l2blocks = drawBlocks(l2sets, l2cachetype, blockWidth);
    

    // input array
    let iArr = input.split("\n");
    await main(iArr, l1sets, l1blocks, l2sets, l2blocks, lru, speedNum, output);

    document.querySelector(".button").disabled = false;
});


function switchButtons(disable) {
    document.querySelector("#c-type").disabled = disable;
    document.querySelector("#c2-type").disabled = disable;
    document.querySelector("#policy").disabled = disable;
    document.querySelector("#speed").disabled = disable;
    document.querySelector("input").disabled = disable;
    
}

// Function to draw all of the sets in the cache depending on what type
// of cache the user selects
function drawSets(cacheType, x, y, cacheHeight, setWidth, textX, textY, trans) {
    let setNum = 0;
    switch (cacheType) {
        case "direct":
            setNum = 4;
            break;
    
        case "fullassoc":
            setNum = 1;
            break;
        
        case "nassoc":
            setNum = 2;
            break;
    }

    let setHeight = ((cacheHeight - 50) / setNum) - 10;
    let sets = [];

    for(let i = 0; i < setNum; i++) {
        sets.push(new Rectangle(x, y, setWidth, setHeight, 2));
        sets[i].update();

        c.save();
        c.translate(trans, i*25);
        c.rotate(-Math.PI/2);
        c.textAlign = "right";
        c.font="20px Georgia";

        switch(cacheType) {
          case "direct":
            c.fillText(`Set ${i+1}`, -1 * (textX + (setHeight/2)), textY);
            break;

          case "fullassoc":
            c.fillText(`Set ${i+1}`, -1 * (textX + (setHeight/2)), textY);
            break;
          
          case "nassoc":
            c.fillText(`Set ${i+1}`, -1 * (textX + (setHeight/2)), textY);
            break;

        }
        c.restore();
        y += setHeight + 15;
        textX += setHeight;
    }
    return sets;
}

// Function to draw blocks in each set depending on the type
// of cache the user selected
function drawBlocks(sets, cacheType, blockWidth) {
    let blockNum = 0;
    switch (cacheType) {
        case "direct":
            blockNum = 1;
            break;
    
        case "fullassoc":
            blockNum = 4;
            break;
        
        case "nassoc":
            blockNum = 2;
            break;
    }

    let blockHeight = (sets[0].height - ((blockNum+1)*75)) / blockNum;
    let blocks = [];
    for(let i = 0; i < sets.length; i++) {
        let blockX = sets[i].x + 25, blockY = sets[i].y + 75;
        for(let j = 0; j < blockNum; j++) {
            let temp = new Blocks(blockX, blockY, blockWidth, blockHeight);
            blocks.push(temp);
            temp.update();
            blockY += blockHeight + 75;
        }
    }
    return blocks;
}
