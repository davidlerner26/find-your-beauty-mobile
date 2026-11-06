import fs from 'node:fs';
import path from 'node:path';
import { en } from './en';
import { es } from './es';

const root = path.join(__dirname, '..');

const sources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(file);
    return /\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name) ? [file] : [];
  });

// Every text written as t('...') in the code (single quotes, the way the code is formatted)
const keys = [
  ...new Set(
    sources(root).flatMap((file) =>
      [...fs.readFileSync(file, 'utf8').matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)].map((match) =>
        match[1].replace(/\\'/g, "'"),
      ),
    ),
  ),
];

const placeholders = (text: string) => [...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();

describe.each([
  ['English', en],
  ['Spanish', es],
])('%s translations', (_name, translations) => {
  it('has every text of the code', () => {
    expect(keys.filter((key) => !translations[key])).toEqual([]);
  });

  it('keeps the placeholders of the source', () => {
    const wrong = Object.entries(translations).filter(
      ([source, translated]) => placeholders(source).join() !== placeholders(translated).join(),
    );
    expect(wrong).toEqual([]);
  });

  it('has no text the code does not use', () => {
    expect(Object.keys(translations).filter((key) => !keys.includes(key))).toEqual([]);
  });
});
