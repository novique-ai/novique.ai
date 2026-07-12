import { discover } from './commands/discover';
import { plan } from './commands/plan';
import { produce } from './commands/produce';
import { run } from './commands/run';

const commands: Record<string, () => Promise<void>> = { discover, plan, produce, run };
const command = process.argv[2];

if (!command || !commands[command]) {
  console.error(`Usage: tsx worker/index.ts <${Object.keys(commands).join('|')}>`);
  process.exitCode = 2;
} else {
  commands[command]().catch((error) => {
    console.error(`worker:${command} failed:`, error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  });
}
