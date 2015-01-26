var test = require('tape');

var replacer = require('..');

function r(hay,needle, replace) {
    var l= [];
    var rs = replacer(needle, replace);
    rs.on('data', function(data) {l.push(data);});
    if (Array.isArray(hay)) {
        hay.forEach(function(b) {
            rs.write(b);
        });
    } else {
        rs.write(hay);
    }
    return l;
}

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
