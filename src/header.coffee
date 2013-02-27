fs = require 'fs'

class Header

    constructor: (@filename) ->
        return @

    parse: (callback) ->
        fs.readFile @filename, (err, buffer) =>
            throw err if err

            @type = (buffer.slice 0, 1).toString 'utf-8'
            @dateUpdated = @parseDate (buffer.slice 1, 4)
            @numberOfRecords = @convertBinaryToInteger (buffer.slice 4, 8)
            @start = @convertBinaryToInteger (buffer.slice 8, 10)
            @recordLength = @convertBinaryToInteger (buffer.slice 10, 12)

            @fields = (buffer.slice i, i+32 for i in [32 .. @start - 32] by 32).map @parseFieldSubRecord

            callback @

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