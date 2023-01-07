-- Init tables
CREATE TABLE IF NOT EXISTS api.teams (
	id BIGINT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api.players (
	id BIGINT PRIMARY KEY NOT NULL,
	team_id BIGINT NOT NULL REFERENCES api.teams(id),
	name TEXT NOT NULL,
	age SMALLINT NOT NULL,
	number SMALLINT NOT NULL,
	position TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api.player_stats (
	player_id BIGINT NOT NULL REFERENCES api.players(id),
	game_pk BIGINT NOT NULL,
	player_team_id BIGINT NOT NULL REFERENCES api.teams(id),
	opponent_team_id BIGINT NOT NULL REFERENCES api.teams(id),
	assists SMALLINT NOT NULL,
	goals SMALLINT NOT NULL,
	hits SMALLINT NOT NULL,
	points SMALLINT NOT NULL,
	penality_minutes SMALLINT NOT NULL,
	PRIMARY KEY(player_id, game_pk)
);
CREATE TABLE IF NOT EXISTS app.schedule (
	leage TEXT NOT NULL,
	game_pk BIGINT NOT NULL,
	game_date TIMESTAMPTZ NOT NULL,
	link TEXT NOT NULL,
	status TEXT NOT NULL,
	PRIMARY KEY(leage, game_pk)
);
-- Init the app role with all privileges
GRANT USAGE ON SCHEMA api TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO app;
GRANT ALL ON ALL TABLES IN SCHEMA api TO app;
GRANT USAGE ON SCHEMA app TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO app;
GRANT ALL ON ALL TABLES IN SCHEMA app TO app;