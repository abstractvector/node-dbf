{EventEmitter} = require 'events'
Header = require './header'
fs = require 'fs'

class Parser extends EventEmitter

    constructor: (@filename, @options = {}) ->
        @encoding = @options?.encoding || 'utf-8'
        @encoder = @options?.encoder || @getValueString
        @readStreamOptions = @options?.readStreamOptions

    parse: =>
        @emit 'start', @

        @header = new Header @filename, @encoding
        @header.parse (err) =>

            @emit 'header', @header

            sequenceNumber = 0
            loc = 0
            bufLoc = @header.start
            overflow = null
            @paused = false
            
            stream = fs.createReadStream @filename, @readStreamOptions
            
            @readBuf = =>
            
                if @paused
                    @emit 'paused'
                    return
                
                while buffer = stream.read()
                    if overflow isnt null then buffer = Buffer.concat [overflow, buffer]
                    
                    while loc < (@header.start + @header.numberOfRecords * @header.recordLength) && (bufLoc + @header.recordLength) <= buffer.length
                        @emit 'record', @parseRecord ++sequenceNumber, buffer.slice bufLoc, bufLoc += @header.recordLength
                    
                    if bufLoc < buffer.length
                      overflow = buffer.slice bufLoc, buffer.length 
                      loc += bufLoc
                      bufLoc = 0
                    else 
                      overflow = null
                      bufLoc -=  buffer.length
                      loc += buffer.length
                    

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
        
    getValueString: (buffer, encoding) =>
         return (buffer.toString encoding).trim()

    parseField: (field, buffer) =>
        value = @encoder buffer, @encoding

        if field.type is 'N'
            value = parseInt value, 10
        else if field.type is 'F'
            value = if value == +value and value == (value | 0) then parseInt(value, 10) else parseFloat(value, 10)

        return value

module.exports = Parser
