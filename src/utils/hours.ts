import { Availability } from '../models/professional';
import { t } from '../i18n';

const DAYS = () => [
  t('Domingo'),
  t('Segunda'),
  t('Terça'),
  t('Quarta'),
  t('Quinta'),
  t('Sexta'),
  t('Sábado'),
];

export type HoursLine = { days: string; hours: string };

// "Segunda a sexta · 08:00 - 18:00": the working days from Monday on, joined when they are in a row and have the
// same hours. Days that are off do not show.
export const workingHours = (availability: Availability): HoursLine[] => {
  const names = DAYS();
  // Monday first, Sunday last
  const order = [1, 2, 3, 4, 5, 6, 0];
  const lines: { from: number; to: number; hours: string }[] = [];

  order.forEach((day, position) => {
    const config = availability.weekly[String(day)];
    if (!config?.enabled) return;
    const hours = `${config.start} - ${config.end}`;
    const last = lines[lines.length - 1];
    if (last && last.to === position - 1 && last.hours === hours) last.to = position;
    else lines.push({ from: position, to: position, hours });
  });

  return lines.map(({ from, to, hours }) => ({
    days:
      from === to
        ? names[order[from]]
        : t('{{first}} a {{last}}', {
            first: names[order[from]],
            last: names[order[to]].toLowerCase(),
          }),
    hours,
  }));
};
