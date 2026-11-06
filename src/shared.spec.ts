import { spawnSync } from 'node:child_process';
import path from 'node:path';

// shared/domain.ts is a copy of the site's file: a stale copy fails here (skipped when the site is not next to this repo)
it('has the same shared/domain.ts as the site', () => {
  const result = spawnSync(
    'node',
    [path.join(__dirname, '..', 'scripts', 'sync-shared.cjs'), '--check'],
    {
      encoding: 'utf8',
    },
  );
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
});
