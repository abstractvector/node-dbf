#!/usr/bin/env node

var program = require('commander');
var pkg = require('../package.json');

program
  .command('convert [file]', 'convert a DBF file')
  .version(pkg.version)
  .usage('[options] <file>')
  .parse(process.argv);
