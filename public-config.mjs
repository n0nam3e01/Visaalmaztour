export function publicConfig(env) {
  return { googleMapsKey: env.GOOGLE_MAPS_API_KEY || '' };
}
