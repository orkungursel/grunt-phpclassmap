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

module.exports = function (grunt) {
    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('phpclassmap', 'Generate PHP classmaps', function () {

        var cp = require('child_process'),
            done = this.async(),
            path = require('path'),
            util = require('util'),
            bindir = path.resolve(__dirname, '..', 'bin'),
            fs = require('fs'),
            handlebars = require('handlebars'),
            dateformat = require('dateformat'),
            log = grunt.log;

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            quote_path: true,
            basedir: path.resolve('.'),
            dest: null,
            phpbin: 'php',
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
        });

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


        var check_php = function(cb) {
            // Executes the 'php -v' command and only redirect errors to the console
            var childProcess = cp.exec(options['phpbin'] + ' -v', function (error, stdout, stderr) {
                // On success error will be null
                if (error !== null) {
                    grunt.log.error(error);
                }
            });

            childProcess.on('exit', function (code) {

                if (code > 0) {

                    grunt.log.error(util.format('The \'php -v\' command returned the error code \'%d\' !', code));
                    grunt.log.error('Please check that PHP CLI is available.');

                    return done(false);

                }

                // OK, PHP is available on command line.
                cb();

            }.bind(this));
        }


        check_php(function () {

            var files = [];
            this.files.forEach(function (f) {
                // Warn on and remove invalid source files (if nonull was set).
                var filepath = path.resolve(f.src.join(process.cwd() || '', f.src));
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return;
                } else {
                    files.push(filepath);
                }
            });
            
            var jsonFile = _s(os.tmpdir()).rtrim('/\\').value() + '/grunt-php-classmap-classes.json';

            var command = options['phpbin'] + ' "' + path.resolve(bindir, 'generator.php') + '" --files="' + files.join(',') + '" --out="' + jsonFile + '"';

            log.writeln(command);
            
            cp.exec(command, function (error, stdout, stderr) {
                // On success error will be null
                if (error !== null) {
                    grunt.log.error('ERROR OCCURED: ' + error);
                }

                var response = JSON.parse(fs.readFileSync(jsonFile));
                
                // var response = JSON.parse(stdout);

				var errors = response.errors;
				var warnings = response.warnings;
				var notices = response.notices;

				if( errors.length > 1) {
					log.writeln('Errors during classmap generation:'.red);
					for(var i = 0; i < errors.length; i++) {
						log.writeln(("\t" + errors[i]).red);
					}
				} else if(errors.length == 1) {
					log.writeln(('Error during classmap generation: ' + errors[0]).red);
				}
				if( warnings.length > 1) {
					log.writeln('Warnings during classmap generation:'.yellow);
					for(var i = 0; i < warnings.length; i++) {
						log.writeln(("\t" + warnings[i]).yellow);
					}
				} else if(warnings.length == 1) {
					log.writeln(('Warning during classmap generation: ' + warnings[0]).yellow);
				}
				if( notices.length > 1) {
					log.writeln('Notices during classmap generation:'.blue);
					for(var i = 0; i < notices.length; i++) {
						log.writeln(("\t" + notices[i]).blue);
					}
				} else if(notices.length == 1) {
					log.writeln(('Notice during classmap generation: ' + notices[0]).blue);
				}

				var files = response.files;

                var entries = [];

                // Iterate over the classes, interfaces and traits we got back from the php cli script
                for (var i in files) {
                    if (files.hasOwnProperty(i)) {
                        var items = files[i];
                        for (var j in items) {
                            if (items.hasOwnProperty(j)) {
                                var item = files[i][j];
                                item['absolute_path'] = i.replace(/\\/g, '/');
                                item['relative_path'] = item['absolute_path'].substr(path.resolve(options['basedir']).length + 1).replace(/\\/g, '/');
                                entries.push(item);
                            }
                        }
                    }
                }


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

        }.bind(this));
    });
};
