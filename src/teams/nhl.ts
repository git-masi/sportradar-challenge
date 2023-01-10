import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { Context } from '../index.js';
import { fetchJson } from '../utils/http.js';

export type NhlTeamsResponse = {
  teams: Team[];
};

export type Team = {
  id: number;
  name: string;
};

export interface UpdateNhlTeamsConfig {
  logger: Logger;
  fetchTeams: () => Promise<NhlTeamsResponse>;
  saveTeams: (teams: Team[]) => Promise<void>;
}

export async function updateNhlTeams(config: UpdateNhlTeamsConfig) {
  const res = await config.fetchTeams();
  const teams = getTeams(res);

  await config.saveTeams(teams);

  config.logger.info('Successfully saved NHL teams');
}

export function createUpdateNhlTeamsConfig(ctx: Context) {
  return {
    logger: ctx.logger,
    fetchTeams,
    saveTeams: (teams: Team[]) => saveTeams(ctx.prisma, teams),
  };
}

function fetchTeams(): Promise<NhlTeamsResponse> {
  return fetchJson<NhlTeamsResponse>(
    'https://statsapi.web.nhl.com/api/v1/teams',
    {
      timeout: 20_000,
      retry: 5,
    }
  );
}

async function saveTeams(prisma: PrismaClient, teams: Team[]) {
  await prisma.teams.createMany({
    data: teams,
    skipDuplicates: true,
  });
}

function getTeams(res: NhlTeamsResponse) {
  return res.teams.map(({ id, name }) => ({ id, name }));
}
