'use strict';
/*jshint asi: true */

var test = require('tap').test
  , fs = require('fs')
  , path = require('path')
  , tar = require('../')
  , fixtures = path.join(__dirname, 'fixtures')
  , expected = path.join(__dirname, 'expected')

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function check(desc, input, output, opts, expectedEntries) {
  test('\n' + desc, function (t) {
    var in_ = fs.createReadStream(path.join(fixtures, input), 'utf8');

    var expectedTar = fs.readFileSync(path.join(expected, output), data, 'utf8').toString();

    var data = '';
    var entries = [];

    opts             = opts || {}
    opts.stats       = opts.stats || {}
    opts.stats.mtime = new Date(11111) // needs to be consistent to have stable tests

    tar(in_, opts) 
      .on('error', function (err) { t.fail(err); t.end(); })
      .on('entry', [].push.bind(entries))
      .on('data', function (d) { data += d })
      .on('end', function () {
        inspect(entries);
        // fs.writeFileSync(path.join(expected, output), data, 'utf8');

        t.equal(data, expectedTar);
        entries.forEach(function (x) { delete x.mtime })

        t.deepEqual(entries, expectedEntries);
        t.end();
      });
    
  })
}

check(
    'given a tar stream without a docker file default strip'
  , 'no-dockerfile.tar'
  , 'no-dockerfile-default-strip.tar'
  , null
  , [ { name: './tmp/',
      mode: 493,
      uid: 502,
      gid: 20,
      size: 0,
      type: 'directory',
      linkname: null,
      uname: 'thlorenz',
      gname: 'staff',
      devmajor: 0,
      devminor: 0 },
    { name: './tmp/hello1.txt',
      mode: 420,
      uid: 502,
      gid: 20,
      size: 10,
      type: 'file',
      linkname: null,
      uname: 'thlorenz',
      gname: 'staff',
      devmajor: 0,
      devminor: 0 },
    { name: './tmp/hello2.txt',
      mode: 420,
      uid: 502,
      gid: 20,
      size: 10,
      type: 'file',
      linkname: null,
      uname: 'thlorenz',
      gname: 'staff',
      devmajor: 0,
      devminor: 0 },
    { name: 'Dockerfile',
      mode: 420,
      uname: 'docker',
      gname: 'users',
      uid: 501,
      gid: 20,
      size: 12,
      type: 'file' } ]
)
