var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


function Header(filename) {
    this.filename = filename;
    this.parseFieldSubRecord = this.parseFieldSubRecord.bind(this);
    this.parseDate = this.parseDate.bind(this);

    return this;
}

Header.prototype.parse = function(callback) {
    var self = this;
    return fs.readFile(this.filename, function(err, buffer) {
        var i;
        if (err) {
            throw err;
        }
        self.type = (buffer.slice(0, 1)).toString('utf-8');
        self.dateUpdated = self.parseDate(buffer.slice(1, 4));
        self.numberOfRecords = self.convertBinaryToInteger(buffer.slice(4, 8));
        self.start = self.convertBinaryToInteger(buffer.slice(8, 10));
        self.recordLength = self.convertBinaryToInteger(buffer.slice(10, 12));
        self.fields = ((function() {
            var _i, _ref, _results;
            _results = [];
            for (i = _i = 32, _ref = this.start - 32; _i <= _ref; i = _i += 32) {
                _results.push(buffer.slice(i, i + 32));
            }
            return _results;
        }).call(self)).map(self.parseFieldSubRecord);
        return callback(self);
    });
};

Header.prototype.parseDate = function(buffer) {
    var day, month, year;
    console.log(this.convertBinaryToInteger(buffer.slice(0, 1)));
    year = 1900 + this.convertBinaryToInteger(buffer.slice(0, 1));
    month = (this.convertBinaryToInteger(buffer.slice(1, 2))) - 1;
    day = this.convertBinaryToInteger(buffer.slice(2, 3));
    return new Date(year, month, day);
};

Header.prototype.parseFieldSubRecord = function(buffer) {
    var header = {
        name: ((buffer.slice(0, 11)).toString('utf-8')).replace(/[\u0000]+$/, ''),
        type: (buffer.slice(11, 12)).toString('utf-8'),
        displacement: this.convertBinaryToInteger(buffer.slice(12, 16)),
        length: this.convertBinaryToInteger(buffer.slice(16, 17)),
        decimalPlaces: this.convertBinaryToInteger(buffer.slice(17, 18))
    };

    return header
};

Header.prototype.convertBinaryToInteger = function(buffer) {
    return buffer.readInt32LE(0, true);
};




function Parser(filename) {
    this.filename = filename;
    this.parseField = this.parseField.bind(this);
    this.parseRecord = this.parseRecord.bind(this);
    this.parse = this.parse.bind(this);
}

util.inherits(Parser, EventEmitter);

Parser.prototype.parse = function() {
    var self = this;
    this.emit('start', this);
    this.header = new Header(this.filename);
    this.header.parse(function(err) {
        var sequenceNumber;
        self.emit('header', self.header);
        sequenceNumber = 0;
        return fs.readFile(self.filename, function(err, buffer) {
            var loc;
            if (err) {
                throw err;
            }
            loc = self.header.start;
            while (loc < (self.header.start + self.header.numberOfRecords * self.header.recordLength) && loc < buffer.length) {
                self.emit('record', self.parseRecord(++sequenceNumber, buffer.slice(loc, loc += self.header.recordLength)));
            }
            return self.emit('end', self);
        });
    });
    return this;
};

Parser.prototype.parseRecord = function(sequenceNumber, buffer) {
    var field, loc, record, _fn, _i, _len, _ref,
        self = this;
    record = {
        '@sequenceNumber': sequenceNumber,
        '@deleted': (buffer.slice(0, 1))[0] !== 32
    };
    loc = 1;
    _ref = this.header.fields;
    _fn = function(field) {
        var value = record[field.name] = self.parseField(field, buffer.slice(loc, loc += field.length));

        return value;
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        _fn(field);
    }
    return record;
};

Parser.prototype.parseField = function(field, buffer) {
    var value = buffer.toString('utf-8').replace(/^\x20+|\x20+$/g, '');

    if (field.type === 'N') {
        value = Number(value);
    }
    return value;
};

module.exports = Parser;