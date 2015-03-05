<?php

function handle_exception($err, $msg = null, $file = null, $line = null, $ctx = null ) {
	global $errors, $warnings, $notices;
	if(func_num_args() > 1) {
		$exception = new Exception( $msg, $err );
	} else {
		$exception = $err;
	}

	$type = exception_code_string($exception->getCode()).'s';

	array_push($$type, $exception->getMessage());
}

function exception_code_string($code)
{
	switch($code) {
		case E_WARNING:
		case E_USER_WARNING:
			return 'warning';
		case E_ERROR:
		case E_USER_ERROR:
			return 'error';
		case E_NOTICE:
		case E_USER_NOTICE:
		default:
			return 'notice';
	}
}


/**
 * Parses the given argument and adds it to the options array
 *
 * @param string $arg argument to parse
 * @param array $options array which will recieve the parsed argument
 */
function parse_arg($arg, &$options) {
	if(preg_match('/--(?P<KEY>[a-z]+)=(?P<VALUE>.*)/', $arg, $matches)) {
		if(!array_key_exists($matches['KEY'], $options)) {
			throw new Exception("Invalid option given " . $matches['KEY']);
		} else {
			$options[$matches['KEY']] = $matches['VALUE'];
		}
	}
}



/**
 * Parses the file to retrieve classes, interfaces and traits
 *
 * @param string $file
 * @return array assoc array of items
 */
function parse_file($file) {
	$results = array();
	$classes = $interfaces = $traits = array();
	$saveNamespace = $savedNamespace = null;
	$contents = file_get_contents($file);
	$tokens   = token_get_all($contents);
	$count    = count($tokens);
	$t_trait  = defined('T_TRAIT') ? T_TRAIT : -1; // For preserve PHP 5.3 compatibility
	for ($i = 0; $i < $count; $i++) {
		$token = $tokens[$i];
		if (!is_array($token)) {
			// single character token found; skip
			$i++;
			continue;
		}
		switch ($token[0]) {
			case T_NAMESPACE:
				// Namespace found; grab it for later
				$namespace = '';
				for ($i++; $i < $count; $i++) {
					$token = $tokens[$i];
					if (is_string($token)) {
						if (';' === $token) {
							$saveNamespace = false;
							break;
						}
						if ('{' === $token) {
							$saveNamespace = true;
							break;
						}
						continue;
					}
					list($type, $content, $line) = $token;
					switch ($type) {
						case T_STRING:
						case T_NS_SEPARATOR:
							$namespace .= $content;
							break;
					}
				}
				if ($saveNamespace) {
					$savedNamespace = $namespace;
				}
				break;
			case $t_trait:
			case T_CLASS:
			case T_INTERFACE:
				// Abstract class, class, interface or trait found

				// Get the classname
				for ($i++; $i < $count; $i++) {
					$token = $tokens[$i];
					if (is_string($token)) {
						continue;
					}
					list($type, $content, $line) = $token;
					if (T_STRING == $type) {
						// If a classname was found, set it in the object, and
						// return boolean true (found)
						if (!isset($namespace) || null === $namespace) {
							if (isset($saveNamespace) && $saveNamespace) {
								$namespace = $savedNamespace;
							} else {
								$namespace = null;
							}

						}
						$class = (null === $namespace) ? $content : $namespace . '\\' . $content;
						$results[] = array(
							'type' => 'class',
							'name' => $class,
							'absolute_path' => $file
						);

						$namespace = null;
						break;
					}
				}
				break;
			default:
				break;
		}
	}
	return $results;
}