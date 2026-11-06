import { useEffect, useMemo, useReducer, useRef } from 'react';
import { DEFAULT_AVAILABILITY } from '../models/professional';
import { busyFrom, busyTimes } from '../services/professionals';
import { log } from '../utils/log';
import { toDateKey } from '../utils/slots';
import {
  BookingContext,
  bookingFlowReducer,
  flowDays,
  flowTimes,
  initialBookingFlow,
  isCurrentMonth,
  isLoadingTimes,
  monthLabel,
  nextAvailableDay,
} from './booking-flow-reducer';

// The choice of day and time of a booking: the month being shown, the day, the time, and the times that are free
// on that day. The screen keeps what is about the services, the price and the payment.
export function useBookingFlow(context: BookingContext) {
  const [state, dispatch] = useReducer(bookingFlowReducer, undefined, () => initialBookingFlow());
  const { professionalId, availability, durationMinutes } = context;
  const selectedDay = state.selectedDay;

  // The store needs to know the professional and the services to offer days and times
  useEffect(() => {
    dispatch({ type: 'setContext', context: { professionalId, availability, durationMinutes } });
  }, [professionalId, availability, durationMinutes]);

  // Loads the taken slots whenever the day (or the professional) changes
  useEffect(() => {
    if (!selectedDay) return;
    let cancelled = false;
    busyTimes(professionalId, toDateKey(selectedDay))
      .then((taken) => !cancelled && dispatch({ type: 'loaded', day: selectedDay, taken }))
      .catch((error) => {
        log.error('Failed to load times', error);
        if (!cancelled) dispatch({ type: 'loaded', day: selectedDay, taken: new Set() });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDay, professionalId]);

  // The first thing the screen does is to show the next day the professional can attend
  const looked = useRef(false);
  useEffect(() => {
    if (looked.current) return;
    looked.current = true;
    const today = state.today;
    void (async () => {
      let busy = new Map<string, Set<string>>();
      try {
        busy = await busyFrom(professionalId, toDateKey(today));
      } catch (error) {
        log.error('Failed to load busy days', error);
      }
      const date = nextAvailableDay(
        today,
        availability ?? DEFAULT_AVAILABILITY,
        durationMinutes,
        busy,
        toDateKey,
      );
      // The reducer ignores it when the user picked a day while this was loading
      if (date) dispatch({ type: 'nextDayFound', date });
    })();
  }, [professionalId, availability, durationMinutes, state.today]);

  return useMemo(
    () => ({
      month: state.month,
      selectedDay,
      selectedTime: state.selectedTime,
      days: flowDays(state),
      times: flowTimes(state),
      loadingTimes: isLoadingTimes(state),
      monthLabel: monthLabel(state),
      isCurrentMonth: isCurrentMonth(state),
      pickDay: (date: Date) => dispatch({ type: 'pickDay', date }),
      pickTime: (time: string) => dispatch({ type: 'pickTime', time }),
      changeMonth: (delta: number) => dispatch({ type: 'changeMonth', delta }),
    }),
    [state, selectedDay],
  );
}
