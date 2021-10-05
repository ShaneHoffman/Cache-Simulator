const lineReader = require('line-reader');

let timer = 1;
let memread = 0, memwrite = 0;
let l1cachehit = 0, l1cachemiss = 0;
let l2cachehit = 0, l2cachemiss = 0;


class Block {
    valid_bits: number;
    tag_bits: number;
    address: number; 
    timer: number;
    next: Block | null = null; 

    constructor(valid_bits: number, tag_bits: number, address: number) {
        this.valid_bits = valid_bits;
        this.tag_bits = tag_bits; 
        this.address = address;
        this.timer = timer;
    }
}


class LinkedList {
    head: Block | null = null;

    // Called in the beginning to create necessary Caches.
    // Sets each linked-list to default values.
    public insert(blocks: number) {  
        let start = new Block(0, 0, 0);   
        this.head = start;

        let current = this.head;
        for(let i = 1; i < blocks; i++) {
            current.next = new Block(0, 0, 0);
            current = current.next;
        }
    }
}


function cacheCreator(sets: number, blocks: number): LinkedList[] {
    let cache = Array<LinkedList>(sets);
    for(let i = 0; i < sets; i++) {
        cache[i] = new LinkedList();
        cache[i].insert(blocks);
    }
    return cache;
}


function log(target: number): number {
    let counter = 0;
    while(target != 1) {
        target = target >> 1;
        counter++;
    }
    return counter;
}


function checkl1(l1set: LinkedList, lru: boolean, l1tag: number, write: string): number {
    let openBlock = false; 
    let current = l1set.head; 
    let lowest = current.timer;
    while(current) { 
        if(current.tag_bits === l1tag) {
            l1cachehit++; 
            if(lru) {
                current.timer = timer;
                timer++;
            }
            if(write === "W")
                memwrite++;
            return 0; //hit 
        }
        if(current.valid_bits === 0) 
            openBlock = true;
        if(lowest > current.timer)
            lowest = current.timer;
        current = current.next;         
    }

    l1cachemiss++;
    if(openBlock)
        return -1;  // miss + open block in L1
    return lowest;  // miss + evict from L1
}


function checkl2(l2set: LinkedList, l2tag: number, write: string): boolean {
    let current = l2set.head;
    while(current) {
        if(current.tag_bits === l2tag) {    // cache hit in L2
            l2cachehit++;
            if(write === "W")
                memwrite++;

            current.address = 0, current.tag_bits = 0, current.timer = 0, current.valid_bits = 0;
            return true;
        }
        current = current.next;
    }

    l2cachemiss++;
    memread++;
    if(write === "W")
        memwrite++;
    return false
}


function addToOpen(set: LinkedList, tag: number, address: number) {
    let current = set.head;
    while(current){
        if(current.valid_bits === 0){
            current.valid_bits = 1;
            current.tag_bits = tag;
            current.address = address;
            current.timer = timer;
            timer++;
            return;
        }
        current = current.next;
    }
}

function swapBlock(set: LinkedList, tag: number, address: number, lowest: number): number {
    let current = set.head;
    while(current){
        if(current.timer === lowest){
            let temp = current.address;
            current.valid_bits = 1;
            current.tag_bits = tag;
            current.address = address;
            current.timer = timer;
            timer++;
            return temp;
        }
        current = current.next;
    }
    return 0;
}

function lowestTimer(set: LinkedList): number {
    let current = set.head;
    let lowest = current.timer;
    while(current) { 
        if(lowest > current.timer)
            lowest = current.timer;
        current = current.next;         
    }
    return lowest;
}


function main(){    // driver function
    const l1cachesize = 16;
    const l2cachesize = 32;
    const blocksize = 4;
    const blocks = 2;
    const l1sets = 2;
    const l2sets = 4;  
    const lru = true;  // false is fifo
 
    let l1cache = cacheCreator(l1sets, blocks);
    let l2cache = cacheCreator(l2sets, blocks);

    const l1setbits = log(l1sets);
    const l2setbits = log(l2sets);
    const blockbits = log(blocksize);
    
    lineReader.eachLine('input.txt', function(line) {   // reads the file input.txt line by line
        let input = line.split(" ")
        let rw = input[0];
        let address = Number(input[1]);
        
        let l1tag = address >> (l1setbits+blockbits);
        let l2tag = address >> (l2setbits+blockbits);
        let l1setnum = (address >> blockbits) & ((1 << l1setbits) - 1);
        let l2setnum = (address >> blockbits) & ((1 << l2setbits) - 1);

        let lowest = checkl1(l1cache[l1setnum], lru, l1tag, rw);

        if(lowest != 0) {    // cache miss, check L2 now 
            var found = checkl2(l2cache[l2setnum], l2tag, rw);

            if((found && lowest === -1) || lowest === -1) {    // moving movement into open block
                addToOpen(l1cache[l1setnum], l1tag, address);
            }
            else {    // moving tag into L1 then taking evicted block from L1 into L2 (swap)
                var tempAddress = swapBlock(l1cache[l1setnum], l1tag, address, lowest);
                var tempTag = tempAddress >> (l2setbits+blockbits);
                var tempSet = (tempAddress >> blockbits) & ((1 << l2setbits) - 1);
                var tempLow = lowestTimer(l2cache[tempSet]);
                swapBlock(l2cache[tempSet], tempTag, tempAddress, tempLow);
            }
        }
        console.log("memread:%d\nmemwrite:%d", memread, memwrite);
        console.log("l1cachehit:%d\nl1cachemiss:%d", l1cachehit, l1cachemiss);
        console.log("l2cachehit:%d\nl2cachemiss:%d\n\n\n", l2cachehit, l2cachemiss);
    });

}


main();