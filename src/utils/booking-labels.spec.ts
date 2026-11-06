import { BOOKING_STATUSES } from '../../shared/domain';
import { bookingAddress, isAtHome, statusLabel } from './booking-labels';

describe('statusLabel', () => {
  it('has a text for every status', () => {
    for (const status of BOOKING_STATUSES) expect(statusLabel(status)).toBeTruthy();
    expect(statusLabel('pending')).toBe('Aguardando');
  });
});

describe('where the appointment is', () => {
  const studio = { serviceMode: 'studio' as const, address: 'Rua A, 1' };
  const home = { serviceMode: 'home' as const, address: '' };

  it('follows the place of the booking', () => {
    expect(isAtHome({ place: 'home' }, studio)).toBe(true);
    expect(isAtHome({ place: 'studio' }, home)).toBe(false);
  });

  it('older bookings follow the mode of the professional', () => {
    expect(isAtHome({}, home)).toBe(true);
    expect(isAtHome({}, studio)).toBe(false);
  });

  it('has the address of the professional unless it is at home', () => {
    expect(bookingAddress({ place: 'studio' }, studio)).toBe('Rua A, 1');
    expect(bookingAddress({ place: 'home' }, studio)).toBe('');
    expect(bookingAddress({}, undefined)).toBe('');
  });
});
