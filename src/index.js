/**
 * NoPg database dump and restore utility
 * Copyright (c) 2014 Sendanor <info@sendanor.com>
 * Copyright (c) 2014 Jaakko-Heikki Heusala <jheusala@iki.fi>
 */

var _Q = require('q');
var debug = require('nor-debug');
var argv = require('minimist')(process.argv.slice(2));
var nopg = require('nor-nopg');

var PGCONFIG = process.env.PGCONFIG || argv.pgconfig;

return _Q.fcall(function() {

	debug.assert(PGCONFIG).ignore(undefined).is('string');
	if(!PGCONFIG) {
		throw new TypeError("PGCONFIG or --pgconfig not defined");
	}

	var _db;
	var dump = {
		'stats': {}
	};

	// Search types and documents
	return _Q(nopg.start(PGCONFIG)
	    .searchTypes()
	    .search()()
	    .then(function fetch_types(db) {
		_db = db;

		var types = db.fetch();
		debug.assert(types).is('array');
		dump.stats.types = types.length;

		var docs = db.fetch();
		debug.assert(docs).is('array');
		dump.stats.documents = docs.length;

		// Types
		dump.types = types.map(function(type) {
			type = JSON.parse(JSON.stringify(type));
			if(type && type.$events) {
				delete type.$events;
			}
			if(type && type._events) {
				delete type._events;
			}
			if(type && type._maxListeners) {
				delete type._maxListeners;
			}
			if(type && type.$meta) {
				delete type.$meta;
			}
			return type;
		});

		// Documents
		dump.documents = docs.map(function(doc) {
			doc = JSON.parse(JSON.stringify(doc));
			if(doc && doc.$events) {
				delete doc.$events;
			}
			if(doc && doc.$content) {
				delete doc.$content;
			}
			return doc;
		});

		return db;

	// Rollback etc
	}).then(function(db) {
		return db.rollback();
	}).fail(function(err) {
		return _db.rollback().fin(function() {
			return err;
		});
	})).then(function() {
		return dump;
	});

// JSON convertion
}).then(function(dump) {
	console.log(JSON.stringify(dump, null, 2));
	process.exit(0);

// Error handling
}).fail(function(err) {
	debug.error(err);
	process.exit(1);
}).done();

/* EOF */
