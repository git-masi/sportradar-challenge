import { PrismaClient, schedule } from '@prisma/client';
import { Context } from '../index.js';
import { offsetCurrentDate } from '../utils/dates.js';
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

type GetScheduledGames = () => Promise<schedule[]>;

export async function updateNhlStats(
  ctx: Context,
  register: RegisterFn,
  getScheduledGames: GetScheduledGames
) {
  const baseUrl = 'https://statsapi.web.nhl.com';
  const scheduledGames = await getScheduledGames();

  scheduledGames.forEach(({ game_date, game_pk, link, status }) => {
    // If a game is in progress we can't start the cron at the game date because
    // it will be in the past
    const cron =
      status === 'In Progress'
        ? new Date(offsetCurrentDate({ seconds: 5 }))
        : new Date(game_date);

    register({
      name: `NHL Stats Game:${game_pk}`,
      cron,
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

export function getScheduledGames(prisma: PrismaClient) {
  return async () => {
    return await prisma.schedule.findMany({
      where: {
        status: {
          in: ['Scheduled', 'In Progress'],
        },
      },
    });
  };
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
    const gameStates = ['Scheduled', 'In Progress'];
    const data = await fetchJson<GameFeed>(url, { timeout: 0, retry: 0 });
    const {
      gamePk,
      gameData: {
        teams,
        status: { detailedState },
      },
      liveData: {
        plays: { scoringPlays, penaltyPlays, allPlays },
      },
    } = data;

    if (!gameStates.includes(detailedState)) {
      await saveGameStatusFinal(ctx.prisma, gamePk);
      ctx.logger.info(`Game ${gamePk} ended`);
      end();
      return;
    }

    // Get all scoring plays since last run
    const scoringPlaysDiff = getPlayDiff(prevScoringPlays, scoringPlays);
    const scoringPlayValues = getValuesByIndexes(scoringPlaysDiff, allPlays);

    // Get all penalty plays since last run
    const penaltyPlaysDiff = getPlayDiff(prevPenaltyPlays, penaltyPlays);
    const penaltyPlayValues = getValuesByIndexes(penaltyPlaysDiff, allPlays);

    // Get all hit plays since last run
    const hitPlayIndexes = getNewHitPlayIndexes(prevHitPlays, allPlays);
    const hitPlayValues = getValuesByIndexes(hitPlayIndexes, allPlays);

    const allPlayerStats = getAllPlayerStats(
      [...scoringPlayValues, ...penaltyPlayValues, ...hitPlayValues],
      teams,
      gamePk
    );

    // Merge data into a single set of stats per player
    const playerStatsToUpdate = mergePlayerStats(allPlayerStats);

    await savePlayerStats(ctx, playerStatsToUpdate);

    ctx.logger.info(`Continue polling for game: NHL ${gamePk}`);

    setTimeout(async () => {
      await pollGameStats({
        ctx,
        url,
        prevScoringPlays: scoringPlaysDiff,
        prevPenaltyPlays: penaltyPlaysDiff,
        prevHitPlays: hitPlayIndexes,
        end,
      });
    }, 10_000);
  } catch (error) {
    ctx.logger.error(error);
    end();
  }
}

async function savePlayerStats(ctx: Context, playerStats: PlayerStats[]) {
  playerStats.forEach(async (data) => {
    try {
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

      await ctx.prisma.player_stats.upsert({
        where: {
          player_id_game_pk: {
            player_id: data.playerId as number,
            game_pk: data.gamePk,
          },
        },
        update: update,
        create: create,
      });
    } catch (error) {
      ctx.logger.error(
        `Failed to update player stats for player: ${data.playerId}, game: ${data.gamePk}`,
        error
      );
    }
  });
}

async function saveGameStatusFinal(prisma: PrismaClient, gamePk: number) {
  prisma.schedule.update({
    where: {
      league_game_pk: {
        league: 'NHL',
        game_pk: gamePk,
      },
    },
    data: {
      status: 'Final',
    },
  });
}

function getAllPlayerStats(plays: Play[], teams: Teams, gamePk: number) {
  return plays.flatMap(
    ({ players, team: { id: playerTeamId }, result: { penaltyMinutes } }) => {
      const opponentTeamId = getOpponentTeam(playerTeamId, teams);
      // There is room for future optimization here to reduce the number of times
      // we loop over the players array.
      const scoringPlayer = getScoringPlayer(players);
      const penalizedPlayer = getPenalizedPlayer(players);
      const hitter = getHitter(players);
      const assistingPlayers = getAssistingPlayers(players);
      const instigatingPlayers = [];
      const baseStats = {
        playerTeamId,
        opponentTeamId,
        gamePk,
      };

      if (scoringPlayer) {
        instigatingPlayers.push({
          ...baseStats,
          playerId: scoringPlayer.player.id,
          goals: 1,
          points: 1,
          assists: 0,
          hits: 0,
          penaltyMinutes: 0,
        });
      }

      if (penalizedPlayer) {
        instigatingPlayers.push({
          ...baseStats,
          playerId: penalizedPlayer.player.id,
          goals: 0,
          points: 0,
          assists: 0,
          hits: 0,
          penaltyMinutes: penaltyMinutes ?? 0,
        });
      }

      if (hitter) {
        instigatingPlayers.push({
          ...baseStats,
          playerId: hitter.player.id,
          goals: 0,
          points: 0,
          assists: 0,
          hits: 1,
          penaltyMinutes: 0,
        });
      }

      return [
        ...instigatingPlayers,
        ...assistingPlayers.map((player) => ({
          ...baseStats,
          playerId: player.player.id,
          goals: 0,
          points: 1,
          assists: 1,
          hits: 0,
          penaltyMinutes: 0,
        })),
      ];
    }
  );
}

function getNewHitPlayIndexes(prevHitPlays: number[], allPlays: Play[]) {
  if (allPlays.length === 0) {
    return [];
  }

  const idxAfterLastHitPlay = (prevHitPlays[prevHitPlays.length - 1] ?? 0) + 1;
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

function mergePlayerStats(stats: PlayerStats[]) {
  const seen: { [k: string]: any } = {};

  for (let player of stats) {
    if (player.playerId in seen) {
      const { goals, points, assists, hits, penaltyMinutes } =
        seen[player.playerId];
      const newValues = {
        goals: goals + player.goals,
        points: points + player.points,
        assists: assists + player.assists,
        hits: hits + player.assists,
        penaltyMinutes: penaltyMinutes + player.penaltyMinutes,
        ...seen[player.playerId],
      };
      seen[player.playerId] = newValues;
    } else {
      seen[player.playerId] = player;
    }
  }

  return Object.values(seen) as PlayerStats[];
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
