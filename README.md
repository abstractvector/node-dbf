DBF Parser
==========

This is an event-based dBase file parser for very efficiently reading data from `*.dbf` files.

  [![Build Status][travis-image]][travis-url]
  [![Node Version][node-image]][node-url]
  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]

The codebase is written in ES6 JavaScript but compiled in the npm module to pure JavaScript.

To get started, simply install the module using npm:

```bash
$ npm install node-dbf
```

and then `import` it:

```js
import Parser from 'node-dbf';
```

# Classes

There are two classes - the `Parser` and the `Header`. The `Parser` is the most interesting class.

## Parser

This class is the main interface for reading data from dBase files. It extends `EventEmitter` and its output is via events.

### new Parser(path, options)

* path `String` The full path to the DBF file to parse
* options `Object` An object containing options for the parser.

The support options are:

* encoding `String` The character encoding to use (default = `utf-8`)

Creates a new Parser and attaches it to the specified filename.

    import Parser from 'node-dbf';
    
    let parser = new Parser('/path/to/my/dbase/file.dbf');

### parser.on(event, listener)

* event `String` The event name to listen for (see below for details)
* listener `Function` The callback to bind to the event

This method is inherited from the `EventEmitter` class.

### parser.parse()

Call this method once you have bound to the events you are interested in. Although it returns the parser object (for chaining), all the dBase data is outputted via events.

    parser.parse();

### Event: 'start'

* parser `Parser` The parser object

This event is emitted as soon as the `parser.parse()` method has been invoked.

### Event: 'header'

* header `Header` The header object as parsed from the dBase file

This event is emitted once the header has been parsed from the dBase file

### Event: 'record'

* record `Object` An object representing the record that has been found

The record object will have a key for each field within the record, named after the field. It is trimmed (leading and trailing) of any blank characters (dBase files use \x20 for padding).

In addition to the fields, the object contains two special keys:

* @sequenceNumber `Number` indicates the order in which it was extracted
* @deleted `Boolean` whether this record has been deleted or not

This object may look like:
```json
{
    "@sequenceNumber": 123,
    "@deleted": false,
    "firstName": "John",
    "lastName": "Smith"
}
```

### Event: 'end'

* parser `Parser` The parser object

This event is fired once the dBase parsing is complete and there are no more records remaining.

## Usage

The following code example illustrates a very simple usage for this module:

```js
import Parser from 'node-dbf';

let parser = new Parser('/path/to/my/dbase/file.dbf');

parser.on('start', (p) => {
    console.log('dBase file parsing has started');
});

parser.on('header', (h) => {
    console.log('dBase file header has been parsed');
});

parser.on('record', (record) => {
    console.log('Name: ' + record.firstName + ' ' + record.lastName); // Name: John Smith
});

parser.on('end', (p) => {
    console.log('Finished parsing the dBase file');
});

parser.parse();
```

# Command-Line Interface (CLI)

The parser also supports a command-line interface (CLI) for converting DBF files to CSV. You can invoke it as follows:

```bash
$ node-dbf convert /path/to/file.dbf
```

This will write the converted rows to `stdout` and metadata about the process (e.g. number of rows, etc) to `stderr`. This allows you to write stdout directly to an output file, for example:

```bash
$ node-dbf convert file.dbf > file.csv
```

For more help information on using the command line options, use the integrated help:

```bash
$ node-dbf help
```

# Tests

Tests are written in Mocha using Chai BDD for the expectations. Data on San Francisco zip codes was used as a reference test file - downloaded from [SF OpenData](https://data.sfgov.org/) and included in the `./test/fixtures/bayarea_zipcodes.dbf` file within the repository.

# To Do

* Add more tests
* Add support for field types other than Character and Numeric
* Use `fs.readStream` instead of `fs.readFile` for increased performance
* Add a CLI interface for converting to CSV, etc
* Improve error handling to emit an error event

[travis-image]:https://travis-ci.org/abstractvector/node-dbf.svg?branch=master
[travis-url]: https://travis-ci.org/abstractvector/node-dbf
[node-image]: https://img.shields.io/node/v/node-dbf.svg
[node-url]: https://npmjs.org/package/node-dbf
[npm-image]: https://img.shields.io/npm/v/node-dbf.svg
[npm-url]: https://npmjs.org/package/node-dbf
[downloads-image]: https://img.shields.io/npm/dt/node-dbf.svg
[downloads-url]: https://npmjs.org/package/node-dbf
