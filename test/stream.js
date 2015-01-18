var test = require('tape');

var replacer = require('..');

function r(hay,needle, replace) {
    var l= [];
    var rs = replacer(needle, replace);
    rs.on('data', function(data) {l.push(data);});
    rs.write(hay);
    return l;
}

test('single-byte needle', function (t) {
    t.plan(4);  

    t.deepEqual( r('aaa','a','x'), ['x', 'x', 'x']);
    t.deepEqual( r('---aaa','a','x'), ['---', 'x', 'x', 'x']);
    t.deepEqual( r('aaa---','a','x'), ['x', 'x', 'x','---']);
    t.deepEqual( r('...aaa---','a','x'), ['...', 'x', 'x', 'x','---']);
});

