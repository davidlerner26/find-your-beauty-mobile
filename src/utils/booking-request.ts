import { t } from '../i18n';
import { Booking } from '../models/booking';
import { Professional, Service } from '../models/professional';
import { errorCode } from './error-code';
import { roundMoney } from './money';
import { priceAt } from './pricing';
import { busyIdsFor, toDateKey } from './slots';

// What Bookings.create takes: a booking before it has an id, a client and a status
export type NewBooking = Omit<Booking, 'id' | 'clientUid' | 'clientName' | 'status'>;

export type BookingChoice = {
  artist: Pick<Professional, 'id' | 'name' | 'ownerUid'>;
  services: Service[];
  day: Date;
  // "HH:mm"
  time: string;
  notes: string;
  place: 'home' | 'studio';
  // The address of the client, for a service at home
  clientAddress: string;
  slotMinutes: number;
};

// The total of the services for an appointment that starts at `time`: the price follows the start time
export const totalAt = (services: Service[], day: Date, time: string) =>
  roundMoney(services.reduce((sum, service) => sum + priceAt(service, day, time), 0));

// The request for the booking the client chose. Prices are the ones of the start time; the server checks them again.
export const buildBookingRequest = (choice: BookingChoice): NewBooking => {
  const { artist, services, day, time, place } = choice;
  const [hour, minute] = time.split(':').map(Number);
  const durationMinutes = services.reduce((sum, service) => sum + service.durationMinutes, 0);

  return {
    professionalId: artist.id,
    professionalUid: artist.ownerUid ?? null,
    professionalName: artist.name,
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      price: priceAt(service, day, time),
      durationMinutes: service.durationMinutes,
    })),
    startsAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute),
    durationMinutes,
    total: totalAt(services, day, time),
    notes: choice.notes.trim(),
    busyIds: busyIdsFor(toDateKey(day), time, durationMinutes, choice.slotMinutes),
    place,
    ...(place === 'home' ? { clientAddress: choice.clientAddress } : {}),
    paymentStatus: 'pending',
    // The app has no payment, in any environment: the server must not ask this booking for one
    source: 'mobile',
  };
};

// What to tell the client when the booking could not be made. Slots can only be created once, so a denied write
// means someone took that time first.
export const bookingErrorMessage = (error: unknown) =>
  errorCode(error) === 'permission-denied'
    ? t('Este horário acabou de ser ocupado. Escolha outro.')
    : t('Não foi possível enviar a solicitação. Tente novamente.');
