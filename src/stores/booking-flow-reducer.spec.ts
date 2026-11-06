import { Availability } from '../models/professional';
import { toDateKey } from '../utils/slots';
import {
  bookingFlowReducer,
  BookingFlowState,
  flowDays,
  flowTimes,
  initialBookingFlow,
  isCurrentMonth,
  isLoadingTimes,
  nextAvailableDay,
} from './booking-flow-reducer';

// Monday to Friday 08:00-12:00 in 60 minute slots; the weekend is off
const availability: Availability = {
  slotMinutes: 60,
  weekly: Object.fromEntries(
    [0, 1, 2, 3, 4, 5, 6].map((day) => [
      day,
      { enabled: day >= 1 && day <= 5, start: '08:00', end: '12:00' },
    ]),
  ),
  blockedRanges: [],
};

// "Today" is Monday 2099-05-04, 07:00 (before the opening)
const now = new Date(2099, 4, 4, 7, 0);
const start = (): BookingFlowState =>
  bookingFlowReducer(initialBookingFlow(now), {
    type: 'setContext',
    context: { professionalId: 'pro1', availability, durationMinutes: 60 },
  });

describe('days', () => {
  it('shows the current month, with the past and the days off disabled', () => {
    const state = start();
    expect(isCurrentMonth(state)).toBe(true);
    const days = flowDays(state);
    expect(days).toHaveLength(31);
    expect(days.filter((day) => day.disabled).map((day) => day.number)).toEqual([
      1, 2, 3, 9, 10, 16, 17, 23, 24, 30, 31,
    ]);
  });

  it('moves between months and clears the day', () => {
    let state = bookingFlowReducer(start(), { type: 'pickDay', date: new Date(2099, 4, 5) });
    state = bookingFlowReducer(state, { type: 'changeMonth', delta: 1 });
    expect(isCurrentMonth(state)).toBe(false);
    expect(state.selectedDay).toBeNull();
    expect(flowDays(state)).toHaveLength(30);
    expect(isCurrentMonth(bookingFlowReducer(state, { type: 'changeMonth', delta: -1 }))).toBe(
      true,
    );
  });
});

describe('times', () => {
  const day = new Date(2099, 4, 5);

  it('offers nothing until a day is picked and its slots are loaded', () => {
    let state = start();
    expect(flowTimes(state, now)).toEqual([]);
    expect(isLoadingTimes(state)).toBe(false);

    state = bookingFlowReducer(state, { type: 'pickDay', date: day });
    expect(isLoadingTimes(state)).toBe(true);
    expect(flowTimes(state, now)).toEqual([]);

    state = bookingFlowReducer(state, { type: 'loaded', day, taken: new Set(['09:00']) });
    expect(isLoadingTimes(state)).toBe(false);
    expect(flowTimes(state, now)).toEqual(['08:00', '10:00', '11:00']);
  });

  it('a multi-slot service needs consecutive free slots', () => {
    let state = bookingFlowReducer(start(), {
      type: 'setContext',
      context: { professionalId: 'pro1', availability, durationMinutes: 120 },
    });
    state = bookingFlowReducer(state, { type: 'pickDay', date: day });
    state = bookingFlowReducer(state, { type: 'loaded', day, taken: new Set(['09:00']) });
    expect(flowTimes(state, now)).toEqual(['10:00']);
  });

  it('ignores slots that arrive for a day that is no longer selected', () => {
    let state = bookingFlowReducer(start(), { type: 'pickDay', date: day });
    state = bookingFlowReducer(state, { type: 'pickDay', date: new Date(2099, 4, 6) });
    state = bookingFlowReducer(state, { type: 'loaded', day, taken: new Set(['08:00']) });
    expect(state.taken).toBeNull();
  });

  it('picking a time keeps it until another day is picked', () => {
    let state = bookingFlowReducer(start(), { type: 'pickDay', date: day });
    state = bookingFlowReducer(state, { type: 'pickTime', time: '10:00' });
    expect(state.selectedTime).toBe('10:00');
    state = bookingFlowReducer(state, { type: 'pickDay', date: new Date(2099, 4, 6) });
    expect(state.selectedTime).toBeNull();
  });
});

describe('next available day', () => {
  const today = new Date(2099, 4, 4);

  it('is today when it has a free time', () => {
    expect(nextAvailableDay(today, availability, 60, new Map(), toDateKey, now)).toEqual(today);
  });

  it('skips full days and the weekend', () => {
    const full = new Set(['08:00', '09:00', '10:00', '11:00']);
    const busy = new Map([
      ['2099-05-04', full],
      ['2099-05-05', full],
      ['2099-05-06', full],
      ['2099-05-07', full],
      ['2099-05-08', full],
    ]);
    expect(nextAvailableDay(today, availability, 60, busy, toDateKey, now)).toEqual(
      new Date(2099, 4, 11),
    );
  });

  it('is null when nothing is free in the next 120 days', () => {
    const none: Availability = { ...availability, weekly: {} };
    expect(nextAvailableDay(today, none, 60, new Map(), toDateKey, now)).toBeNull();
  });

  it('only takes over while the user has not picked a day', () => {
    const found = new Date(2099, 5, 2);
    const taken = bookingFlowReducer(start(), { type: 'nextDayFound', date: found });
    expect(taken.selectedDay).toEqual(found);
    expect(taken.month).toEqual(new Date(2099, 5, 1));

    const picked = bookingFlowReducer(start(), { type: 'pickDay', date: new Date(2099, 4, 5) });
    expect(bookingFlowReducer(picked, { type: 'nextDayFound', date: found })).toBe(picked);
  });
});
