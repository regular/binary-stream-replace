/* This is a special Fifo.
 * You add chunks of data to it
 * (anything that has slice() and length)
 * and additionally you specify what to do with
 * the bytes/chars in the buffer.
 * You can ignore n-bytes and forward n-bytes downstream.
 * The spans of ignored/forwarded bytes can cross chunk
 * boundaries.
 *
 * [ chunk 1 | chunk 2 | chunk 3 | chunk 4 ..
 * [ skip | forward     | skip    | ...
 */

// passDownstream is a fnction that
// takes a Buffer/string
function fifo(passDownstream) {
    var seq = [[0,0]];
    var chunks = [];

    function skip(n) {
        var last = seq[seq.length-1];
        // if forward is zero, we can just
        // increase skip, otherwise we need a new entry
        if (last[1] === 0) {
            last[0] += n;
        } else {
            seq.push([n,0]);
        }
        flush();
    }

    function forward(n) {
        var last = seq[seq.length-1];
        last[1] += n;
        flush();
    }

    function addChunk(chunk) {
        chunks.push(chunk);
        flush();
    }
    
    function flush() {
        console.log(seq);
        // get rid of as many chunks 
        // as we can. We can get rid of a chunk
        // if we know what to do with all of its content.
        var doable;
        do {
            doable = false;
            if (chunks.length === 0) break;
            var ch = chunks[0];
            var len = ch.length;
            // can we flush this chunk?
            var sum = 0;
            for(var i=0; i<seq.length && sum<len; i++) {
                sum += seq[i][0] + seq[i][1];
            }
            if ((doable = sum >= len)) {
                console.log('can flush');
                // let's do it.
                var skip = seq[0][0];
                var fwd = seq[0][1];
                console.log(skip, fwd); 
                var skipBytes = Math.min(len, skip);
                if (skipBytes === len) {
                    chunks.shift();
                } else {
                    if (skipBytes) {
                        chunks[0] = ch = ch.slice(skipBytes);     
                    }
                }
                skip -= skipBytes;
                len -= skipBytes;
                console.log('len', len);
                var fwdBytes = Math.min(len, fwd);
                if (fwdBytes) {
                    if (fwdBytes === len) {
                        console.log('forwarding', ch);
                        passDownstream(ch);
                        chunks.shift();
                    } else {
                        console.log('forwarding slice', ch.slice(0, fwdBytes));
                        passDownstream(ch.slice(0, fwdBytes));
                        chunks[0] = ch = ch.slice(fwdBytes);
                    }
                }
                console.log('forwarded', fwdBytes, 'bytes');
                fwd -= fwdBytes;
                if (skip === 0 && fwd === 0) {
                    seq.shift();
                } else {
                    seq[0][0] = skip;
                    seq[0][1] = fwd;
                }
            }
        } while(doable);
    }

    return {
        addChunk: addChunk,
        skip: skip,
        forward: forward
    };
}

module.exports = fifo;
