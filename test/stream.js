var test = require('tape');

var replacer = require('..');

function r(hay,needle, replace, options) {
    var l= [];
    var rs = replacer(needle, replace, options);
    rs.on('data', function(data) {l.push(data);});
    if (Array.isArray(hay)) {
        hay.forEach(function(b) {
            rs.write(b);
        });
    } else {
        rs.write(hay);
    }
    rs.end();
    return l;
}

test('empty haystack', function(t) {
    t.plan(1);

    t.deepEqual(r([], 'a', 'x'), []);
});

test('single-byte needle', function (t) {
    t.plan(5);  

    t.deepEqual( r('aaa','a','x'), ['x', 'x', 'x']);
    t.deepEqual( r('---aaa','a','x'), ['---', 'x', 'x', 'x']);
    t.deepEqual( r('aaa---','a','x'), ['x', 'x', 'x','---']);
    t.deepEqual( r('...aaa---','a','x'), ['...', 'x', 'x', 'x','---']);
    t.deepEqual( r('...ababba---','a','x'), ['...', 'x', 'b', 'x', 'bb', 'x', '---']);
});

test('multi-byte needle', function (t) {
    t.plan(5);

    t.deepEqual( r('aa.aa','aa','x'), ['x', '.', 'x']);
    t.deepEqual( r('---aaa','aaa','x'), ['---', 'x']);
    t.deepEqual( r('aaa---','aaa','x'), ['x', '---']);
    t.deepEqual( r('...aaa---','aaa','x'), ['...', 'x', '---']);
    t.deepEqual( r('...ababba---','aba','x'), ['...', 'x', 'bba---']);
});

test('multi-byte needle spread across 2 chunks', function (t) {
    t.plan(5);

    t.deepEqual( r(['a','a.aa'],'aa','x'), ['x', '.', 'x']);
    t.deepEqual( r(['---aa','a'],'aaa','x'), ['---', 'x']);
    t.deepEqual( r(['a','aa---'],'aaa','x'), ['x', '---']);
    t.deepEqual( r(['...a','aa---'],'aaa','x'), ['...', 'x', '---']);
    t.deepEqual( r('...ababba---','aba','x'), ['...', 'x', 'bba---']);
});

test('multi-byte needle spread across 3 chunks', function (t) {
    t.plan(5);

    t.deepEqual( r(['h','el', 'lo.stuff'],'hello','x'), ['x', '.stuff']);
    t.deepEqual( r(['---he','l','lo'],'hello','x'), ['---', 'x']);
    t.deepEqual( r(['hel','l','o', '---'],'hello','x'), ['x', '---']);
    t.deepEqual( r(['...h','e','llo///'],'hello','x'), ['...', 'x', '///']);
    t.deepEqual( r(['...','h','e','llo---'],'hello','x'), ['...', 'x', '---']);
});

test('needle head (requires unwinding)', function (t) {
    t.plan(6);

    t.deepEqual( r(['h','el', '.stuff.hello'],'hello','x'), ['h', 'el', '.stuff.', 'x']);
    t.deepEqual( r(['---he','l','lhello'],'hello','x'), ['---he','l','l', 'x']);
    t.deepEqual( r(['hel','h','ello', '---'],'hello','x'), ['hel', 'x', '---']);
    t.deepEqual( r(['...h','e','ll///hell','o'],'hello','x'), ['...h', 'e', 'll///', 'x']);
    t.deepEqual( r(['hellhellohell'],'hello','x'), ['hell', 'x', 'hell']);
    t.deepEqual( r('hhelloo','hello','x'), ['h', 'x', 'o']);
});

test('enter forwarding mode in the middle of a chunk', function (t) {
    t.plan(3);

    t.deepEqual( r('hellohellohello','hello', 'x', {maxOccurrences: 1}), ['x', 'hellohello']);
    t.deepEqual( r('hellohellohello','hello', 'x', {maxOccurrences: 2}), ['x', 'x', 'hello']);
    t.deepEqual( r('hellhellohello','hello', 'x', {maxOccurrences: 1}), ['hell','x', 'hello']);
});

test('enter forwarding mode at chunk boundary', function (t) {
    t.plan(3);

    t.deepEqual( r(['hellohellohello','hello'],'hello', 'x', {maxOccurrences: 3}), ['x','x','x', 'hello']);
    t.deepEqual( r(['hello','hello'],'hello', 'x', {maxOccurrences: 1}), ['x', 'hello']);
    t.deepEqual( r(['---hello','hello'],'hello', 'x', {maxOccurrences: 1}), ['---', 'x', 'hello']);
});

test('should handle binary streams', function (t) {
    t.plan(1);

    t.deepEqual(
        r(
            new Buffer([0,1,2,3,4]),
            new Buffer([2,3]),
            new Buffer([0xff])
        ),
        [
            new Buffer([0,1]),
            new Buffer([0xff]), 
            new Buffer([4])
        ]
    );
});
