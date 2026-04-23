<?php
// Front Controller / Router

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// For PHP built-in server: route static assets directly
if (php_sapi_name() === 'cli-server') {
    if (is_file(__DIR__ . $path)) {
        return false; // serve the requested resource as-is
    }
}

// Basic Routing
switch ($path) {
    case '/':
    case '/login':
        require 'views/login.php';
        break;
    case '/dashboard':
        require 'views/dashboard.php';
        break;
    case '/profile':
        require 'views/profile.php';
        break;
    default:
        http_response_code(404);
        echo "404 Not Found";
        break;
}
