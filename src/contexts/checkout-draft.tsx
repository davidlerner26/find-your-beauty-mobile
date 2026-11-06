import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { NewBooking } from '../utils/booking-request';

type CheckoutDraft = {
  request: NewBooking | null;
  set: (request: NewBooking) => void;
  clear: () => void;
};

const CheckoutDraftContext = createContext<CheckoutDraft | null>(null);

// The booking the client chose and has not paid for yet: the booking screen leaves it here for the payment screen.
// It lives in memory only, so restarting the app sends the client back to choose again.
export function CheckoutDraftProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<NewBooking | null>(null);
  const value = useMemo(
    () => ({ request, set: setRequest, clear: () => setRequest(null) }),
    [request],
  );
  return <CheckoutDraftContext.Provider value={value}>{children}</CheckoutDraftContext.Provider>;
}

export function useCheckoutDraft() {
  const value = useContext(CheckoutDraftContext);
  if (!value) throw new Error('useCheckoutDraft must be used inside CheckoutDraftProvider');
  return value;
}
