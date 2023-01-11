import { describe, expect, it, vi } from 'vitest';
import { mockLogger } from '../mocks/winston.js';
import { updateNhlTeams } from './nhl.js';

describe('Update NHL teams', () => {
  it('should save NHL teams', async () => {
    const teams = [
      { id: 1, name: 'Tampa Typists' },
      { id: 2, name: 'Calgary Coders' },
    ];
    const teamsResponse = { teams };
    const mockFetchTeams = vi.fn(async () => teamsResponse);
    const mockSaveTeams = vi.fn(async () => {});

    const config = {
      logger: mockLogger,
      fetchTeams: mockFetchTeams,
      saveTeams: mockSaveTeams,
    };

    await updateNhlTeams(config);

    expect(mockSaveTeams).toHaveBeenLastCalledWith(teams);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
