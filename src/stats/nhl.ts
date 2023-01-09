import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { getCurrentDate, soon } from '../utils/dates.js';
import { fetchJson } from '../utils/http.js';
import { RegisterFn } from '../utils/jobs.js';
import { snakeCaseKeys } from '../utils/objects.js';

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

type PlayerStats = {
  gamePk: number;
  playerTeamId: number;
  opponentTeamId: number;
  playerId: number;
  goals: number;
  points: number;
  assists: number;
  hits: number;
  penaltyMinutes: number;
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
          ctx,
          url: `${baseUrl}${link}`,
          prevScoringPlays: [],
          prevPenaltyPlays: [],
          prevHitPlays: [],
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
  ctx: Context;
  url: string;
  prevScoringPlays: number[];
  prevPenaltyPlays: number[];
  prevHitPlays: number[];
  end: () => void;
}) {
  const { url, prevScoringPlays, prevPenaltyPlays, prevHitPlays, ctx, end } =
    config;
  try {
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

    await savePlayerStats(ctx.prisma, playersToBeUpdated);

    setTimeout(async () => {
      await pollGameStats({
        ctx,
        url,
        prevScoringPlays: scoringPlaysDiff,
        prevPenaltyPlays: penaltyPlaysDiff,
        prevHitPlays: [],
        end,
      });
    }, 10_000);
  } catch (error) {
    ctx.logger.error(error);
    end();
  }
}

async function savePlayerStats(
  prisma: PrismaClient,
  playerStats: PlayerStats[]
) {
  playerStats.forEach(async (data) => {
    const create = {
      player_id: data.playerId,
      game_pk: data.gamePk,
      player_team_id: data.playerTeamId,
      opponent_team_id: data.opponentTeamId,
      assists: data.assists,
      goals: data.goals,
      hits: data.hits,
      points: data.points,
      penalty_minutes: data.penaltyMinutes,
    };
    const update = {
      ...(data.assists > 0 && { assists: data.assists }),
      ...(data.goals > 0 && { goals: data.goals }),
      ...(data.hits > 0 && { hits: data.hits }),
      ...(data.points > 0 && { points: data.points }),
      ...(data.penaltyMinutes > 0 && {
        penalty_minutes: data.penaltyMinutes,
      }),
    };

    await prisma.player_stats.upsert({
      where: {
        player_id_game_pk: {
          player_id: data.playerId as number,
          game_pk: data.gamePk,
        },
      },
      update: update,
      create: create,
    });
  });
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
        playerId: scoringPlayer.player.id,
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
          playerId: penalizedPlayer.player.id,
          goals: 0,
          points: 0,
          assists: 0,
          hits: 0,
          penaltyMinutes: penaltyMinutes as number,
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
        playerId: hitter.player.id,
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
  return players.find(
    (player) => player.playerType === 'Scorer'
  ) as PlayerElement;
}

function getAssistingPlayers(players: PlayerElement[]) {
  return players.filter((player) => player.playerType === 'Assist');
}

function getPenalizedPlayer(players: PlayerElement[]) {
  return players.find(
    (player) => player.playerType === 'PenaltyOn'
  ) as PlayerElement;
}

function getHitter(players: PlayerElement[]) {
  return players.find(
    (player) => player.playerType === 'Hitter'
  ) as PlayerElement;
}
