#!/usr/bin/env node

var dockerify = require('../');

dockerify.targz(process.stdin, { strip: 1 })
  .pipe(process.stdout);
