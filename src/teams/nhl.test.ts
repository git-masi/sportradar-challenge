import winston from 'winston';
import { updateNhlTeams } from './nhl.js';

describe('Update NHL teams', () => {
  const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  });
  const mockLogger = jest.spyOn(logger, 'info');

  it('should save NHL teams', async () => {
    const teams = [
      { id: 1, name: 'Tampa Typists' },
      { id: 2, name: 'Calgary Coders' },
    ];
    const teamsResponse = { teams };
    const mockSaveTeams = jest.fn(async () => {});
    const mockFetchTeams = jest.fn(async () => teamsResponse);

    const config = {
      logger,
      fetchTeams: mockFetchTeams,
      saveTeams: mockSaveTeams,
    };

    await updateNhlTeams(config);

    expect(mockSaveTeams).toHaveBeenLastCalledWith(teams);
    expect(mockLogger).toHaveBeenCalled();
  });
});
