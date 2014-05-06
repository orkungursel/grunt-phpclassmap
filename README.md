# grunt-phpclassmap

> Generate PHP classmaps

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-phpclassmap --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-phpclassmap');
```

## The "phpclassmap" task

### Overview
In your project's Gruntfile, add a section named `phpclassmap` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  phpclassmap: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.basedir
Type: `String`
Default value: .

Base directory from which to create the relative paths to class files, defaults to `process.cwd`.

#### options.phpbin
Type: `String`
Default value: 'php'

Path to the php executable

#### options.dest
Type: `String`
Default value: none

Where to write the classmap file to.

#### options.filter
Type: `Function`

Function which filters the entry inside the destination classmap file. The function recieves a item object which in turn has the following properties:

* absolute_path (absolute path to the object)
* relative_path (relative path to the object, which is the absolute_path without the basedir option)
* name (name of the object)
* type (class, interface, trait)

### Usage Examples

#### Filter items to use a defined constant

In this example, we use override the format function in order to use a defined constant inside the resulting classmap

```js
grunt.initConfig({
    phpclassmap: {
        options: {
            dest: './classmap.php',
            filter: function(item) {
                item.relative_path = 'DEFINED_BASE_PATH_CONSTANT . "' + item.relative_path + '"';
                return item;
            }
        },
        files  : {
            src   : [ 'classes/**/*.php' ],
            expand: true
        }
    },
});
```

#### Change the default handlebars template

grunt-phpclassmap uses handlebars to render the classmap file, you can specify a custom handlebars template, like so:

```js
grunt.initConfig({
    phpclassmap: {
        options: {
            dest: './classmap.php',
            template: 'my-classmap-template.tpl'
        },
        files  : {
            src   : [ 'classes/**/*.php' ],
            expand: true
        }
    },
});
```

currenty the compiled template recieves data in the form:

```js
{
    items: Array,
    date: String
}
```

#### Override the render functionality

besides changing the template it's also possible to define you own render function, like so:

```js
grunt.initConfig({
    phpclassmap: {
        options: {
            dest: './classmap.php',
            render: function(objects, cb) {
                var content = '<?php\n' +
                    'return array(' +
                    '%items%' +
                    ');';
                // Build up the item array
                var items = [];
                for(var i=0; i<objects.length;i++) {
                    items.push('"' + objects[i].name + '" => "' + objects[i].absolute_path + '"');
                }
                cb(content.replace('%items%', items.join(',')));
            }
        },
        files  : {
            src   : [ 'classes/**/*.php' ],
            expand: true
        }
    },
});
```

**IMPORTANT**: When you override the render method be sure to call to callback which is provided to the function, as this is the function which writes to results to the classmap.

#### Overriding the filter and render

In this example you can see how you can mix the filter and render function to do some custom stuff.
Note that the filter allows you to add additional data, which is written in de render function. This could have also been
done by providing a custom template.

```js
grunt.initConfig({
    phpclassmap: {
        options: {
            filter: function (item) {
                item.rewritten_path = your_rewrite_function(item);
                return item;
            },
            render: function(objects, cb) {
                    var content = '<?php\n' +
                                'return array(' +
                                '%items%' +
                                ');';
                    // Build up the item array
                    var items = [];
                    for(var i=0; i<objects.length;i++) {
                        items.push('"' + objects[i].name + '" => "' + objects[i].rewritten_path) + '"';
                    }
            cb(content.replace('%items%', items.join(',')));
        }
```

## Release History


### Version 0.0.1

Initial release

### Version 0.0.2

Fix: Added handlebars as a required dependency

### Version 0.0.3

Fix: Added dateformat as a required dependency