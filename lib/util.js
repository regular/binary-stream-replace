
function indexOf(chunk, b, start) {
    var found = false;
    var r = start || 0;
    var cl = chunk.length - r;
    while(cl-- && !(found = (chunk[r] === b))) r++;
    return found ? r : -1;
}

// The result can be one of the following:
// 1. -1 -> needle[pin] (needle head) wasn't found.
// 2. 0: the entire needle was found at chunk offset: pic
// 3. >0: the head of the needle was found at chunk offset: pic, 
// returns number of  bytes of needle yet to be found.

function compare(needle, chunk, pin, pic) {
    var nl = needle.length - pin;
    var cl = chunk.length - pic;
    if (cl<=0 || nl<=0) {
        // there's nothing left of chunk or needle
        throw new Error('nothing to compare');
    }
    var found = true;
    while(found) {
        if (cl===0 || nl===0 || !(found = (chunk[pic] === needle[pin]))) break;
        cl--;
        nl--;
        pic++;
        pin++;
    }
    if (!found) return -1;
    // this looks promising.
    // did we find the complete needle?
    if (nl === 0) {
        return 0;
    } else if (cl === 0) {
        // the chunk ends before the needle ends
        // the chunk should be bufferd
        return nl;
    } else {
        throw new Error('this cannot happen');
    }
}

module.exports.indexOf = indexOf;
module.exports.compare = compare;
