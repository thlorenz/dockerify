#!/usr/bin/env node

var log      =  require('npmlog')
  , minimist =  require('minimist')
  , path     =  require('path')
  , fs       =  require('fs')
  , dockerify = require('../')
  ;

function usage() {
  var usageFile = path.join(__dirname, 'usage.txt');
  fs.createReadStream(usageFile).pipe(process.stdout);
  return;
}

(function () {

  var argv = minimist(process.argv.slice(2)
    , { boolean: [ 'h', 'help', 'override', 'o', 'gz', 'g' ]
      , number: [ 'strip', 's' ]
      , string: [ 'content', 'c', 'dockerfile', 'd', 'loglevel', 'l' ]
    });

  if (argv.h || argv.help) return usage();

  var strip      = argv.strip      || argv.s
    , override   = argv.override   || argv.o
    , content    = argv.content    || argv.c
    , dockerfile = argv.dockerfile || argv.d
    , gz         = argv.gz         || argv.g

  var opts = {
      strip      : strip
    , override   : override
    , content    : content
    , dockerfile : dockerfile
  };

  var stream = gz ? dockerify.targz(process.stdin, opts) : dockerify.tar(process.stdin, opts)
  
  log.level = argv.loglevel || argv.l || 'verbose';

  stream
    .on('error', log.error.bind(log, 'dockerize'))
    .on('entry', function (x) { log.verbose('dockerize', 'processing ', x.name) })
    .on('overriding-dockerfile', function (x) { log.info('dockerize', 'overriding existing dockerfile') })
    .on('existing-dockerfile', function (x) { log.info('dockerize', 'using dockerfile found inside the tarball instead of the one provided, use opts.override:true to change that') })
    .pipe(process.stdout);
})()
