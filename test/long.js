var fs = require('fs');
var path = require('path');
var Cs = require('concat-stream');
var test = require('tape');
var Rs = require('..');

function compare(t, encoding, file1, file2, n, r, o) {
    var src = fs.createReadStream(path.join(__dirname, 'fixtures', file1), {encoding:encoding});
    var rs = Rs(n, r, o);
    var cs = Cs(function(data) {
        var d2 = fs.readFileSync(path.join(__dirname, 'fixtures', file2), encoding);
        t.equal(data, d2);
    });
    src.pipe(rs).pipe(cs);
}

test('should not modify a text file when search string is not found', function(t) {
    t.plan(1);
    compare(t, 'utf-8', 'lorem.txt', 'lorem.txt', 'asdfsdf', '', {});
});

test('should replace all occurances of "of" with "0f"', function(t) {
    t.plan(1);
    compare(t, 'utf-8', 'lorem.txt', '0f.txt', 'of', '0f', {});
});

test('should change first 6 occurances of "of" to "0ffer"', function(t) {
    t.plan(1);
    compare(t, 'utf-8', 'lorem.txt', '6x0ffer.txt', 'of', '0ffer', {maxOccurances: 6});
});
