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
      stream.emit('file', hdr);
    })
    .on('finish', function () {
      var hdr = pack.entry(
        { name  : 'Dockerfile'
        , mtime : opts.mtime || new Date()
        , mode  : opts.mode  || parseInt('644', 8)
        , uname : opts.uname || 'docker'
        , gname : opts.gname || 'users'
        , uid   : opts.uid   || 501
        , gid   : opts.gid   || 20
        }
      , dockerfile);

      stream.emit('file', hdr);
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

exports = module.exports = 

/**
 * Modifies the given tar stream according to given options.
 * The main purpose is adding a Dockerfile so the resulting tar stream can be piped direclty into 
 * [docker build](http://docs.docker.io/en/latest/reference/api/docker_remote_api_v1.9/#build-an-image-from-dockerfile-via-stdin)
 *
 * #### Note
 *
 * The returned tar stream emits the following events on top of the typical `ReadableStream` events:
 *
 *  - `file` emitted whenever a file was processed and modified
 * 
 * @name tar
 * @function
 * @param {ReadableStream} stream the original tar stream
 * @param {Object}    opts 
 * @param {number=0}  opts.strip      sets the number of path segments to strip from each directory
 * @param {string=}   opts.content    content of the Dockerfile, defaults to read(opts.dockerfile) or 'from ubuntu\n' 
 * @param {string=}   opts.dockerfile file to read Dockerfile content from in case `opts.content` wasn't provided
 * @param {Object}    opts.stats      allows setting mtime, mode, uname, gname, uid and gid of the created Dockefile
 * @return {ReadableStream} the transformed tar stream
 */
function tar(stream, opts) {
  opts = opts || {};
  opts.stats = opts.stats || {};

  var out = through();

  resolveContent(opts, function (err, content) {
    if (err) return out.emit('error', err);
    dockerify(stream, content, opts.stats, opts.strip).pipe(out);
    stream.on('file', out.emit.bind(out, 'file'));
  })

  return out;
}
exports.tar = exports;

exports.targz = 

/**
 * Gunzips the .tar.gz stream and passes it along to `tar`.
 *
 * @name targz
 * @function
 * @param {ReadableStream} stream .tar.gz stream
 * @param {Object} opts @see `tar`
 * @return {ReadableStream} the transformed tar stream
 */
function targz(stream, opts) {
  return exports.tar(stream.pipe(zlib.createGunzip()), opts);
}

// Test
var fs = require('fs');
function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

if (!module.parent && typeof window === 'undefined') {
  exports.tar(fs.createReadStream(__dirname + '/tmp/in.tar', 'utf8'), { strip: 1 })
    .on('file', inspect)
    .pipe(process.stdout);
}
