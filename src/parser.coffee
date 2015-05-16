{EventEmitter} = require 'events'
Header = require './header'
fs = require 'fs'
stream = require 'stream'

class Parser extends EventEmitter

    constructor: (@filename) ->

    parse: =>
        @emit 'start', @

        if @filename instanceof stream.Stream
            stream = @filename
        else
            stream = fs.createReadStream @filename

        stream.once 'end', () =>
                console.log "DONE"
                @emit 'end'

        @header = new Header stream
        @header.parse (err) =>
            @emit 'header', @header

            sequenceNumber = 0
            
            @readBuf = =>
                if @paused

                    @emit 'paused'
                    
                    return
                console.log "ReadBuf"
                while !@done and (buffer = stream.read @header.recordLength)
                    if buffer[0] == 0x1A
                        @done = true
                    else if buffer.length == @header.recordLength
                        @emit 'record', @parseRecord ++sequenceNumber, buffer

            stream.on 'readable',@readBuf
            console.log "HERE"

            do @readBuf

            return @

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
        value = (buffer.toString 'utf-8').replace /^\x20+|\x20+$/g, ''

        if field.type is 'N' then value = parseInt value, 10

        return value

     pause: =>
        
        @paused = true
        
    resume: =>
    
        @paused = false

        @emit 'resuming'
        
        do @readBuf

module.exports = Parser
