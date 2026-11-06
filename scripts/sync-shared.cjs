// Copies shared/domain.ts from the site (../find-your-beauty) into this repo. The site's file is the one that is
// edited: what the app, the site and the Cloud Functions agree on lives there.
// usage: node scripts/sync-shared.cjs          copies it
//        node scripts/sync-shared.cjs --check  fails when the copy is not the same (used by the tests)
//        SITE_REPO=/path/to/find-your-beauty overrides the place of the site (default: the folder next to this one)
const fs = require('node:fs');
const path = require('node:path');

const site = process.env.SITE_REPO ?? path.join(__dirname, '..', '..', 'find-your-beauty');
const source = path.join(site, 'shared', 'domain.ts');
const copy = path.join(__dirname, '..', 'shared', 'domain.ts');
const header =
  '// COPY of shared/domain.ts of the site (find-your-beauty): do not edit here. Run `npm run sync:shared` after it changes.\n';

if (!fs.existsSync(source)) {
  // Without the site next to this repo (CI, for example) there is nothing to compare with
  console.warn(`${source} not found: skipping.`);
  process.exit(process.argv.includes('--check') ? 0 : 1);
}

const wanted = header + fs.readFileSync(source, 'utf8');

if (process.argv.includes('--check')) {
  const current = fs.existsSync(copy) ? fs.readFileSync(copy, 'utf8') : '';
  if (current !== wanted) {
    console.error("shared/domain.ts is not the same as the site's: run `npm run sync:shared`.");
    process.exit(1);
  }
  process.exit(0);
}
fs.mkdirSync(path.dirname(copy), { recursive: true });
fs.writeFileSync(copy, wanted);
console.log('shared/domain.ts updated');
