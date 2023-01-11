import { describe, expect, it, vi } from 'vitest';
import { mockLogger } from '../mocks/winston.js';
import { updateNhlSchedule, UpdateNhlScheduleConfig } from './nhl.js';

describe('Update NHL daily schedule', () => {
  it('should save NHL daily schedule', async () => {
    const now = new Date().toISOString();
    // The gamePk has actual significance so this is not the ideal way to mock it
    const gamePk = 9001;
    const link = '/some/link';
    const gameState = 'Scheduled';
    const game = {
      gamePk,
      link,
      gameDate: now,
      status: {
        detailedState: gameState,
      },
    };
    const games = [game];
    const schedule = {
      dates: [
        {
          games: games,
        },
      ],
    };
    const scheduledGames = [
      {
        league: 'NHL',
        game_date: now,
        game_pk: gamePk,
        link,
        status: gameState,
      },
    ];
    const mockFetchSchedule = vi.fn(async () => schedule);
    const saveScheduledGames = vi.fn(async () => {});
    const config = {
      logger: mockLogger,
      fetchSchedule: mockFetchSchedule,
      saveScheduledGames: saveScheduledGames,
    };

    await updateNhlSchedule(config as unknown as UpdateNhlScheduleConfig);

    expect(saveScheduledGames).toHaveBeenLastCalledWith(scheduledGames);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
