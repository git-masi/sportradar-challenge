#!/bin/bash

psql -U ${POSTGRES_USER} <<-END
    CREATE SCHEMA IF NOT EXISTS ${API_SCHEMA};
    CREATE SCHEMA IF NOT EXISTS ${APP_SCHEMA};

    CREATE ROLE ${DB_ANON_ROLE} NOLOGIN;
    CREATE ROLE ${POSTGREST_ROLE} NOINHERIT LOGIN PASSWORD '${POSTGREST_PASSWORD}';
    CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}';

    GRANT USAGE ON SCHEMA ${API_SCHEMA} TO ${DB_ANON_ROLE};
    ALTER DEFAULT PRIVILEGES IN SCHEMA ${API_SCHEMA} GRANT SELECT ON TABLES TO ${DB_ANON_ROLE};
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA ${API_SCHEMA} TO ${DB_ANON_ROLE};
    GRANT SELECT ON ALL TABLES IN SCHEMA ${API_SCHEMA} TO ${DB_ANON_ROLE};
    GRANT ${DB_ANON_ROLE} TO ${POSTGREST_ROLE};
END
