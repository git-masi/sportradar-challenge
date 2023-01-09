import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { getCurrentDate, soon } from '../utils/dates.js';
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
  away: Team;
  home: Team;
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

type About = {
  eventIdx: number;
  eventID: number;
  period: number;
  periodType: string;
  ordinalNum: string;
  periodTime: string;
  periodTimeRemaining: string;
  dateTime: Date;
  goals: Goals;
};

type Goals = {
  away: number;
  home: number;
};

type PlayerElement = {
  player: Player;
  playerType: 'Scorer' | 'Assist' | 'Goalie' | 'PenaltyOn' | 'DrewBy';
};

type Player = {
  id: number;
};

type Result = {
  event: 'Goal' | 'Hit' | 'Penalty';
};

type Team = {
  id: number;
};

export async function updateNhlStats(ctx: Context, register: RegisterFn) {
  const baseUrl = 'https://statsapi.web.nhl.com';
  const scheduledGames = await getScheduledGames(ctx.prisma);

  // TODO: Delete after testing
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
      invokeImmediately: false,
    });
  });

  ctx.logger.info('Successfully registered game/player stats jobs');
}

async function getScheduledGames(prisma: PrismaClient) {
  return await prisma.schedule.findMany({
    where: {
      status: {
        in: ['Scheduled', 'In Progress'],
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
    // update game state
    end();
    return;
  }

  const { teams } = data.gameData;
  const { scoringPlays, penaltyPlays, allPlays } = data.liveData.plays;

  const sp = getPlayDiff(prevScoringPlays, scoringPlays);
  const pp = getPlayDiff(prevPenaltyPlays, penaltyPlays);
  const spvals = getValsByIndexes(sp, allPlays);
  const ppvals = getValsByIndexes(pp, allPlays);

  const scoringPlayers = getScoringPlayers(spvals, teams);

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

function getScoringPlayers(plays: Play[], teams: Teams) {
  return plays.flatMap(({ players, team: { id: playerTeamId } }) => {
    const scoringPlayer = getScoringPlayer(players);
    const assistingPlayers = getAssistingPlayers(players);
    const opponentTeamId = getOpponentTeam(playerTeamId, teams);

    return [
      {
        playerTeamId,
        opponentTeamId,
        playerId: scoringPlayer?.player.id,
        playerType: scoringPlayer?.playerType,
      },
      ...assistingPlayers.map((player) => ({
        playerTeamId,
        opponentTeamId,
        playerId: player.player.id,
        playerType: player.playerType,
      })),
    ];
  });
}

function getOpponentTeam(playerTeamId: number, teams: Teams) {
  const {
    away: { id: awayTeamId },
    home: { id: homeTeamId },
  } = teams;
  return playerTeamId === homeTeamId ? awayTeamId : homeTeamId;
}

function getScoringPlayer(players: PlayerElement[]) {
  return players.find((player) => player.playerType === 'Scorer');
}

function getAssistingPlayers(players: PlayerElement[]) {
  return players.filter((player) => player.playerType === 'Assist');
}
