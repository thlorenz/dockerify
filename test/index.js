'use strict';
/*jshint asi: true */

var test = require('tap').test
  , fs = require('fs')
  , path = require('path')
  , tar = require('../')
  , fixtures = path.join(__dirname, 'fixtures')
  , expecteds = path.join(__dirname, 'expected')

function byName(x, y) {
  return x.name > y.name ? 1 : -1;
}

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function check(desc, input, output, opts, expected, debug) {
  expected = expected || {};
  if (Array.isArray(expected)) expected = { entries: expected };

  test('\n' + desc, function (t) {
    var in_ = fs.createReadStream(path.join(fixtures, input), { encoding: 'utf8' });

    var expectedTar;

    var data = '';
    var entries = [];
    var overriding = [];
    var existing = [];

    opts             = opts || {}
    opts.stats       = opts.stats || {}
    opts.stats.mtime = new Date(11111) // needs to be consistent to have stable tests

    tar(in_, opts) 
      .on('error', function (err) { console.error(err); t.fail(err); t.end(); })
      .on('entry', [].push.bind(entries))
      .on('overriding-dockerfile', [].push.bind(overriding))
      .on('existing-dockerfile', [].push.bind(existing))
      .on('data', function (d) { data += d })
      .on('end', function () {

        entries = entries.sort(byName);
        entries.forEach(function (x) { delete x.mtime })
        existing.forEach(function (x) { 
          x.existing && delete x.existing.mtime; 
          x.override && delete x.override.mtime; 
        })
        overriding.forEach(function (x) { 
          x.existing && delete x.existing.mtime; 
          x.override && delete x.override.mtime; 
        })

        if (debug) {
          inspect({ entries: entries, existing: existing, overriding: overriding });
          fs.writeFileSync(path.join(expecteds, output), data, 'utf8');
          return t.end()
        }

        if (!(/^v0\.8/).test(process.version)) {
          // data is emitted in different order for node 0.8, so we omit this test for that version
          expectedTar = fs.readFileSync(path.join(expecteds, output), 'utf8').toString();
          t.equal(data, expectedTar);
        }

        if (expected.entries) t.deepEqual(entries, expected.entries);
        if (expected.existing) t.deepEqual(existing, expected.existing);
        if (expected.overriding) t.deepEqual(overriding, expected.overriding);

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
      { name: 'Dockerfile',
        mode: 420,
        uname: 'docker',
        gname: 'users',
        uid: 501,
        gid: 20,
        size: 12,
        type: 'file' },
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
        devminor: 0 } ]
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
      { name: 'Dockerfile',
        mode: 420,
        uname: 'hello',
        gname: 'world',
        uid: 501,
        gid: 20,
        size: 12,
        type: 'file' },
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
        devminor: 0 } ]
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

// uses default dockerfile since it the existing one is not at root
check( 
    'given a tar stream with a docker file not at root and no override'
  , 'with-dockerfile.tar'
  , 'with-dockerfile-not-at-root-no-override.tar'
  , { }
  , { entries:
      [ { name: './tmp/',
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
        { name: './tmp/Dockerfile',
          mode: 420,
          uid: 502,
          gid: 20,
          size: 16,
          type: 'file',
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
    , existing:  [], overriding: [] }
)

// uses existing docker file
check( 
    'given a tar stream with a docker file at root and no override'
  , 'with-dockerfile.tar'
  , 'with-dockerfile-no-override.tar'
  , { strip: 1 }
  , { entries:
      [ { name: '.',
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
        { name: 'Dockerfile',
          mode: 420,
          uid: 502,
          gid: 20,
          size: 16,
          type: 'file',
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
          devminor: 0 } ],
      existing:
      [ { existing:
            { name: 'Dockerfile',
              mode: 420,
              uid: 502,
              gid: 20,
              size: 16,
              type: 'file',
              linkname: null,
              uname: 'thlorenz',
              gname: 'staff',
              devmajor: 0,
              devminor: 0 } 
      } ],
      overriding: [] }
)

// renaming existing docker file
check( 
    'given a tar stream with a docker file at root and override'
  , 'with-dockerfile.tar'
  , 'with-dockerfile-override.tar'
  , { strip: 1, override: true, content: 'from docker/overriding' }
  , { entries:
      [ { name: '.',
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
        { name: '.Dockerfile.orig',
          mode: 420,
          uid: 502,
          gid: 20,
          size: 16,
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
          size: 22,
          type: 'file' },
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
          devminor: 0 } ],
      existing: [],
      overriding:
      [ { existing:
            { name: '.Dockerfile.orig',
              mode: 420,
              uid: 502,
              gid: 20,
              size: 16,
              type: 'file',
              linkname: null,
              uname: 'thlorenz',
              gname: 'staff',
              devmajor: 0,
              devminor: 0 },
          override:
            { name: 'Dockerfile',
              mode: 420,
              uname: 'docker',
              gname: 'users',
              uid: 501,
              gid: 20,
              size: 22,
              type: 'file' } } ] }
)
