import { PrismaClient } from '@prisma/client';
import { Context } from '../index.js';
import { getCurrentDate } from '../utils/dates.js';

export async function updateNhlStats(ctx: Context) {
  console.log(getCurrentDate());
  const scheduledGames = await getScheduledGames(ctx.prisma);
  console.log(scheduledGames);
}

async function getScheduledGames(prisma: PrismaClient) {
  return await prisma.schedule.findMany({
    where: {
      game_date: {
        gt: getCurrentDate({ iso: true }),
      },
    },
  });
}
