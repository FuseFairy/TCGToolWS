DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    last_login_time INTEGER
);

DROP TABLE IF EXISTS pending_registrations;
CREATE TABLE pending_registrations (
    email TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

DROP TABLE IF EXISTS password_resets;
CREATE TABLE password_resets (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);