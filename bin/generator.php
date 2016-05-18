<?php
/*
 * grunt-phpclassmap
 * https://github.com/maikelvanmaurik/grunt-phpclassmap
 *
 * Copyright (c) 2014 Maikel van Maurik
 * Licensed under the MIT license.
 */
require_once dirname(__FILE__) . '/inc/functions.php';

array_shift($argv);

$options = [
	'files' => '',
    'out' => '',
    'filemap' => ''
];

$errors = $warnings = $notices = $files = [];

$result = [
	'files' => &$files,
	'errors' => &$errors,
	'warnings' => &$warnings,
	'notices' => &$notices
];

set_error_handler('handle_exception');
set_exception_handler('handle_exception');

try {

	foreach($argv as $arg) {
		parse_arg($arg, $options);
	}

    // Create array of the files
    if(!empty($options['files'])) {
        $options['files'] = explode(',', $options['files']);
    }


    if (!empty($options['filemap'])) {
        $map = file_get_contents($options['filemap']);

        if(empty($map)) {
            throw new Exception("Unable to read filemap " . $options['filemap']);
        }

        $options['files'] = array_merge(
            is_array($options['files']) ? $options['files'] : [],
            json_decode($map)
        );
    }
	
	if(empty($options['files'])) {
		throw new Exception('No files found', E_WARNING);
	}

	foreach($options['files'] as $file) {
		$files[$file] = parse_file($file);
	}
} catch(Exception $e) {
	$type = exception_code_string($e->getCode()).'s';
	array_push($$type, $e->getMessage());
}

if(isset($options['out'])) {
    file_put_contents($options['out'], json_encode($result));   
} else {
    print json_encode($result);
}