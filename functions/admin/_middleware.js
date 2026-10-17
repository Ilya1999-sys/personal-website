// The admin shell contains no private data. Mutating and admin-data APIs are
// protected separately by the signed session middleware under /api/admin.
export async function onRequest({ next }) {
  return next();
}
