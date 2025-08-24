import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigration() {
  console.log('Attempting to run database migration...');
  try {
    const { stdout, stderr } = await execAsync('npx drizzle-kit push');
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    if (!stderr) {
      console.log('Migration successful!');
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();
