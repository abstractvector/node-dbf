{EventEmitter} = require 'events'
Header = require './header'
fs = require 'fs'

class Parser extends EventEmitter

    constructor: (@filename) ->

    parse: =>
        @emit 'start', @

        @header = new Header @filename
        @header.parse (err) =>

            @emit 'header', @header

            sequenceNumber = 0

            fs.readFile @filename, (err, buffer) =>
                throw err if err

                loc = @header.start
                while loc < (@header.start + @header.numberOfRecords * @header.recordLength) and loc < buffer.length
                    @emit 'record', @parseRecord ++sequenceNumber, buffer.slice loc, loc += @header.recordLength

                @emit 'end', @

        return @

    parseRecord: (sequenceNumber, buffer) =>
        record = {
            '@sequenceNumber': sequenceNumber
            '@deleted': (buffer.slice 0, 1)[0] isnt 32
        }

        loc = 1
        for field in @header.fields
            do (field) =>
                record[field.name] = @parseField field, buffer.slice loc, loc += field.length

        return record

    parseField: (field, buffer) =>
        value = buffer.toString().replace /^\x20+|\x20+$/g, ''

        if field.type is 'N' then value = parseFloat value

        return value

module.exports = Parser
