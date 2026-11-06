import { BookingStatus } from '../../shared/domain';
import { Booking } from '../models/booking';
import { upcomingAndHistory } from './booking-lists';

const booking = (id: string, status: BookingStatus) => ({ id, status }) as Booking;

describe('upcomingAndHistory', () => {
  it('splits what is open from what is over, and shows the latest of the history first', () => {
    const list = [
      booking('a', 'completed'),
      booking('b', 'pending'),
      booking('c', 'cancelled'),
      booking('d', 'confirmed'),
    ];
    const { upcoming, history } = upcomingAndHistory(list);
    expect(upcoming.map((b) => b.id)).toEqual(['b', 'd']);
    expect(history.map((b) => b.id)).toEqual(['c', 'a']);
  });
});
