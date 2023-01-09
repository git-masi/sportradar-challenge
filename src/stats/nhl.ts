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
  playerType:
    | 'Scorer'
    | 'Assist'
    | 'Goalie'
    | 'PenaltyOn'
    | 'DrewBy'
    | 'Hitter';
};

type Player = {
  id: number;
};

type Result = {
  event: 'Goal' | 'Hit' | 'Penalty';
  penaltyMinutes?: number;
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
      // cron: new Date(game_date),
      cron: new Date(soon()),
      fn: ({ end }) =>
        pollGameStats({
          url: `${baseUrl}${link}`,
          prevScoringPlays: [],
          prevPenaltyPlays: [],
          prevHitPlays: [],
          prisma: ctx.prisma,
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
  prevHitPlays: number[];
  prisma: PrismaClient;
  end: () => void;
}) {
  const { url, prevScoringPlays, prevPenaltyPlays, prevHitPlays, prisma, end } =
    config;
  const data = await fetchJson<GameFeed>(url, { timeout: 0, retry: 0 });
  const gameStates = ['Scheduled', 'In Progress'];

  if (!gameStates.includes(data.gameData.status.detailedState)) {
    // update game state
    end();
    return;
  }

  const {
    gamePk,
    gameData: { teams },
    liveData: {
      plays: { scoringPlays, penaltyPlays, allPlays },
    },
  } = data;

  const scoringPlaysDiff = getPlayDiff(prevScoringPlays, scoringPlays);
  const scoringPlayValues = getValuesByIndexes(scoringPlaysDiff, allPlays);
  const scoringPlayers = getScoringPlayers(scoringPlayValues, teams);

  const penaltyPlaysDiff = getPlayDiff(prevPenaltyPlays, penaltyPlays);
  const penaltyPlayValues = getValuesByIndexes(penaltyPlaysDiff, allPlays);
  const penalizedPlayers = getPenalizedPlayers(penaltyPlayValues, teams);

  const hitPlayIndexes = getNewHitPlayIndexes(prevHitPlays, allPlays);
  const hitPlayValues = getValuesByIndexes(hitPlayIndexes, allPlays);
  const hitters = getHitters(hitPlayValues, teams);

  const playersToBeUpdated = [
    ...scoringPlayers,
    ...penalizedPlayers,
    ...hitters,
  ].map((data) => ({ ...data, gamePk }));

  console.log(playersToBeUpdated);

  setTimeout(async () => {
    await pollGameStats({
      url,
      prevScoringPlays: scoringPlaysDiff,
      prevPenaltyPlays: penaltyPlaysDiff,
      prevHitPlays: [],
      prisma,
      end,
    });
  }, 10_000);
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
        goals: 1,
        points: 1,
        assists: 0,
        hits: 0,
        penaltyMinutes: 0,
      },
      ...assistingPlayers.map((player) => ({
        playerTeamId,
        opponentTeamId,
        playerId: player.player.id,
        goals: 0,
        points: 1,
        assists: 1,
        hits: 0,
        penaltyMinutes: 0,
      })),
    ];
  });
}

function getPenalizedPlayers(plays: Play[], teams: Teams) {
  return plays.flatMap(
    ({ players, team: { id: playerTeamId }, result: { penaltyMinutes } }) => {
      const penalizedPlayer = getPenalizedPlayer(players);
      const opponentTeamId = getOpponentTeam(playerTeamId, teams);

      return [
        {
          playerTeamId,
          opponentTeamId,
          playerId: penalizedPlayer?.player.id,
          goals: 0,
          points: 0,
          assists: 0,
          hits: 0,
          penaltyMinutes,
        },
      ];
    }
  );
}

function getHitters(plays: Play[], teams: Teams) {
  return plays.flatMap(({ players, team: { id: playerTeamId } }) => {
    const hitter = getHitter(players);
    const opponentTeamId = getOpponentTeam(playerTeamId, teams);

    return [
      {
        playerTeamId,
        opponentTeamId,
        playerId: hitter?.player.id,
        goals: 0,
        points: 0,
        assists: 0,
        hits: 1,
        penaltyMinutes: 0,
      },
    ];
  });
}

function getNewHitPlayIndexes(prevHitPlays: number[], allPlays: Play[]) {
  if (allPlays.length === 0) {
    return [];
  }

  const idxAfterLastHitPlay = (prevHitPlays.at(-1) ?? 0) + 1;
  const newHitPlayIndexes = [];

  for (let i = allPlays.length - 1; i >= idxAfterLastHitPlay; i--) {
    const { result } = allPlays[i];

    if (result.event !== 'Hit') {
      continue;
    }

    newHitPlayIndexes.push(i);
  }

  return newHitPlayIndexes;
}

function getPlayDiff(prev: number[], curr: number[]) {
  return curr.slice(prev.length);
}

function getValuesByIndexes<T>(indexes: number[], arr: T[]) {
  return indexes.map((idx) => arr[idx]);
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

function getPenalizedPlayer(players: PlayerElement[]) {
  return players.find((player) => player.playerType === 'PenaltyOn');
}

function getHitter(players: PlayerElement[]) {
  return players.find((player) => player.playerType === 'Hitter');
}
