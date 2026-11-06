// What the reverse geocoding of the phone gives for a place (expo-location)
export type AddressParts = {
  street?: string | null;
  streetNumber?: string | null;
  district?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
};

// "Av. Afrânio de Melo Franco, 141 - Leblon, Rio de Janeiro - RJ, 22430-060": the way Google writes the addresses
// of the site, which the neighborhood filter and the short address of the cards read. Without a street or a city
// the text that was typed stays as it is.
export const formatAddress = (typed: string, parts: AddressParts | undefined) => {
  const street = parts?.street?.trim();
  const city = parts?.city?.trim();
  if (!street || !city) return typed.trim();

  const number = parts?.streetNumber?.trim();
  const district = parts?.district?.trim();
  const state = parts?.region?.trim();
  // "22430060" -> "22430-060"
  const postal = (parts?.postalCode ?? '').replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');

  return [
    `${street}${number ? `, ${number}` : ''}${district ? ` - ${district}` : ''}`,
    `${city}${state ? ` - ${state}` : ''}`,
    ...(postal ? [postal] : []),
  ].join(', ');
};
