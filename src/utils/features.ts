import { environment } from '../config/environment';

type Env = { features: { checkout: boolean } };

// Is the payment screen shown before a booking is made? It is a feature of the test environment: production
// books as soon as the client asks (the same switch as the site: on in dev, off in production).
export const isCheckoutEnabled = (env: Env) => env.features.checkout;

export const checkoutEnabled = () => isCheckoutEnabled(environment);
