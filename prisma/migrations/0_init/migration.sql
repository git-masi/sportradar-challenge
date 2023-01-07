-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "api";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateTable
CREATE TABLE "api"."player_stats" (
    "player_id" BIGINT NOT NULL,
    "game_pk" BIGINT NOT NULL,
    "player_team_id" BIGINT NOT NULL,
    "opponent_team_id" BIGINT NOT NULL,
    "assists" SMALLINT NOT NULL,
    "goals" SMALLINT NOT NULL,
    "hits" SMALLINT NOT NULL,
    "points" SMALLINT NOT NULL,
    "penality_minutes" SMALLINT NOT NULL,

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("player_id","game_pk")
);

-- CreateTable
CREATE TABLE "api"."players" (
    "id" BIGINT NOT NULL,
    "team_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "age" SMALLINT NOT NULL,
    "number" SMALLINT NOT NULL,
    "position" TEXT NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api"."teams" (
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."schedule" (
    "leage" TEXT NOT NULL,
    "game_pk" BIGINT NOT NULL,
    "game_date" TIMESTAMPTZ(6) NOT NULL,
    "link" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("leage","game_pk")
);

-- AddForeignKey
ALTER TABLE "api"."player_stats" ADD CONSTRAINT "player_stats_opponent_team_id_fkey" FOREIGN KEY ("opponent_team_id") REFERENCES "api"."teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "api"."player_stats" ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "api"."players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "api"."player_stats" ADD CONSTRAINT "player_stats_player_team_id_fkey" FOREIGN KEY ("player_team_id") REFERENCES "api"."teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "api"."players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "api"."teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

