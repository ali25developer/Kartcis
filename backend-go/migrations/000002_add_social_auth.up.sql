-- Up Migration

CREATE TABLE social_accounts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_token TEXT,
    provider_refresh_token TEXT,
    provider_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;

-- Down Migration
-- DROP TABLE social_accounts;
-- ALTER TABLE users ALTER COLUMN password SET NOT NULL;
-- ALTER TABLE users DROP COLUMN avatar;
-- ALTER TABLE users DROP COLUMN email_verified_at;
