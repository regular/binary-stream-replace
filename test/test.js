var test = require('tape');
var util = require('../lib/util.js');
var indexOf = util.indexOf;
var compare = util.compare;

test('indexOf', function (t) {
    t.plan(4);
    t.equal(indexOf([1,2,3,1], 1), 0);
    t.equal(indexOf([1,2,3,2], 2), 1);
    t.equal(indexOf([1,2,3,1], 0), -1);
    t.equal(indexOf([1,2,3,1], 1, 1), 3);
});

test('compare', function (t) {
    t.plan(13);
    
    // nothing to compare
    t.throws( function() {compare('abc','abcdef', 3,0);} );
    t.throws( function() {compare('abc','abcdef', 0,6);} );
    t.throws( function() {compare('abc','abcdef', 3,6);} );
    t.throws( function() {compare('abc','abcdef', 4,7);} );

    // needle is contained in chunk
    t.equal( compare('abc','abcdef', 0,0), 0);
    t.equal( compare('def','abcdef', 0,3), 0);
    t.equal( compare('cde','abcdef', 0,2), 0);

    // needle tail is contained in chunk (both offsets != 0)
    t.equal( compare('abc', 'abcdef', 1,1), 0);
    t.equal( compare('def', 'abcdef', 1,4), 0);
    t.equal( compare('cde', 'abcdef', 2,4), 0);

    // needle starts in chunk, compare indicates
    // bytes left in needle
    t.equal( compare('efgh','abcdef', 0,4), 2);
    t.equal( compare('efgh','abcdef', 2,4), -1);
    t.equal( compare('efgh','abcdef', 1,5), 2);
});
