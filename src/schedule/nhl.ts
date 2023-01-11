import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { Context } from '../index.js';
import { fetchJson } from '../utils/http.js';

type Schedule = {
  dates: ScheduleDate[];
};

type ScheduleDate = {
  games: Game[];
};

type Game = {
  gamePk: number;
  link: string;
  gameDate: string;
  status: Status;
};

type Status = {
  detailedState: DetailedState;
};

type DetailedState = 'Scheduled' | 'In Progress' | 'Final';

type ScheduledGame = {
  league: string;
  game_date: string;
  game_pk: number;
  link: string;
  status: string;
};

export interface UpdateNhlScheduleConfig {
  logger: Logger;
  fetchSchedule: () => Promise<Schedule>;
  saveScheduledGames: (scheduledGames: ScheduledGame[]) => Promise<void>;
}

export async function updateNhlSchedule(config: UpdateNhlScheduleConfig) {
  const schedule = await config.fetchSchedule();
  const games = getGames(schedule);
  const scheduledGames = getScheduledGames(games);

  await config.saveScheduledGames(scheduledGames);

  config.logger.info('Successfully saved scheduled NHL games');
}

export function createUpdateNhlScheduleConfig(ctx: Context) {
  return {
    logger: ctx.logger,
    fetchSchedule,
    saveScheduledGames: (scheduledGames: ScheduledGame[]) =>
      saveScheduledGames(ctx.prisma, scheduledGames),
  };
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
