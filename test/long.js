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
        t.deepEqual(data, d2);
    });
    src.pipe(rs).pipe(cs);
}

test('should not modify a text file when search string is not found', function(t) {
    t.plan(1);
    compare(t, 'utf-8', 'lorem.txt', 'lorem.txt', 'asdfsdf', '', {});
});

test('should replace all occurrences of "of" with "0f"', function(t) {
    t.plan(1);
    compare(t, 'utf-8', 'lorem.txt', '0f.txt', 'of', '0f', {});
});

test('should change first 6 occurrences of "of" to "0ffer"', function(t) {
    t.plan(1);
    compare(t, 'utf-8', 'lorem.txt', '6x0ffer.txt', 'of', '0ffer', {maxOccurrences: 6});
});

test('should not alter a binary stream', function(t) {
    t.plan(1);
    compare(t, null, 'random.bin', 'random.bin', new Buffer([0xff,0xff,0xff,0xff]), new Buffer([0x00]));
});

test('should replace all occurrences of 0xff with 0x00 in a binary file', function(t) {
    t.plan(1);
    compare(t, null, 'random.bin', 'ffto00.bin', new Buffer([0xff]), new Buffer([0x00]));
});
