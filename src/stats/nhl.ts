import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { getCurrentDate } from '../utils/dates.js';
import { fetchJson } from '../utils/http.js';
import { RegisterFn } from '../utils/jobs.js';

type GameFeed = {
  gamePk: number;
  gameData: GameData;
  liveData: LiveData;
};

type GameData = {
  datetime: Datetime;
  status: Status;
  teams: Teams;
  players: {};
};

type Datetime = {
  dateTime: Date | string;
};

type Status = {
  detailedState: string;
};

type Teams = {
  away: {};
  home: {};
};

type LiveData = {
  plays: Plays;
};

type Plays = {
  allPlays: Play[];
  scoringPlays: number[];
  penaltyPlays: number[];
};

type Play = {
  players: PlayerElement[];
  result: Result;
  about: About;
  team: Team;
};

export interface About {
  eventIdx: number;
  eventID: number;
  period: number;
  periodType: string;
  ordinalNum: string;
  periodTime: string;
  periodTimeRemaining: string;
  dateTime: Date;
  goals: Goals;
}

export interface Goals {
  away: number;
  home: number;
}

export interface PlayerElement {
  player: Player;
  playerType: 'Scorer' | 'Assist' | 'Goalie' | 'PenaltyOn' | 'DrewBy';
}

export interface Player {
  id: number;
}

export interface Result {
  event: 'Goal' | 'Hit' | 'Penalty';
}

export interface Team {
  id: number;
}

export async function updateNhlStats(ctx: Context, register: RegisterFn) {
  const baseUrl = 'https://statsapi.web.nhl.com';
  const scheduledGames = await getScheduledGames(ctx.prisma);

  console.log(scheduledGames.map((game) => game.status));

  const test = true;
  if (test) return;

  scheduledGames.forEach(({ game_date, game_pk, link }) => {
    register({
      name: `NHL Stats Game:${Number(game_pk)}`,
      cron: new Date(game_date),
      fn: ({ end }) =>
        pollGameStats({
          url: `${baseUrl}${link}`,
          prevScoringPlays: [],
          prevPenaltyPlays: [],
          end,
        }),
    });
  });

  ctx.logger.info('Successfully registered game/player stats jobs');
}

async function getScheduledGames(prisma: PrismaClient) {
  return await prisma.schedule.findMany({
    where: {
      game_date: {
        gt: getCurrentDate({ iso: true }),
      },
    },
  });
}

async function pollGameStats(config: {
  url: string;
  prevScoringPlays: number[];
  prevPenaltyPlays: number[];
  end: () => void;
}) {
  const { url, prevScoringPlays, prevPenaltyPlays, end } = config;
  const data = await fetchJson<GameFeed>(url, { timeout: 0, retry: 0 });
  const gameStates = ['Scheduled', 'In Progress'];
  if (!gameStates.includes(data.gameData.status.detailedState)) {
    end();
    return;
  }

  const { scoringPlays, penaltyPlays, allPlays } = data.liveData.plays;

  const sp = getPlayDiff(prevScoringPlays, scoringPlays);
  const pp = getPlayDiff(prevPenaltyPlays, penaltyPlays);
  const spvals = getValsByIndexes(sp, allPlays);
  const ppvals = getValsByIndexes(pp, allPlays);

  console.log(spvals);
  console.log(ppvals);

  setTimeout(async () => {
    await pollGameStats({
      url,
      prevScoringPlays: sp,
      prevPenaltyPlays: pp,
      end,
    });
  }, 10_000);
}

function getPlayDiff(prev: number[], curr: number[]) {
  return curr.slice(prev.length);
}

function getValsByIndexes<T>(indexes: number[], arr: T[]) {
  return indexes.map((idx) => arr[idx]);
}
