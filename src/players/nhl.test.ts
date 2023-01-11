import { describe, expect, it, vi } from 'vitest';
import { mockLogger } from '../mocks/winston.js';
import { updateNhlPlayers } from './nhl.js';

describe('Update NHL players', () => {
  it('should save NHL players', async () => {
    const teamId = 99;
    const personId = 42;
    const personName = 'The Dude';
    const personAge = 28;
    const personNumber = 33;
    const position = 'Goalie';
    const roster = {
      teams: [
        {
          id: teamId,
          roster: {
            roster: [
              {
                person: {
                  id: personId,
                },
              },
            ],
          },
        },
      ],
    };
    const people = {
      people: [
        {
          id: personId,
          fullName: personName,
          primaryNumber: personNumber,
          currentAge: personAge,
          currentTeam: { id: teamId },
          primaryPosition: { name: position },
        },
      ],
    };
    const players = [
      {
        id: personId,
        name: personName,
        age: personAge,
        team_id: teamId,
        position: position,
        number: personNumber,
      },
    ];
    const mockFetchRoster = vi.fn(async () => roster);
    const mockFetchPeople = vi.fn(async () => [people]);
    const mockSavePlayers = vi.fn(async () => {});
    const config = {
      logger: mockLogger,
      fetchRoster: mockFetchRoster,
      fetchPeople: mockFetchPeople,
      savePlayers: mockSavePlayers,
    };

    await updateNhlPlayers(config);

    expect(mockSavePlayers).toHaveBeenCalledWith(players);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
