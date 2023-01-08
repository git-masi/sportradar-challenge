import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { fetchJson } from '../utils/http.js';

type TeamsResponse = {
  teams: Team[];
};

type Team = {
  id: number;
  name: string;
};

export async function updateNhlTeams(ctx: Context) {
  const res = await fetchTeams();
  const teams = getTeams(res);
  console.log(teams);

  await saveTeams(ctx.prisma, teams);

  ctx.logger.info('Successfully saved NHL teams');
}

function fetchTeams(): Promise<TeamsResponse> {
  return fetchJson<TeamsResponse>('https://statsapi.web.nhl.com/api/v1/teams', {
    timeout: 20_000,
    retry: 5,
  });
}

function getTeams(res: TeamsResponse) {
  return res.teams.map(({ id, name }) => ({ id, name }));
}

async function saveTeams(prisma: PrismaClient, teams: Team[]) {
  await prisma.teams.createMany({
    data: teams,
    skipDuplicates: true,
  });
}
