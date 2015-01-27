binary-stream-replace
===
A transform-stream for Node and browsers that efficeintly replaces sequences of bytes in a binary stream. Can be restricted to replace first n occurrences only.

Usage
---

``` js
var ReplaceStream = require('binary-stream-replace');

// replace first 10 occurrences of byte sequence `fe fe` with
// `00 00 01`
var rs = ReplaceStream(
    new Buffer([0xfe, 0xfe]),
    new Buffer([0x00, 0x00, 0x01]),
    { maxOccurrences: 10 }
);

process.stdin.pipe(rs).pipe(process.stdout); 
```
