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

function check(desc, input, output, opts, expectedEntries, debug) {
  test('\n' + desc, function (t) {
    var in_ = fs.createReadStream(path.join(fixtures, input), 'utf8');

    var expectedTar;

    var data = '';
    var entries = [];

    opts             = opts || {}
    opts.stats       = opts.stats || {}
    opts.stats.mtime = new Date(11111) // needs to be consistent to have stable tests

    tar(in_, opts) 
      .on('error', function (err) { console.error(err); t.fail(err); t.end(); })
      .on('entry', [].push.bind(entries))
      .on('data', function (d) { data += d })
      .on('end', function () {

        entries.forEach(function (x) { delete x.mtime })

        if (debug) {
          inspect(entries);
          fs.writeFileSync(path.join(expected, output), data, 'utf8');
          return t.end()
        }

        expectedTar = fs.readFileSync(path.join(expected, output), 'utf8').toString();
        t.equal(data, expectedTar);

        // some tests don't need to check entries
        if (expectedEntries) t.deepEqual(entries, expectedEntries);

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
check( 
    'given a tar stream without a docker file strip 1'
  , 'no-dockerfile.tar'
  , 'no-dockerfile-strip-1.tar'
  , { strip: 1 }
  , [ { name: '.',
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
      { name: 'hello1.txt',
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
      { name: 'hello2.txt',
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

check( 
    'given a tar stream without a docker file strip 1, and uname, gname overrides'
  , 'no-dockerfile.tar'
  , 'no-dockerfile-strip-1-uname-gname-overrides.tar'
  , { strip: 1, stats: { uname: 'hello', gname: 'world' } }
  , [ { name: '.',
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
      { name: 'hello1.txt',
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
      { name: 'hello2.txt',
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
        uname: 'hello',
        gname: 'world',
        uid: 501,
        gid: 20,
        size: 12,
        type: 'file' } ]
)

check( 
    'given a tar stream without a docker file with content'
  , 'no-dockerfile.tar'
  , 'no-dockerfile-content.tar'
  , { content: 'from dockerfile/nodejs' }
  , null
)

check( 
    'given a tar stream without a docker file with dockerfile path'
  , 'no-dockerfile.tar'
  , 'no-dockerfile-dockerfile.tar'
  , { dockerfile: path.resolve(fixtures, 'Dockerfile') }
  , null
)
/*
check( 
    'given a tar stream with a docker file and no override'
  , 'with-dockerfile.tar'
  , 'with-dockerfile-no-override.tar'
  , { }
  , null
  , true
)*/
