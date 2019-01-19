import fs from 'fs';

export default class Header {

    constructor(filename, encoding) {
        this.filename = filename;
        this.encoding = encoding || 'utf-8';
    }

    parse(callback) {
        fs.open(this.filename, 'r', (err, fd) => {
            if (err) throw err;

            const startBuffer = Buffer.alloc(2);

            fs.read(fd, startBuffer, 0, 2, 8, (err, bytesRead, buffer) => {
                if (err) throw err;

                const start = this.convertBinaryToInteger(buffer);

                const headerBuffer = Buffer.alloc(start);

                fs.read(fd, headerBuffer, 0, start, 0, (err, bytesRead, buffer) => {
                    if (err) throw err;

                    this.type = buffer.slice(0, 1).toString(this.encoding);
                    this.dateUpdated = this.parseDate(buffer.slice(1, 4));
                    this.numberOfRecords = this.convertBinaryToInteger(buffer.slice(4, 8));
                    this.start = this.convertBinaryToInteger(buffer.slice(8, 10));
                    this.recordLength = this.convertBinaryToInteger(buffer.slice(10, 12));

                    const result = [];
                    for (let i = 32, end = this.start - 32; i <= end; i += 32) {
                        result.push(buffer.slice(i, i+32));
                    }

                    this.fields = result.map(this.parseFieldSubRecord.bind(this));

                    callback(this);

                    fs.close(fd, err => {
                        if (err) throw err;
                    })
                })
            })
        })
    }

    parseDate(buffer) {
        const year = 1900 + this.convertBinaryToInteger(buffer.slice(0, 1));
        const month = (this.convertBinaryToInteger(buffer.slice(1, 2))) - 1;
        const day = this.convertBinaryToInteger(buffer.slice(2, 3));

        return new Date(year, month, day);
    }

    parseFieldSubRecord(buffer) {
        return {
            name: (buffer.slice(0, 11)).toString(this.encoding).replace(/[\u0000]+$/, ''),
            type: (buffer.slice(11, 12)).toString(this.encoding),
            displacement: this.convertBinaryToInteger(buffer.slice(12, 16)),
            length: this.convertBinaryToInteger(buffer.slice(16, 17)),
            decimalPlaces: this.convertBinaryToInteger(buffer.slice(17, 18))
        };
    }

    convertBinaryToInteger(buffer) {
        return buffer.readIntLE(0, buffer.length);
    }
}