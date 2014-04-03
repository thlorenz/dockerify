'use strict';

var path              = require('path')
  , dockerifyReadable = require('./dockerify-readable')
  , fs                = require('fs')
  , zlib              = require('zlib')
  , through           = require('through2')


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
 *  - `existing-dockerfile` emitted whenever an existing Dockerfile was found and used instead of the supplied one
 *  - `overriding-dockerfile` emitted whenever an exising Dockerfile was overridden with the supplied one
 *
 * #### opts
 *
 *  - *{number=}*   **opts.strip**      `default: 0` sets the number of path segments to strip from each directory
 *  - *{string=}*   **opts.content**    content of the Dockerfile, defaults to read(opts.dockerfile) or 'from ubuntu\n' 
 *  - *{string=}*   **opts.dockerfile** file to read Dockerfile content from in case `opts.content` wasn't provided
 *  - *{boolean=}*  **opts.override**   `default: false` if the project contains a `Dockerfile` at the root 
 *    (after directories are stripped), it will be overwritten with the content/file provided if this option is set
 *
 *  - *{Object}*    **opts.stats**      allows setting mtime, mode, uname, gname, uid and gid of the created Dockefile
 * 
 * @name tar
 * @function
 * @param {Object} opts @see above
 * @return {TranformStream} that will transform a tar stream that is piped into it
 */
function tar(opts) {
  opts = opts || {};
  opts.stats = opts.stats || {};

  return dockerifyReadable(opts);
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
function targz(opts) {
  return zlib.createGunzip().pipe(exports.tar(opts));
}
