<?php
namespace Bar;

use Foo\Bar;

/**
 * Foo class.
 */
class Baz {
    public function __construct()
    {
        add_filter( "foobar", [ Bar::class, 'test' ] );
        add_filter( "foobar", [ Bar::class, 'test2' ] );
        add_filter( "foobar", [ Bar::class, 'test3' ] );
    }

    public function init() {

    }
}

/**
 * Foo class.
 */
class Loo {
    public function __construct()
    {
        add_filter( "foobar", [ Bar::class, 'test' ] );
        add_filter( "foobar", [ Bar::class, 'test2' ] );
        add_filter( "foobar", [ Bar::class, 'test3' ] );
    }

    public function init() {

    }
}