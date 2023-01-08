import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { fetchJson } from '../utils/http.js';

type Roster = {
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

export async function updateNhlPlayers(ctx: Context) {
  const roster = await fetchRoster();
  const playerIds = getPlayerIds(roster);
  const pid = [playerIds[0], playerIds[1], playerIds[2]];
  const people = await fetchPeople(pid);
  const players = getPlayers(people);

  await savePlayers(ctx.prisma, players);

  ctx.logger.info('Successfully saved NHL players');
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
