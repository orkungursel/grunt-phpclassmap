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

$options = array(
	'files' => ''
);

$errors = $warnings = $notices = $files = array();

$result = array(
	'files' => &$files,
	'errors' => &$errors,
	'warnings' => &$warnings,
	'notices' => &$notices
);

set_error_handler('handle_exception');
set_exception_handler('handle_exception');

try {
	foreach($argv as $arg) {
		parse_arg($arg, $options);
	}

	if(!isset($options['files']) || empty($options['files'])) {
		throw new Exception('No files found', E_WARNING);
	}

	// Create array of the files
	$options['files'] = explode(',', $options['files']);

	foreach($options['files'] as $file) {
		$files[$file] = parse_file($file);
	}
} catch(Exception $e) {
	$type = exception_code_string($e->getCode()).'s';
	array_push($$type, $e->getMessage());
}

print json_encode($result);