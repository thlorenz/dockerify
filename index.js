'use strict';

var path    = require('path')
  , tar     = require('tar-stream')
  , zlib    = require('zlib')
  , through = require('through2')

var si = setImmediate || function (fn) { setTimeout(fn, 0) };

function stripPathSegments(p, n) {
  var paths = p.split(path.sep);
  paths = paths.filter(function (x) { return x.length &&  x !== '.' });
  if (paths.length < n) throw new Error('Cannot strip more path segments than are paths in ' + p);
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
      stream.emit('entry', hdr);
    })
    .on('finish', function () {
      var hdr = { 
          name  : 'Dockerfile'
        , mtime : opts.mtime || new Date()
        , mode  : opts.mode  || parseInt('644', 8)
        , uname : opts.uname || 'docker'
        , gname : opts.gname || 'users'
        , uid   : opts.uid   || 501
        , gid   : opts.gid   || 20
        };
      pack.entry(hdr, dockerfile);

      stream.emit('entry', hdr);
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
 *  - `entry` emitted whenever an entry was processed and modified
 *
 * #### opts
 *
 *  - *{number=}*   **opts.strip**      `default: 0` sets the number of path segments to strip from each directory
 *  - *{string=}*   **opts.content**    content of the Dockerfile, defaults to read(opts.dockerfile) or 'from ubuntu\n' 
 *  - *{string=}*   **opts.dockerfile** file to read Dockerfile content from in case `opts.content` wasn't provided
 *  - *{boolean=}*  **opts.override**   `default: false` if the project contains a `Dockerfile` at the root 
 *                                      (after directories are stripped), it will be overwritten with the content/file provided
 *                                      if this option is set
 *  - *{Object}*    **opts.stats**      allows setting mtime, mode, uname, gname, uid and gid of the created Dockefile
 * 
 * @name tar
 * @function
 * @param {ReadableStream} stream the original tar stream
 * @param {Object} opts @see above
 * @return {ReadableStream} the transformed tar stream
 */
function tar(stream, opts) {
  opts = opts || {};
  opts.stats = opts.stats || {};

  var out = through();

  resolveContent(opts, function (err, content) {
    if (err) return out.emit('error', err);
    dockerify(stream, content, opts.stats, opts.strip).pipe(out);
    stream.on('entry', out.emit.bind(out, 'entry'));
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
    .on('entry', inspect)
    .pipe(process.stdout);
}
