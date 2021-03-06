var tape = require('tape');
var fifo = require('../lib/fifo');

tape('fifo should forward desired bytes of single chunk with minimal slicing', function(t) {
    t.plan(1);
    
    var l = [];
    var f = fifo(function(d) {l.push(d);});
    f.addChunk('xxxyyyzzz');
    f.skip(1);
    f.forward(1);
    f.skip(1);
    f.forward(3);
    f.forward(3);
    t.deepEqual(l, ['x','yyyzzz']);
});

tape('forward should work across buffer boundaries', function(t) {
    t.plan(2);

    var l = [];
    var f = fifo(function(d) {l.push(d);});
    f.addChunk('xxx');
    f.addChunk('yyyzzz');
    f.skip(2);
    f.forward(2);
    t.deepEqual(l, ['x']);
    f.skip(5);
    t.deepEqual(l, ['x','y']);
});

tape('flush() should force forwarding, even when called mid-chunk', function(t) {
    t.plan(2);

    var l = [];
    var f = fifo(function(d) {l.push(d);});
    f.addChunk('xxxyyyzzz');
    f.skip(3);
    f.forward(3);
    f.flush();
    t.deepEqual(l, ['yyy']);
    f.forward(3);
    t.deepEqual(l, ['yyy','zzz']);
});

tape('getUnassigned() should return unassigned chunks', function(t) {
    t.plan(4);

    var f = fifo(function(d) {});
    f.addChunk('xxxyyyzzz');
    f.skip(3);
    t.deepEqual(f.getUnassigned(), {
        chunks: ['xxxyyyzzz'],
        pic: 3});

    f.addChunk('111');

    t.deepEqual(f.getUnassigned(), {
        chunks: ['xxxyyyzzz', '111'],
        pic: 3});

    f.skip(7);

    t.deepEqual(f.getUnassigned(), {
        chunks: ['111'],
        pic: 1});

    f.forward(2);

    t.deepEqual(f.getUnassigned(), {
        chunks: [],
        pic: 0});
});
