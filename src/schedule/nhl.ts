import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { fetchJson } from '../utils/http.js';

type Schedule = {
  copyright: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalMatches: number;
  metaData: MetaData;
  wait: number;
  dates: ScheduleDate[];
};

type ScheduleDate = {
  date: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalMatches: number;
  games: Game[];
  events: unknown[];
  matches: unknown[];
};

type Game = {
  gamePk: number;
  link: string;
  gameType: string;
  season: string;
  gameDate: string;
  status: Status;
  teams: ScheduledTeams;
  venue: Venue;
  content: Content;
};

type Content = {
  link: string;
};

type Status = {
  abstractGameState: AbstractGameState;
  codedGameState: string;
  detailedState: DetailedState;
  statusCode: string;
  startTimeTBD: boolean;
};

type DetailedState = 'Scheduled' | 'In Progress' | 'Final';

type AbstractGameState = 'Preview' | 'Live' | 'Final';

type ScheduledTeams = {
  away: ScheduledTeam;
  home: ScheduledTeam;
};

type ScheduledTeam = {
  leagueRecord: LeagueRecord;
  score: number;
  team: Team;
};

type LeagueRecord = {
  wins: number;
  losses: number;
  ot: number;
  type: Type;
};

type Type = 'league';

type Team = {
  id: number;
  name: string;
  link: string;
};

type Venue = {
  id: number;
  name: string;
  link: string;
};

type MetaData = {
  timeStamp: string;
};

type ScheduledGame = {
  league: string;
  game_date: string;
  game_pk: number;
  link: string;
  status: string;
};

export async function updateNhlSchedule(ctx: Context) {
  const schedule = await fetchSchedule();
  const games = getGames(schedule);
  const scheduledGames = getScheduledGames(games);

  await saveScheduledGames(ctx.prisma, scheduledGames);

  ctx.logger.info('Successfully saved scheduled NHL games');
}

async function saveScheduledGames(
  prisma: PrismaClient,
  scheduledGames: ScheduledGame[]
) {
  await prisma.schedule.createMany({
    data: scheduledGames,
    skipDuplicates: true,
  });
}

function fetchSchedule(): Promise<Schedule> {
  return fetchJson('https://statsapi.web.nhl.com/api/v1/schedule', {
    timeout: 20_000,
    retry: 5,
  });
}

function getGames(schedule: Schedule): Game[] {
  return schedule.dates[0].games;
}

function getScheduledGames(games: Game[]): ScheduledGame[] {
  const league = 'NHL';
  const gameStates = ['Scheduled', 'In Progress'];
  return games
    .filter(({ status: { detailedState } }) =>
      gameStates.includes(detailedState)
    )
    .map(({ gameDate, gamePk, link, status: { detailedState: status } }) => ({
      league: league,
      game_date: gameDate,
      game_pk: gamePk,
      link,
      status,
    }));
}
