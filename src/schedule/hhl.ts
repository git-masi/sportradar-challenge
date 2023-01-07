import { PrismaClient } from '@prisma/client';
import got from 'got';
import { AppConfig } from '../index.js';
import { JobRequest } from '../utils/jobs.js';

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
  game_date: string;
  game_pk: number;
  link: string;
  status: string;
};

export async function initNhlJob(appConfig: AppConfig): Promise<JobRequest> {
  return {
    cron: '*/5 * * * * *',
    fn: async ({ end }) => {
      try {
        await run(appConfig);
      } catch (error) {
        console.log(error);
      } finally {
        end();
      }
    },
  };
}

async function run(appConfig: AppConfig) {
  const date = new Date().toISOString().replace(/T.*/, '');
  const schedule = await fetchSchedule(appConfig.url, date);
  const games = getGames(schedule);
  const scheduledGames = getScheduledGames(games);
  saveSchedule(scheduledGames, appConfig.prisma);
}

async function saveSchedule(
  scheduledGames: ScheduledGame[],
  prisma: PrismaClient
) {
  await prisma.schedule.createMany({
    data: scheduledGames,
    skipDuplicates: true,
  });
}

function fetchSchedule(url: string, date: string): Promise<Schedule> {
  return got
    .get(`${url}/schedule?date=${date}`, {
      timeout: { request: 20_000 },
      retry: {
        limit: 5,
        errorCodes: [
          'ETIMEDOUT',
          'ECONNRESET',
          'EADDRINUSE',
          'ECONNREFUSED',
          'ENETUNREACH',
          'EAI_AGAIN',
        ],
      },
    })
    .json();
}

function getGames(schedule: Schedule): Game[] {
  return schedule.dates[0].games;
}

function getScheduledGames(games: Game[]) {
  return games
    .filter(({ status: { detailedState } }) => detailedState === 'Scheduled')
    .map(({ gameDate, gamePk, link, status: { detailedState: status } }) => ({
      game_date: gameDate,
      game_pk: gamePk,
      link,
      status,
    }));
}
