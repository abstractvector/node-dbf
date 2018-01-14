import { EventEmitter } from 'events';
import { expect } from 'chai';

import Parser from '../lib/parser';

describe('Parser', function() {

  describe('The class itself', function() {
    it('can be constructed', function () {
      expect(Parser).to.be.a('function');
    });

    it('is called Parser', function() {
      expect(Parser.name).to.equal('Parser');
    });

    it('extends EventEmitter', function() {
      expect(Parser.EventEmitter).to.be.a('function');
      expect(Parser.EventEmitter.name).to.equal('EventEmitter');
    });
  });

  describe('Object instantiation', function () {
    it('accepts a filename to parse', function() {
      let parser = new Parser('/path/to/a/dbf/file');

      expect(parser).to.be.an.instanceof(Parser);
      expect(parser.filename).to.equal('/path/to/a/dbf/file');
    });

    it('does not check if filename exists', function() {
      let parser = new Parser('/path/to/a/file/that/does/not/exist');

      expect(parser).to.be.an.instanceof(Parser);
      expect(parser.filename).to.equal('/path/to/a/file/that/does/not/exist');
    });

    it('does not require a filename', function() {
      let parser = new Parser();

      expect(parser).to.be.an.instanceof(Parser);
      expect(parser.filename).to.equal(undefined);
    });

    it('allows the filename to be modified after instantiation', function() {
      let parser = new Parser('/path/to/file/1');

      expect(parser).to.be.an.instanceof(Parser);
      expect(parser.filename).to.equal('/path/to/file/1');

      parser.filename = '/path/to/file/2';
      expect(parser.filename).to.equal('/path/to/file/2');
    });
  });

  describe('The methods', function() {
    let parser = new Parser('/path/to/a/dbf/file');

    it('has a parse() method', function() {
      expect(parser).to.respondTo('parse');
    });

    it('has an on() method', function() {
      expect(parser).to.respondTo('on');
    });

    it('has a pause() method', function() {
      expect(parser).to.respondTo('resume');
    });

    it('has a resume() method', function() {
      expect(parser).to.respondTo('resume');
    });
  });

  describe('Parsing the SF zip codes', function() {
    let parser = new Parser(__dirname + '/fixtures/bayarea_zipcodes.dbf');
    let header, records = [], events;

    before(function(done) {
      events = {start: undefined, header: undefined, record: undefined, end: undefined};

      parser.on('start', function() {
        events.start = process.hrtime()[1];
      });

      parser.on('header', function(h) {
        header = h;
        events.header = process.hrtime()[1];
      });

      parser.on('record', function(record) {
        records.push(record);
        events.record = process.hrtime()[1];
      });

      parser.on('end', function() {
        events.end = process.hrtime()[1];
        done();
      });

      parser.parse();
    });

    describe('the header', function() {
      it('has 5 fields', function() {
        expect(header.fields).to.have.lengthOf(5);
      });

      it('has a ZIP field', function() {
        expect(header.fields[0]).to.contain.keys('name', 'type', 'displacement', 'length', 'decimalPlaces');
        expect(header.fields[0].name).to.equal('ZIP');
        expect(header.fields[0].type).to.equal('C');
        expect(header.fields[0].displacement).to.equal(0);
        expect(header.fields[0].length).to.equal(5);
        expect(header.fields[0].decimalPlaces).to.equal(0);
      });

      it('has a PO_NAME field', function() {
        expect(header.fields[1]).to.contain.keys('name', 'type', 'displacement', 'length', 'decimalPlaces');
        expect(header.fields[1].name).to.equal('PO_NAME');
        expect(header.fields[1].type).to.equal('C');
        expect(header.fields[1].displacement).to.equal(0);
        expect(header.fields[1].length).to.equal(28);
        expect(header.fields[1].decimalPlaces).to.equal(0);
      });

      it('has a STATE field', function() {
        expect(header.fields[2]).to.contain.keys('name', 'type', 'displacement', 'length', 'decimalPlaces');
        expect(header.fields[2].name).to.equal('STATE');
        expect(header.fields[2].type).to.equal('C');
        expect(header.fields[2].displacement).to.equal(0);
        expect(header.fields[2].length).to.equal(2);
        expect(header.fields[2].decimalPlaces).to.equal(0);
      });

      it('has a Area__ field', function() {
        expect(header.fields[3]).to.contain.keys('name', 'type', 'displacement', 'length', 'decimalPlaces');
        expect(header.fields[3].name).to.equal('Area__');
        expect(header.fields[3].type).to.equal('F');
        expect(header.fields[3].displacement).to.equal(0);
        expect(header.fields[3].length).to.equal(19);
        expect(header.fields[3].decimalPlaces).to.equal(11);
      });

      it('has a Length__ field', function() {
        expect(header.fields[4]).to.contain.keys('name', 'type', 'displacement', 'length', 'decimalPlaces');
        expect(header.fields[4].name).to.equal('Length__');
        expect(header.fields[4].type).to.equal('F');
        expect(header.fields[4].displacement).to.equal(0);
        expect(header.fields[4].length).to.equal(19);
        expect(header.fields[4].decimalPlaces).to.equal(11);
      });
    });

    describe('the records', function() {
      it('there are 187', function() {
        expect(records).to.have.lengthOf(187);
      });

      it('the header says there are 187', function() {
        expect(header.numberOfRecords).to.equal(187);
      });

      it('contain the 94111 zip code', function() {
        let area = records.filter(function(v) { return '94111' === v.ZIP; });

        expect(area).to.be.an('Array');
        expect(area).to.have.lengthOf(1);
        area = area[0];

        expect(area['@sequenceNumber']).to.be.a('Number');
        expect(area['@deleted']).to.equal(false);

        expect(area.ZIP).to.equal('94111');
        expect(area.PO_NAME).to.equal('SAN FRANCISCO');
        expect(area.STATE).to.equal('CA');
        expect(area.Area__).to.be.a('Number').within(0, Number.MAX_VALUE);
        expect(area.Length__).to.be.a('Number').within(0, Number.MAX_VALUE);
      });
    });

    describe('the order the events were emitted', function() {
      it('emitted the start event first', function() {
        expect(events.start).to.be.an('Number');
        expect(events.start).to.be.below(events.header);
        expect(events.start).to.be.below(events.record);
        expect(events.start).to.be.below(events.end);
      });

      it('emitted the header event next', function() {
        expect(events.header).to.be.an('Number');
        expect(events.header).to.be.above(events.start);
        expect(events.header).to.be.below(events.record);
        expect(events.header).to.be.below(events.end);
      });

      it('emitted the record events next', function() {
        expect(events.record).to.be.an('Number');
        expect(events.record).to.be.above(events.start);
        expect(events.record).to.be.above(events.header);
        expect(events.record).to.be.below(events.end);
      });

      it('emitted the end event last', function() {
        expect(events.end).to.be.an('Number');
        expect(events.end).to.be.above(events.start);
        expect(events.end).to.be.above(events.header);
        expect(events.end).to.be.above(events.record);
      });
    });
 
    // check a select number of them
    // check floats
    // check character encoding ???
  });

});
