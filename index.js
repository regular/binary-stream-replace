var through = require('through');
var util = require('./lib/util');
var indexOf = util.indexOf;
var compare = util.compare;

module.exports = function(needle, replace) {

    var pin = 0; // pos in needle
    var occurances = 0;
    var startPos = -1; // potential start of needle in bufferList
    var bufferList = [];

    function bufferChunk(chunk) {
        bufferList.push(chunk);
    }
    function flushBuffer(stream, len) {
        var queued = 0;
        for(var i=0; i<bufferList.length; ++i) {
            var bl = bufferList[i].length;
            if (queued >= len) break;
            if (queued + bl <= len) {
                queued += bl;
                stream.queue(bufferList[i]);
            } else {
                var missing = len - queued;
                stream.queue(bufferList[i].slice(0, missing));
                break;
            }
        }
        bufferList = [];
    }
    
    function queueReplacement(stream) {
        stream.queue(replace);
    }

    function write(chunk) {
        pic = 0;
        for(;;) {
            console.log('pin',pin,'pic',pic);
            if (pin === 0) {
                // does this chunk contain
                // the first needle byte?
                startPos = indexOf(chunk, needle[0], pic);
                console.log('found at',startPos);
                if (startPos === -1) {
                    // ne. Fastpath: just forward the cunk
                    var c = chunk.slice(pic);
                    if (c.length) this.queue(c);
                    return;
                }
                var old_pic = pic;
                pic = startPos + 1;
                pin = 1;
                if (needle.length === 1) {
                    // we found the entire needle
                    var c = chunk.slice(old_pic,startPos)
                    if (c.length) this.queue(c);
                    queueReplacement(this);
                    pin = 0;
                    continue;
                } 
                if (chunk.length - pic <= 0) {
                    // the chunk potentially contains the needle hedd
                    // we store it for later
                    return bufferChunk(chunk);
                }
            }
            // Is the rest of the chunk identical to 
            // the rest of the needle?
            console.log(needle, chunk, pin, pic);
            var nl = compare(needle, chunk, pin, pic);
            if (nl === -1) {
                // no, we need to start over
                pin = 0;
                pic = 0;
                // queue whole bufferList
                bufferChunk(chunk);
                return flushBuffer(this, Number.POSITIVE_INFINITY);
            }
            // yes! This looks promising.
            // is the whole needle contained in the chunk?
            if (nl === 0) {
                // YES! This is the chunk containing the needle's tail.
                // we found the needle. We need to
                // emit bufferList + chunk[0..startPos)
                bufferChunk(chunk);
                flushBuffer(this, startPos);
                queueReplacement(this);
                pic += needle.length - pin;
                pin = 0;
                continue;
            }
            // no, the needle's tail is yet to be found.
            // we just push the chunk to the bufferList
            // since we can't decide wheter to forward it or not
            return bufferChunk(chunk);
        }
    }

    function end() {
        flushBuffer(this, Number.POSITIVE_INFINITY);
    }
    
    return through(write, end);
};
