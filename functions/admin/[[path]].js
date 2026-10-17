// Route all admin assets through Pages Functions so the shared middleware can
// validate Cloudflare Access even when the static file exists in the output.
export async function onRequest({ next }) {
  return next();
}
