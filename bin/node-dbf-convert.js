#!/usr/bin/env node
var path = require('path');

var program = require('commander');
var pkg = require('../package.json');

var file;

program
  .command('convert [file]', 'convert a DBF file')
  .version(pkg.version)
  .usage('[options] <file>')
  .option('-f, --format <format>', 'Output format (default = csv)', /^(csv)$/i, 'csv')
  .option('-d, --delimiter <delimiter>', 'Field delimiter (default = ,)', ',')
  .option('-q, --quote <quote>', 'Field value wrapper quote (default = ")', '"')
  .action(function(f) { file = path.resolve(process.cwd(), f); })
  .parse(process.argv);

var delimiter = program.delimiter || ',';
var quote = program.quote || '"';

var wrap = function(t) {
  return [quote, t, quote].join('');
};

var Parser = require('../lib/parser').default;
var fields;

var timeStart = process.hrtime();

var parser = new Parser(file);

parser.on('header', function(header) {
  fields = header.fields.map(function(f) { return f.name; });

  // write the metadata to stderr so it doesn't pollute stdout
  console.error('Found ' + header.numberOfRecords + ' records according to the header');
  console.error('Expecting ' + fields.length + ' fields per record: ' + fields.join(', '));

  console.log(fields.map(wrap).join(delimiter));
});

parser.on('record', function(record) {
  var i, data = [];
  for (i = 0; i < fields.length; i++) {
    data.push(record[fields[i]]);
  }
  console.log(data.map(wrap).join(delimiter));
});

parser.on('end', function() {
  console.error('Completed file conversion in ' + Math.round(process.hrtime(timeStart)[1] / 1e6) / 1e3 + ' seconds');
});

parser.parse();
