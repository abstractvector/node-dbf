import fs from 'fs';
import { EventEmitter } from 'events';

import Header from './header';

export default class Parser extends EventEmitter {

    constructor(filename, options) {
        super();

        this.filename = filename;
        this.options = options || {};
        this.encoding = this.options.encoding || 'utf-8';
    }

    parse() {
        this.emit('start', this);

        this.header = new Header(this.filename, this.encoding);
        this.header.parse(err => {

            this.emit('header', this.header);

            let sequenceNumber = 0;
            
            let loc = this.header.start;
            let bufLoc = this.header.start;
            let overflow = null;
            this.paused = false;
            
            const stream = fs.createReadStream(this.filename);
            
            this.readBuf = () => {
            
                let buffer;
                if (this.paused) {
                    this.emit('paused');
                    return;
                }
                
                while ((buffer = stream.read())) {
                    if (bufLoc !== this.header.start) { bufLoc = 0; }
                    if (overflow !== null) { buffer = overflow + buffer; }

                    while ((loc < (this.header.start + (this.header.numberOfRecords * this.header.recordLength))) && ((bufLoc + this.header.recordLength) <= buffer.length)) {
                        this.emit('record', this.parseRecord(++sequenceNumber, buffer.slice(bufLoc, (bufLoc += this.header.recordLength))));
                    }

                    loc += bufLoc;
                    if (bufLoc < buffer.length) { overflow = buffer.slice(bufLoc, buffer.length); } else { overflow = null; }

                    return this;
                }
            };
                    
            stream.on('readable',this.readBuf);            
            return stream.on('end', () => {
                return this.emit('end');
            });
        });

        return this;
    }
        
    pause() {        
        return this.paused = true;
    }
        
    resume() {    
        this.paused = false;        
        this.emit('resuming');        
        return (this.readBuf)();
    }

    parseRecord(sequenceNumber, buffer) {
        const record = {
            '@sequenceNumber': sequenceNumber,
            '@deleted': (buffer.slice(0, 1))[0] !== 32
        };

        let loc = 1;
        for (let field of Array.from(this.header.fields)) {
            (field => {
                return record[field.name] = this.parseField(field, buffer.slice(loc, (loc += field.length)));
            })(field);
        }

        return record;
    }

    parseField(field, buffer) {
        let value = (buffer.toString(this.encoding)).trim();

        if (field.type === 'N') {
            value = parseInt(value, 10);
        } else if (field.type === 'F') {
            value = (value === +value) && (value === (value | 0)) ? parseInt(value, 10) : parseFloat(value, 10);
        }

        return value;
    }
}