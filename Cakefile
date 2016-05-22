fs = require 'fs'

{inspect} = require 'util'
{exec} = require 'child_process'

build = (callback) ->
  coffee = exec 'coffee -c -o lib src'
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    print data.toString()
  coffee.on 'exit', (code) ->
    callback?() if code is 0

task 'build', 'Build lib/ from src/', ->
  build()
