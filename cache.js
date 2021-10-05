import {Rectangle, Blocks, Output} from "./main.js";

var timer = 1;
var memread = 0, memwrite = 0;
var l1cachehit = 0, l1cachemiss = 0;
var l2cachehit = 0, l2cachemiss = 0;
var l1bS = 0, l2bS = 0;
var l1L = 1, l2L = 1;
var SPEED = 3000;

var Block = /** @class */ (function () {
    function Block(valid_bits, tag_bits, address) {
        this.next = null;
        this.valid_bits = valid_bits;
        this.tag_bits = tag_bits;
        this.address = address;
        this.timer = timer;
    }
    return Block;
}());
var LinkedList = /** @class */ (function () {
    function LinkedList() {
        this.head = null;
    }
    // Called in the beginning to create necessary Caches.
    // Sets each linked-list to default values.
    LinkedList.prototype.insert = function (blocks) {
        var start = new Block(0, 0, 0);
        this.head = start;
        var current = this.head;
        for (var i = 1; i < blocks; i++) {
            current.next = new Block(0, 0, 0);
            current = current.next;
        }
    };
    return LinkedList;
}());
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function cacheCreator(sets, blocks) {
    var cache = Array(sets);
    for (var i = 0; i < sets; i++) {
        cache[i] = new LinkedList();
        cache[i].insert(blocks);
    }
    return cache;
}
function log(target) {
    var counter = 0;
    while (target != 1) {
        target = target >> 1;
        counter++;
    }
    return counter;
}
function redrawBlock(blockC, bS, length) {
    for(let i = bS; i < bS + length; i++)
        blockC[i].update();
}
async function checkl1(l1set, lru, l1tag, write, l1setC, l1blockC, output) { // done
    var openBlock = false;
    var current = l1set.head;
    var lowest = current.timer;
    l1setC.update("orange");
    redrawBlock(l1blockC, l1bS, l1L);
    await sleep(SPEED);
    var counter = l1bS;
    while (current) {
        l1blockC[counter].update("orange");
        await sleep(SPEED);
        if (current.tag_bits === l1tag) {
            l1setC.update("green");
            redrawBlock(l1blockC, l1bS, l1L);
            l1blockC[counter].update("green");
            l1cachehit++;
            output.l1cachehit++;
            if (lru) {
                current.timer = timer;
                timer++;
            }
            if (write === "W") {
                memwrite++;
                output.memwrite++;
            }
            output.draw()
            await sleep(SPEED);
            return 0; //hit 
        }
        l1blockC[counter].update("red");
        await sleep(SPEED);
        if (current.valid_bits === 0)
            openBlock = true;
        if (lowest > current.timer)
            lowest = current.timer;
        counter ++;
        current = current.next;
    }
    l1setC.update("red");
    redrawBlock(l1blockC, l1bS, l1L);
    l1cachemiss++;
    output.l1cachemiss++;
    output.draw();
    await sleep(SPEED);
    if (openBlock)
        return -1; // miss + open block in L1
    return lowest; // miss + evict from L1
}
async function checkl2(l2set, l2tag, write, l2setC, l2blockC, output) { // done
    var current = l2set.head;
    l2setC.update("orange");
    redrawBlock(l2blockC, l2bS, l2L);
    await sleep(SPEED);
    var counter = l2bS;
    while (current) {
        l2blockC[counter].update("orange");
        await sleep(SPEED);
        if (current.tag_bits === l2tag) { // cache hit in L2
            l2setC.update("green");
            redrawBlock(l2blockC, l2bS, l2L);
            l2blockC[counter].update("green");
            l2cachehit++;
            output.l2cachehit++;
            if (write === "W") {
                memwrite++;
                output.memwrite++;
            }
            output.draw();
            await sleep(SPEED);
            current.address = 0, current.tag_bits = 0, current.timer = 0, current.valid_bits = 0;
            return true;
        }
        l2blockC[counter].update("red");
        await sleep(SPEED);
        counter++;
        current = current.next;
    }
    l2setC.update("red");
    redrawBlock(l2blockC, l2bS, l2L);
    l2cachemiss++;
    memread++;
    output.l2cachemiss++;
    output.memread++;
    if (write === "W") {
        memwrite++;
        output.memwrite++;
    }
    output.draw();
    await sleep(SPEED);
    return false;
}
async function addToOpen(set, tag, address, l1setC, l1blockC) { // done
    var current = set.head;
    l1setC.update("blue");
    redrawBlock(l1blockC, l1bS, l1L);
    await sleep(SPEED);
    var counter = l1bS;
    while (current) {
        l1blockC[counter].update("blue");
        await sleep(SPEED);
        if (current.valid_bits === 0) {
            current.valid_bits = 1;
            current.tag_bits = tag;
            current.address = address;
            current.timer = timer;
            l1blockC[counter].timer = timer;
            l1blockC[counter].tag = tag;
            l1blockC[counter].valid = 1;
            l1setC.update("green");
            redrawBlock(l1blockC, l1bS, l1L);
            l1blockC[counter].update("green");
            await sleep(SPEED);
            timer++;
            return;
        }
        counter++;
        current = current.next;
    }
}
async function swapBlock(set, tag, address, lowest, setC, blockC, bS, len) {
    var current = set.head;
    setC.update("blue");
    redrawBlock(blockC, bS, len);
    await sleep(SPEED);
    var counter = bS;
    while (current) {
        blockC[counter].update("blue");
        await sleep(SPEED);
        if (current.timer === lowest) {
            var temp = current.address;
            current.valid_bits = 1;
            current.tag_bits = tag;
            current.address = address;
            current.timer = timer;
            timer++;
            blockC[counter].timer = timer;
            blockC[counter].tag = tag;
            blockC[counter].valid = 1;
            setC.update("green");
            redrawBlock(blockC, bS, len);
            blockC[counter].update("green");
            await sleep(SPEED);
            return temp;
        }
        counter++;
        current = current.next;
    }
    return 0;
}
function lowestTimer(set) {
    var current = set.head;
    var lowest = current.timer;
    while (current) {
        if (lowest > current.timer)
            lowest = current.timer;
        current = current.next;
    }
    return lowest;
}
export async function main(input, l1setC, l1blockC, l2setC, l2blockC, policy,
     speedNum, output) {
    SPEED = speedNum;
    var blocksize = 4;
    var l1blocks = l1blockC.length / l1setC.length;
    var l2blocks = l2blockC.length / l2setC.length;
    var l1sets = l1setC.length;
    var l2sets = l2setC.length;  
    var lru = policy; // false is fifo
    var l1cache = cacheCreator(l1sets, l1blocks);
    var l2cache = cacheCreator(l2sets, l2blocks);
    var l1setbits = log(l1sets);
    var l2setbits = log(l2sets);
    var blockbits = log(blocksize);
    for(let i = 0; i < input.length; i++) {
        let inp = input[i].split(" ");
        var rw = inp[0];
        var address = Number(inp[1]);
        var l1tag = address >> (l1setbits + blockbits);
        var l2tag = address >> (l2setbits + blockbits);
        var l1setnum = (address >> blockbits) & ((1 << l1setbits) - 1);
        var l2setnum = (address >> blockbits) & ((1 << l2setbits) - 1);
        l1bS = l1setnum;
        if(l1sets == 2) {
            l1bS = 2*l1setnum;
            l1L = 2;
        }
        if(l1sets == 1) {
            l1L = 4;
        }
        l2bS = l2setnum;
        if(l2sets == 2) {
            l2bS = 2*l2setnum;
            l2L = 2;
        }
        if(l2sets == 1) {
            l2L = 4;
        }
        await sleep(SPEED);
        var lowest = await checkl1(l1cache[l1setnum], lru, l1tag, rw, l1setC[l1setnum], l1blockC, output);
        if (lowest != 0) { // cache miss, check L2 now 
            var found = await checkl2(l2cache[l2setnum], l2tag, rw, l2setC[l2setnum], l2blockC, output);
            l1setC[l1setnum].update("black");
            redrawBlock(l1blockC, l1bS, l1L);
            l2setC[l2setnum].update("black");
            redrawBlock(l2blockC, l2bS, l2L);
            await sleep(SPEED);
            if ((found && lowest === -1) || lowest === -1) { // moving movement into open block
                await addToOpen(l1cache[l1setnum], l1tag, address, l1setC[l1setnum], l1blockC);
            }
            else { // moving tag into L1 then taking evicted block from L1 into L2 (swap)
                var tempAddress = await swapBlock(l1cache[l1setnum], l1tag, address, lowest, l1setC[l1setnum], l1blockC, 
                    l1bS, l1L);
                var tempTag = tempAddress >> (l2setbits + blockbits);
                var tempSet = (tempAddress >> blockbits) & ((1 << l2setbits) - 1);
                var tempLow = lowestTimer(l2cache[tempSet]);
                await swapBlock(l2cache[tempSet], tempTag, tempAddress, tempLow, l2setC[tempSet], l2blockC, 
                    l2bS, l2L);
            }
        }
        l1setC[l1setnum].update("black");
        redrawBlock(l1blockC, l1bS, l1L);
        l2setC[l2setnum].update("black");
        redrawBlock(l2blockC, l2bS, l2L);
        await sleep(SPEED);
    }
}
