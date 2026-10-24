<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'YOUR_DATABASE_NAME',
    'db_user' => 'YOUR_DATABASE_USER',
    'db_password' => 'YOUR_DATABASE_PASSWORD',
    // Generate with: php -r 'echo password_hash("your-new-password", PASSWORD_DEFAULT), PHP_EOL;'
    'admin_password_hash' => 'REPLACE_WITH_PASSWORD_HASH',
    // Create an OAuth 2.0 Web application in Google Cloud. Keep the secret only
    // in this server-side file; never add it to Git or the browser.
    'google_client_id' => 'YOUR_GOOGLE_CLIENT_ID',
    'google_client_secret' => 'YOUR_GOOGLE_CLIENT_SECRET',
    'google_admin_email' => 'iliyapolikarpov@gmail.com',
];
