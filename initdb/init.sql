-- Init enums
CREATE TYPE league_abrv AS ENUM ('NHL');
CREATE TYPE detailed_game_status AS ENUM ('Scheduled', 'In Progress', 'Final');
CREATE TYPE player_type AS ENUM(
	'Scorer',
	'Assist',
	'Goalie',
	'PenaltyOn',
	'DrewBy'
);
-- Init tables
CREATE TABLE IF NOT EXISTS api.teams (
	id INT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api.players (
	id INT PRIMARY KEY NOT NULL,
	team_id INT NOT NULL REFERENCES api.teams(id),
	name TEXT NOT NULL,
	age SMALLINT NOT NULL,
	number SMALLINT NOT NULL,
	position TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api.player_stats (
	player_id INT NOT NULL REFERENCES api.players(id),
	game_pk INT NOT NULL,
	player_team_id INT NOT NULL REFERENCES api.teams(id),
	opponent_team_id INT NOT NULL REFERENCES api.teams(id),
	assists SMALLINT NOT NULL,
	goals SMALLINT NOT NULL,
	hits SMALLINT NOT NULL,
	points SMALLINT NOT NULL,
	penalty_minutes SMALLINT NOT NULL,
	PRIMARY KEY(player_id, game_pk)
);
CREATE TABLE IF NOT EXISTS api.schedule (
	-- Ideally we would want this to be of type `league_abrv` but prisma could not
	-- introspect the composite key correctly. We can enforce this in application code.
	-- This is an area for more research.
	league TEXT NOT NULL,
	game_pk INT NOT NULL,
	game_date TIMESTAMPTZ NOT NULL,
	link TEXT NOT NULL,
	status TEXT NOT NULL,
	PRIMARY KEY(league, game_pk)
);
-- Init indexes
CREATE INDEX app_schedule_game_date ON api.schedule(status);
-- Init the app role with all privileges
GRANT USAGE ON SCHEMA api TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO app;
GRANT ALL ON ALL TABLES IN SCHEMA api TO app;
GRANT USAGE ON SCHEMA app TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO app;
GRANT ALL ON ALL TABLES IN SCHEMA app TO app;
-- Notify PostgREST of changes
NOTIFY pgrst,
'reload config';