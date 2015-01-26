var debug = require('debug')('bin-replace-stream');
var through = require('through');
var Fifo = require('./lib/fifo');
var util = require('./lib/util');
var indexOf = util.indexOf;
var compare = util.compare;

/* if pin (position in chunk) is zero, we look out
 * for the first byte of the needle in the chunk.
 * If found, we continue looking for more needle bytes
 * until we either found the whole needle or get disappointed.
 * When we found the whole needle, we flush the fifo, queue the
 * replacement and continue with pin = 0 at the first byte
 * after the needle.
 *
 * If we get disappointed, we forward one byte and continue
 * with pos = 0 at the next byte.
*/

module.exports = function(needle, replace) {

    var pin = 0; // pos in needle
    var occurances = 0;
    var unsure = 0; // number of bytes that could be part of the needle 
    var fifo = null;
    
    function queueReplacement(stream) {
        stream.queue(replace);
    }

    function handleChunk(stream, chunk, pic) {
        if (pin === 0) {     
            // does this chunk contain
            // the first needle byte?
            var s  = indexOf(chunk, needle[0], pic);
            debug('found first needle byte at %d', s);
            if (s === -1) {
                // no. just forward the rest of the chunk
                fifo.forward(chunk.length - pic);
                return chunk.length; // new pic
            }
            if (needle.length === 1) {
                // we found the entire needle
                fifo.forward(s - pic);
                fifo.skip(1);
                fifo.flush();
                queueReplacement(stream);
                pin = 0;
                return s + 1; // new pic
            } else {
                fifo.forward(s - pic);
                pin = 1;
                unsure = 1;
                return s + 1;
            }
        } // end pin === 0

        // Is the rest of the chunk identical to 
        // the rest of the needle?
        var nl = compare(needle, chunk, pin, pic);
        debug('compare', needle, chunk, pin, pic, 'nl', nl);
        // is the whole needle contained in the chunk?
        if (nl === 0) {
            // YES! This is the chunk containing the needle's tail.
            // we found the needle. We need to
            debug('whole needle found.');
            fifo.skip(needle.length - pin + unsure);
            fifo.flush();
            queueReplacement(stream);
            var newPic = pic + (needle.length - pin);
            pin = 0;
            unsure = 0;
            return newPic; 
        }
        if (nl > 0) {
            // we made some progress, but we don't know if we
            // are in the needle actually
            unsure += needle.length - pin - nl;
            pin += needle.length - pin - nl;
            return chunk.length;
        }
        // this was not the needle!
        fifo.forward(1);
        // we need to unwind unsure-1 bytes
        unsure = 0;
        pin = 0;
        return -1; // unwind
    }

    function write(chunk) {
        if (fifo === null) {
            fifo = Fifo(this.queue.bind(this));
        }
        fifo.addChunk(chunk);
        var chunks = [chunk];
        var pic = 0;

        while(chunks.length) {
            chunk = chunks.shift();
            for(;;) {
                pic = handleChunk(this, chunk, pic);
                if (pic === -1) {
                    var r = fifo.getUnassigned();
                    pic = r.pic;
                    chunks = r.chunks;
                    break;
                }
                if (pic === chunk.length) {
                    pic = 0;
                    break;
                }
            }
        }
    }
        
    function end() {
        fifo.forwardRest();
        fifo.flush();  
    }
    
    return through(write, end);
};
