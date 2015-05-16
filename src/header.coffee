fs = require 'fs'

class Header

    constructor: (@stream) ->
        return @

    parse: (callback) ->
        _STATE_HEADER = 1
        _STATE_FIELDS = 2
        _STATE_FINISHING = 3
        _STATE_DONE = 4
        @state = _STATE_HEADER
        @index = 0
        @fields = []

        doParse = () =>
            ranout = false
            if @state is _STATE_HEADER
                buffer = @stream.read 32
                if buffer is null
                    return
                
                @index = 32
                @type = (buffer.slice 0, 1).toString 'utf-8'
                @dateUpdated = @parseDate (buffer.slice 1, 4)
                @numberOfRecords = @convertBinaryToInteger (buffer.slice 4, 8)
                @start = @convertBinaryToInteger (buffer.slice 8, 10)
                @recordLength = @convertBinaryToInteger (buffer.slice 10, 12)

                @state = _STATE_FIELDS

            if @state is _STATE_FIELDS
                fieldHeaderSize = 32
                while buffer = @stream.read fieldHeaderSize
                    @index += fieldHeaderSize
                    if buffer[0] == 0x0D
                        @state = _STATE_FINISHING
                        break
                    @fields.push @parseFieldSubRecord buffer
            
            if @state is _STATE_FINISHING
                delta = @start - @index
                console.log "Delta", delta, "Start", @start
                if delta > 0
                    # Read up to start
                    buffer = @stream.read delta
                    if buffer is null
                        return
                else if delta < 0
                    # We read too much, so put some data back on the stream.
                    buffer = buffer.slice delta
                    console.log "Unshift", buffer
                    @stream.unshift buffer
                @state = _STATE_DONE

            if @state is _STATE_DONE
                @stream.removeListener 'readable', doParse
                callback @

        @stream.on 'readable', doParse

    parseDate: (buffer) =>
        console.log @convertBinaryToInteger buffer.slice 0, 1
        year = 1900 + @convertBinaryToInteger buffer.slice 0, 1
        month = (@convertBinaryToInteger buffer.slice 1, 2) - 1
        day = @convertBinaryToInteger buffer.slice 2, 3

        return new Date year, month, day

    parseFieldSubRecord: (buffer) =>
        header = {
            name: ((buffer.slice 0, 11).toString 'utf-8').replace /[\u0000]+$/, ''
            type: (buffer.slice 11, 12).toString 'utf-8'
            displacement: @convertBinaryToInteger buffer.slice 12, 16
            length: @convertBinaryToInteger buffer.slice 16, 17
            decimalPlaces: @convertBinaryToInteger buffer.slice 17, 18
        }

    convertBinaryToInteger: (buffer) ->
        return buffer.readInt32LE 0, true

module.exports = Header
