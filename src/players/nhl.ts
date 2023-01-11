import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { Context } from '../index.js';
import { fetchJson } from '../utils/http.js';

export type Roster = {
  teams: TeamData[];
};

type TeamData = {
  id: number;
  roster: TeamRoster;
};

type TeamRoster = {
  roster: RosterMember[];
};

type RosterMember = {
  person: {
    id: number;
  };
};

type People = {
  people: Person[];
};

type Person = {
  id: number;
  fullName: string;
  primaryNumber: string;
  currentAge: number;
  currentTeam: CurrentTeam;
  primaryPosition: Position;
};

type CurrentTeam = {
  id: number;
};

type Position = {
  name: string;
};

type Player = {
  id: number;
  name: string;
  age: number;
  team_id: number;
  position: string;
  number: number;
};

export interface UpdateNhlPlayersConfig {
  logger: Logger;
  fetchRoster: () => Promise<Roster>;
  fetchPeople: (playerIds: number[]) => Promise<People[]>;
  savePlayers: (players: Player[]) => Promise<void>;
}

export async function updateNhlPlayers(config: UpdateNhlPlayersConfig) {
  const roster = await config.fetchRoster();
  const playerIds = getPlayerIds(roster);
  const people = await config.fetchPeople(playerIds);
  const players = getPlayers(people);

  await config.savePlayers(players);

  config.logger.info('Successfully saved NHL players');
}

export function createUpdateNhlPlayersConfig(ctx: Context) {
  return {
    logger: ctx.logger,
    fetchRoster,
    fetchPeople,
    savePlayers: (players: Player[]) => savePlayers(ctx.prisma, players),
  };
}

function fetchRoster(): Promise<Roster> {
  return fetchJson<Roster>(
    'https://statsapi.web.nhl.com/api/v1/teams?expand=team.roster',
    { timeout: 20_000, retry: 5 }
  );
}

function getPlayerIds(roster: Roster): number[] {
  return roster.teams.flatMap((team) =>
    team.roster.roster.map(({ person: { id } }) => id)
  );
}

function fetchPeople(ids: number[]) {
  const promises = ids.map((id) => fetchPlayer(id));
  return Promise.all(promises);
}

function fetchPlayer(id: number) {
  return fetchJson<People>(`https://statsapi.web.nhl.com/api/v1/people/${id}`, {
    timeout: 20_000,
    retry: 5,
  });
}

function getPlayers(people: People[]) {
  return people.map((p) => getPlayerData(getPerson(p)));
}

function getPerson(p: People) {
  return p.people[0];
}

function getPlayerData(person: Person): Player {
  const {
    id,
    fullName: name,
    currentAge: age,
    currentTeam: { id: team_id },
    primaryPosition: { name: position },
    primaryNumber: number,
  } = person;

  return { id, name, age, team_id, position, number: Number(number) };
}

async function savePlayers(prisma: PrismaClient, players: Player[]) {
  await prisma.players.createMany({
    data: players,
    skipDuplicates: true,
  });
}
