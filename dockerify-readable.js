'use strict';

var stream = require('readable-stream');
var path   = require('path')
  , fs     = require('fs')
  , util   = require('util')
  , tar    = require('tar-stream')

var si = typeof setImmediate === 'function' ? setImmediate : function (fn) { setTimeout(fn, 0) };

function stripPathSegments(p, n) {
  var paths = p.split(path.sep);
  paths = paths.filter(function (x) { return x.length &&  x !== '.' });
  if (paths.length < n) throw new Error('Cannot strip more path segments than are paths in ' + p);
  return path.join.apply(path, paths.slice(n));
}

function resolveContent(opts, cb) {
  if (opts.content) return si(cb.bind(null, null, opts.content));
  if (opts.dockerfile) return fs.readFile(opts.dockerfile, 'utf8', cb);
  si(cb.bind(null, null, 'from ubuntu\n'));
}

var Transform = stream.Transform;
module.exports = DockerifyTransform;

util.inherits(DockerifyTransform, Transform);
var proto = DockerifyTransform.prototype;

function DockerifyTransform (opts) {
  if (!(this instanceof DockerifyTransform)) return new DockerifyTransform(opts);

  this._opts = opts || {};
  
  Transform.call(this, opts);

  this._pack = tar.pack();
  this._extract = tar.extract();
  this._initExtract();
  this._initPack();
}

proto._initExtract = function () {
  var self = this;
  var existingDockerfile = false;

  self._extract
    .on('error', self.emit.bind(self, 'error'))
    .on('entry', function (hdr, packstream, cb) {
      if (self._opts.strip) {
        try {
          hdr.name = stripPathSegments(hdr.name, self._opts.strip);
        } catch (err) {
          self.emit('error', err);
        }
      }
      if (hdr.name === 'Dockerfile') {
        existingDockerfile = hdr;
        // rename this Dockerfile if we'll override it later
        if (self._opts.override) hdr.name = '.Dockerfile.orig';
      }

      var p = self._pack.entry(hdr, packstream, cb)
      if (hdr.type === 'file') packstream.pipe(p);
      self.emit('entry', hdr);
    })
    .on('finish', function () {
      var hdr;
      if (!existingDockerfile || self._opts.override) {
        hdr = { 
            name  : 'Dockerfile'
          , mtime : self._opts.stats.mtime || new Date()
          , mode  : self._opts.stats.mode  || parseInt('644', 8)
          , uname : self._opts.stats.uname || 'docker'
          , gname : self._opts.stats.gname || 'users'
          , uid   : self._opts.stats.uid   || 501
          , gid   : self._opts.stats.gid   || 20
          };

        // @see _flush which sets this variable before triggering 'finish' via extract.end()
        self._pack.entry(hdr, self._dockerfileContent);

        self.emit('entry', hdr);

        // a docker file existed, but we chose to override it
        if (existingDockerfile) self.emit('overriding-dockerfile', { existing: existingDockerfile, override: hdr });

      } else {
        // a dockerfile existed and we chose not to override it
        if (existingDockerfile) self.emit('existing-dockerfile', { existing: existingDockerfile });
      }
      self._pack.finalize();
    });
}

proto._initPack = function () {
  var self = this;
  self._pack.on('data', self.push.bind(self));
  self._pack.on('error', self.emit.bind(self, 'error'));
  self._pack.on('end', function () { console.log('pack ended'); self.push(null); });
}

proto._transform = function (chunk, encoding, cb) {
  var self = this;
  this._extract.write(chunk);
  cb();
}

proto._flush = function (cb) {
  var self = this;
  resolveContent(self._opts, function (err, content) {
    if (err) return self.emit('error', err);
    self._dockerfileContent = content;
    self._extract.end();
    cb();
  })
}
