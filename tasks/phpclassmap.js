/*
 * grunt-phpclassmap
 * https://github.com/maikelvanmaurik/grunt-phpclassmap
 *
 * Copyright (c) 2014 Maikel van Maurik
 * Licensed under the MIT license.
 */

'use strict';
var os = require('os'),
	_ = require('underscore'),
	_s = require('underscore.string');

var engine = require('php-parser');

module.exports = function (grunt) {
	// initialize a new parser instance
	var parser = new engine({
		parser: {
			extractDoc: false,
			php7: true
		},
		ast: {
			withPositions: false
		}
	});

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	grunt.registerMultiTask('phpclassmap', 'Generate PHP classmaps', function () {

		var cp = require('child_process'),
			done = this.async(),
			path = require('path'),
			util = require('util'),
			fs = require('fs'),
			handlebars = require('handlebars'),
			dateformat = require('dateformat'),
			log = grunt.log;

		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			quote_path: true,
			basedir: path.resolve('.'),
			dest: null,
			template: null,
			map: null,
			filter: null,
			sort: null,
			render: function(items, cb) {
				fs.readFile(options.template, function(err, template) {
					if (err) throw err;

					if(!(typeof template == 'string')) {
						template = template.toString();
					}

					// Compile the template
					var compiled = handlebars.compile(template);

					cb(compiled({quote_path: options.quote_path, items: items, date: dateformat(new Date(), "isoDateTime")}));
				});
			}
		}, this.data);

		handlebars.registerHelper("foreach",function(arr,options) {
			if(options.inverse && !arr.length)
				return options.inverse(this);

			return arr.map(function(item,index) {
				item.$index = index;
				item.$first = index === 0;
				item.$last  = index === arr.length-1;
				return options.fn(item);
			}).join('');
		});

		if(!options.template) {
			options.template = path.resolve( __dirname, '..', 'templates', 'default.tpl' );
		}

		if (!options['dest']) {
			grunt.log.error('No destination given');
			done(false);
		}

        function checkTokens( data, initial = [] ){
            if ( 'object' === typeof data ) {
                return data.reduce((memo, current) => {
                    if ( current.kind && current.kind.length > 0 ) {
                        if ( -1 !== [ 'namespace', 'class', 'interface', 'trait'].indexOf( current.kind ) ) {
                            const name = current.name;
                            let sanitizedName;
                            if ( 'string' === typeof name ) {
                                sanitizedName = current.name.replace(/\\{2}/gm, "\\");
                            } else if ( 'object' === typeof name ) {
                                sanitizedName = current.name.name.replace(/\\{2}/gm, "\\");
                            }

                            if ( sanitizedName ) {
                                memo.push({
                                    kind: current.kind.toLowerCase(),
                                    name: sanitizedName,
                                })
                            }
                        }

                        if ( current.children && current.children.length > 0 ) {
                            memo = checkTokens( current.children, memo );
                        }

                        if ( current.body && current.body && current.body.children ) {
                            memo = checkTokens( current.body.children, memo );
                        }
                    }

                    return memo;
                }, initial);
            }

            return false;
        }

        var files = [];
        var basedir = path.resolve(options['basedir']);
        var entries = [];

        this.files.forEach(function (f) {
            // Warn on and remove invalid source files (if nonull was set).
            var file = path.resolve(f.src.join(process.cwd() || '', f.src));
            if (!grunt.file.exists(file)) {
                grunt.log.warn('Source file "' + file + '" not found.');
                return;
            } else {
                let content = grunt.file.read( file, { encoding: "UTF-8" } );
                let parsed =  parser.parseCode(content);

                let className = false;
                let classFound = checkTokens(parsed.children);

                if ( classFound.length > 0 ) {
                    let namespace = '';
                    for (let index = 0; index < classFound.length; index++) {
                        const item = classFound[index];

                        switch( item.kind ) {
                            case "namespace":
                                namespace = item.name;
                                break;
                            case "class":
                            case "interface":
                            case "trait":
                                entries.push({
                                    type: item.kind,
                                    name: namespace ? namespace + "\\" + item.name : item.name,
                                    absolute_path: file.replace(/\\/g, '/'),
                                    relative_path: path.relative(basedir, file.replace(/\\/g, '/')),
                                });
                                break;
                        }
                    }
                }
            }
        });

        if(typeof options['filter'] == 'function') {
            entries = entries.filter(options['filter']);
        }

        if(typeof options['map'] == 'function') {
            entries = entries.map(options['map']);
        }

        if(typeof options.sort == 'function') {
            entries.sort(options.sort);
        } else {
            entries.sort();
        }

        options['render'].call(this, entries, function(src) {
            grunt.file.write(options['dest'], src);
            done();
        });

	});
};
