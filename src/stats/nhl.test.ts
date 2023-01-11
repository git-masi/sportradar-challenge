import { describe, expect, it, vi } from 'vitest';
import { Context } from '../index.js';
import { mockLogger } from '../mocks/winston.js';
import { offsetCurrentDate } from '../utils/dates.js';
import { updateNhlStats } from './nhl.js';

describe('Update NHL teams', () => {
  it('should schedule game stats jobs', async () => {
    const mockPrisma = vi.mock('@prisma/client');
    const gameDate = offsetCurrentDate({ seconds: 1 });
    const gameState = 'Scheduled';
    const scheduledGames = [
      {
        league: 'NHL',
        // The gamePk has significance so there should be a better way to mock this
        game_pk: 9001,
        game_date: new Date(gameDate),
        link: '',
        status: gameState,
      },
    ];
    const mockGetScheduledGames = vi.fn(async () => scheduledGames);
    const mockRegister = vi.fn(() => {});
    const mockContext = {
      logger: mockLogger,
      // In the current test `mockPrisma` won't be called we just need it to
      // satisfy the function signatured
      prisma: mockPrisma,
    } as unknown as Context;

    await updateNhlStats(mockContext, mockRegister, mockGetScheduledGames);

    expect(mockRegister).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should NOT schedule game stats jobs', async () => {
    const mockPrisma = vi.mock('@prisma/client');
    const scheduledGames: any[] = [];
    const mockGetScheduledGames = vi.fn(async () => scheduledGames);
    const mockRegister = vi.fn(() => {});
    const mockContext = {
      logger: mockLogger,
      // In the current test `mockPrisma` won't be called we just need it to
      // satisfy the function signatured
      prisma: mockPrisma,
    } as unknown as Context;

    await updateNhlStats(mockContext, mockRegister, mockGetScheduledGames);

    expect(mockRegister).not.toHaveBeenCalled();
  });
});
