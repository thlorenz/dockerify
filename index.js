'use strict';

var path    = require('path')
  , tar     = require('tar-stream')
  , zlib    = require('zlib')
  , through = require('through2')

var si = setImmediate || function (fn) { setTimeout(fn, 0) };

function stripPathSegments(p, n) {
  var paths = p.split(path.sep);
  if (paths.length <= n) throw new Error('Cannot strip more path segments than are paths in ' + p);
  paths = paths.filter(function (x) { return x.length &&  x !== '.' });
  return path.join.apply(path, paths.slice(n));
}

function dockerify(stream, dockerfile, opts, strip) {
  var pack    = tar.pack()
    , extract = tar.extract()

  extract
    .on('error', stream.emit.bind(stream, 'error'))
    .on('entry', function (hdr, packstream, cb) {
      if (strip) {
        try {
          hdr.name = stripPathSegments(hdr.name, strip);
        } catch (err) {
          stream.emit('error', err);
        }
      }
      var p = pack.entry(hdr, packstream, cb)
      if (hdr.type === 'file') packstream.pipe(p);
      inspect(hdr);
    })
    .on('finish', function () {
      pack.entry(
        { name  : 'Dockerfile'
        , mtime : opts.mtime || new Date()
        , mode  : opts.mode  || parseInt('644', 8)
        , uname : opts.uname || 'thlorenz'
        , gname : opts.gname || 'users'
        , uid   : opts.uid   || 501
        , gid   : opts.gid   || 20
        }
      , dockerfile);

      pack.finalize();
    });

  stream.pipe(extract);
  return pack;
}

function resolveContent(opts, cb) {
  if (opts.content) return si(cb.bind(null, null, opts.content));
  if (opts.dockerfile) return fs.readFile(opts.dockerfile, 'utf8', cb);
  si(cb.bind(null, null, 'from ubuntu\n'));
}

exports = module.exports = function tar(stream, opts) {
  opts = opts || {};
  opts.stats = opts.stats || {};

  var out = through();

  resolveContent(opts, function (err, content) {
    if (err) return out.emit('error', err);
    dockerify(stream, content, opts.stats, opts.strip).pipe(out);
  })

  return out;
}
exports.tar = exports;

exports.targz = function targz(stream, opts) {
  return exports.tar(stream.pipe(zlib.createGunzip()), opts);
}

// Test
var fs = require('fs');
function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

if (!module.parent && typeof window === 'undefined') {
  exports.tar(fs.createReadStream(__dirname + '/tmp/in.tar', 'utf8'), { strip: 1 }).pipe(process.stdout);
}
