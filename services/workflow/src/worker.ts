import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function main() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'omnivara-main',
  });

  console.log('🔁 Temporal worker starting on task queue: omnivara-main');
  await worker.run();
}

main().catch((err) => {
  console.error('Temporal worker failed:', err);
  process.exit(1);
});
