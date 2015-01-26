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
 *
 * Whenever you add a chunk or decide to ignore/forward bytes,
 * the FIFO does a lazy_flush, i.e. it forwards/deletes as many whole chinks as possible. (it avoids slicing chunks when possible)
 *
 * You can force a full flush by explicitly calling flush().
 * A full flush means that all queued ignore() forward() commands
 * are being executed.  
 */

var debug = require('debug')('fifo');

// passDownstream is a fnction that
// takes a Buffer/string
function fifo(passDownstream) {
    var seq = [[0,0]];
    var chunks = [];

    function skip(n) {
        var last = seq[seq.length-1];
        // if forward is zero, we can just
        // increase skip, otherwise we need a new entry
        if (seq.length > 0 && last[1] === 0) {
            last[0] += n;
        } else {
            seq.push([n,0]);
        }
        _lazy_flush();
    }

    function forward(n) {
        if (seq.length > 0) {
            var last = seq[seq.length-1];
            last[1] += n;
        } else {
            seq.push([0,n]);
        }
        _lazy_flush();
    }

    function addChunk(chunk) {
        chunks.push(chunk);
        _lazy_flush();
    }
    
    function _flush_one() { 
        if (chunks.length === 0 || seq.length === 0) return;
        var ch = chunks[0];
        var len = ch.length;
        var skip = seq[0][0];
        var fwd = seq[0][1];
        debug(skip, fwd); 
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
        debug('len', len);
        var fwdBytes = Math.min(len, fwd);
        if (fwdBytes) {
            if (fwdBytes === len) {
                debug('forwarding', ch);
                passDownstream(ch);
                chunks.shift();
            } else {
                debug('forwarding slice', ch.slice(0, fwdBytes));
                passDownstream(ch.slice(0, fwdBytes));
                chunks[0] = ch = ch.slice(fwdBytes);
            }
        }
        debug('forwarded', fwdBytes, 'bytes');
        fwd -= fwdBytes;
        if (skip === 0 && fwd === 0) {
            seq.shift();
        } else {
            seq[0][0] = skip;
            seq[0][1] = fwd;
        }
        return true;
    }

    function _lazy_flush() {
        debug(seq);
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
                debug('can flush');
                // let's do it.
                _flush_one();
            }
        } while(doable);
    }

    function flush() {
        while(_flush_one());
    }
    
    function handleRest(f) {
        return function() {
            var sum = 0;
            chunks.forEach(function(chunk) {
                sum =+ chunk.length;
            });
            seq.forEach(function(s) {
                sum -= s[0] + s[1];
            });
            f(sum);
        }
    } 

    // return bytes for which  we don't know
    // yet whether to skip or forward them.
    function getUnassigned() {
        var sum = 0;
        for(var i=0; i<seq.length; i++) {
            sum += seq[i][0] + seq[i][1];
        }
        var result = [];
        var b = false;
        for (i=0; i<chunks.length; ++i) {
            if (!b && chunks[i].length <= sum) {
                sum -= chunks[i].length;
            } else {
                b = true;
            }
            if (b) result.push(chunks[i]);
        }
        return {
            pic: sum,
            chunks: result
        };
    }
    return {
        addChunk: addChunk,
        skip: skip,
        forward: forward,
        flush: flush,
        getUnassigned: getUnassigned,
        forwardRest: handleRest(forward),
        skipRest: handleRest(skip)
    };
}

module.exports = fifo;
