import { stat } from 'node:fs/promises';
import { budgetAvailable } from '../lib/anthropic';
import { alertDiscord } from '../lib/discord';
import { isMonday, currentMonday } from '../lib/time';
import { candidatesPath, discover } from './discover';
import { metrics } from './metrics';
import { hasPlanForWeek, plan } from './plan';
import { produce } from './produce';

async function candidatesAreStale(): Promise<boolean> {
  try {
    const details = await stat(candidatesPath);
    return Date.now() - details.mtimeMs > 3 * 24 * 60 * 60 * 1000;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
    throw error;
  }
}

export async function run(): Promise<void> {
  const budget = await budgetAvailable();
  if (!budget.available) {
    const message = `Novique content worker skipped generation: month-to-date Claude usage is $${budget.spent.toFixed(4)} (limit $${budget.limit.toFixed(2)}).`;
    console.error(message);
    await alertDiscord(message);
    await metrics();
    return;
  }
  if (await candidatesAreStale()) await discover();
  const weekOf = currentMonday();
  if (isMonday() || !await hasPlanForWeek(weekOf)) await plan();
  await produce();
  await metrics();
}
