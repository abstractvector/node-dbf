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
            
            loc = @header.start
            bufLoc = @header.start
            overflow = null
            @paused = false
            
            stream = fs.createReadStream @filename
            
            @readBuf = =>
            
                if @paused
                    @emit 'paused'
                    return
                
                while buffer = stream.read()
                    if bufLoc isnt @header.start then bufLoc = 0
                    if overflow isnt null then buffer = overflow + buffer

                    while loc < (@header.start + @header.numberOfRecords * @header.recordLength) && (bufLoc + @header.recordLength) <= buffer.length
                        @emit 'record', @parseRecord ++sequenceNumber, buffer.slice bufLoc, bufLoc += @header.recordLength

                    loc += bufLoc
                    if bufLoc < buffer.length then overflow = buffer.slice bufLoc, buffer.length else overflow = null

                    return @
                    
            stream.on 'readable',@readBuf            
            stream.on 'end', () =>
                @emit 'end'

        return @
        
    pause: =>        
        @paused = true
        
    resume: =>    
        @paused = false        
        @emit 'resuming'        
        do @readBuf

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

        if field.type is 'N'
            value = parseInt value, 10
        else if field.type is 'F'
            value = if value == +value and value == (value | 0) then parseInt(value, 10) else parseFloat(value, 10)

        return value

module.exports = Parser
