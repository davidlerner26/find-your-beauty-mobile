import { BookingStatus } from '../../shared/domain';
import { t } from '../i18n';
import { Booking } from '../models/booking';
import { Professional } from '../models/professional';
import { INTL_LOCALE } from './locale';

// The texts of the state of a booking (the same ones of the site)
export const statusLabel = (status: BookingStatus): string =>
  ({
    pending: t('Aguardando'),
    confirmed: t('Confirmado'),
    declined: t('Recusado'),
    completed: t('Concluído'),
    cancelled: t('Cancelado'),
    cancelledByProfessional: t('Cancelado pelo profissional'),
  })[status];

// "ter., 5 de maio"
export const bookingDateLabel = (booking: Pick<Booking, 'startsAt'>) =>
  booking.startsAt.toLocaleDateString(INTL_LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

// The service is at the client's home (older bookings: the professional only attends at home)
export const isAtHome = (
  booking: Pick<Booking, 'place'>,
  professional: Pick<Professional, 'serviceMode'> | undefined,
) => (booking.place ? booking.place === 'home' : professional?.serviceMode === 'home');

// Where the appointment is: the address of the professional (nothing for home visits)
export const bookingAddress = (
  booking: Pick<Booking, 'place'>,
  professional: Pick<Professional, 'serviceMode' | 'address'> | undefined,
) => (!professional || isAtHome(booking, professional) ? '' : professional.address);
