'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.php_classmap_generator = {
  setUp: function(done) {
    this.classMapContent = grunt.file.read('tmp/classmap.php');
    done();
  },
  classMapTests: function(test) {
    test.equal(/^\W+"Foo\\Bar"?\W+=>?\W+"test\/fixtures\/class-foo\.php"\,?$/m.test(this.classMapContent), true);
    test.equal(/^\W+"Test"?\W+=>?\W+"test\/fixtures\/class-test\.php"\,?$/m.test(this.classMapContent), true);
    test.equal(/^\W+"Bar\\Baz"?\W+=>/m.test(this.classMapContent), true);
    test.equal(/^\W+"Bar\\Loo"?\W+=>/m.test(this.classMapContent), true);
    test.equal(/^\W+"add_filter|init"?\W+=>/m.test(this.classMapContent), false, "Add filter or init should not be in the classmap.");
    test.done();
  }
};
