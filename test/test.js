#!/usr/bin/env node
"use strict";
var fs = require('fs');
var DB = require(__dirname + '/../lib/parser');

var db = new DB(fs.createReadStream(process.argv[2]));

db.on('header', function(x) {
	console.warn("Header", x);
});
db.on('record', console.warn);
db.on('end', function() { console.warn("Done!"); });

db.parse();
