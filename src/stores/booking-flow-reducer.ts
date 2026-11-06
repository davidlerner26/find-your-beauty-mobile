import { Availability, DEFAULT_AVAILABILITY } from '../models/professional';
import { CalendarDay, monthDays, startOfDay, startOfMonth } from '../utils/calendar';
import { INTL_LOCALE } from '../utils/locale';
import { freeStartTimes, isWorkingDay } from '../utils/slots';

// What the screen knows about the professional and the chosen services
export type BookingContext = {
  professionalId: string;
  availability: Availability;
  durationMinutes: number;
};

export type BookingFlowState = {
  context: BookingContext | null;
  today: Date;
  month: Date;
  selectedDay: Date | null;
  selectedTime: string | null;
  // Slots ("HH:mm") already taken on the selected day (null while loading)
  taken: Set<string> | null;
  // Once the user picks a day or changes the month, the day found for them must not take over
  userPickedDay: boolean;
};

export type BookingFlowAction =
  | { type: 'setContext'; context: BookingContext }
  | { type: 'pickDay'; date: Date }
  | { type: 'pickTime'; time: string }
  | { type: 'changeMonth'; delta: number }
  // The taken slots of `day` arrived (ignored when the user already moved to another day)
  | { type: 'loaded'; day: Date; taken: Set<string> }
  // The next day with a free time was found for the user (ignored when they chose a day in the meantime)
  | { type: 'nextDayFound'; date: Date };

export const initialBookingFlow = (now = new Date()): BookingFlowState => {
  const today = startOfDay(now);
  return {
    context: null,
    today,
    month: startOfMonth(today),
    selectedDay: null,
    selectedTime: null,
    taken: null,
    userPickedDay: false,
  };
};

export const bookingFlowReducer = (
  state: BookingFlowState,
  action: BookingFlowAction,
): BookingFlowState => {
  switch (action.type) {
    case 'setContext':
      return { ...state, context: action.context };
    case 'pickDay':
      return {
        ...state,
        userPickedDay: true,
        selectedDay: action.date,
        selectedTime: null,
        taken: null,
      };
    case 'pickTime':
      return { ...state, selectedTime: action.time };
    case 'changeMonth': {
      const { month } = state;
      return {
        ...state,
        userPickedDay: true,
        month: new Date(month.getFullYear(), month.getMonth() + action.delta, 1),
        selectedDay: null,
        selectedTime: null,
        taken: null,
      };
    }
    case 'loaded':
      return state.selectedDay?.getTime() === action.day.getTime()
        ? { ...state, taken: action.taken }
        : state;
    case 'nextDayFound':
      if (state.userPickedDay) return state;
      return {
        ...state,
        month: startOfMonth(action.date),
        selectedDay: action.date,
        selectedTime: null,
        taken: null,
      };
  }
};

const availabilityOf = (state: BookingFlowState) =>
  state.context?.availability ?? DEFAULT_AVAILABILITY;

export const isCurrentMonth = (state: BookingFlowState) =>
  state.month.getTime() === startOfMonth(state.today).getTime();

export const monthLabel = (state: BookingFlowState) =>
  new Intl.DateTimeFormat(INTL_LOCALE, { month: 'long', year: 'numeric' }).format(state.month);

// The days of the month shown, with the past and the days off disabled
export const flowDays = (state: BookingFlowState): CalendarDay[] =>
  monthDays(
    state.month,
    (date) => date < state.today || !isWorkingDay(date, availabilityOf(state)),
  );

export const isLoadingTimes = (state: BookingFlowState) =>
  !!state.selectedDay && state.taken === null;

// The start times that are free on the selected day
export const flowTimes = (state: BookingFlowState, now = new Date()): string[] => {
  if (!state.selectedDay || !state.taken) return [];
  return freeStartTimes(
    state.selectedDay,
    availabilityOf(state),
    state.context?.durationMinutes ?? 60,
    state.taken,
    now,
  );
};

// The first day (from today, up to 120 days ahead) with a free time, given the slots taken by day ("yyyy-mm-dd")
export const nextAvailableDay = (
  today: Date,
  availability: Availability,
  durationMinutes: number,
  busy: Map<string, Set<string>>,
  toKey: (date: Date) => string,
  now = new Date(),
): Date | null => {
  for (let offset = 0; offset < 120; offset++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const free = freeStartTimes(
      date,
      availability,
      durationMinutes,
      busy.get(toKey(date)) ?? new Set(),
      now,
    );
    if (free.length) return date;
  }
  return null;
};
