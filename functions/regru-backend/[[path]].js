// The REG.RU deployment package copies this private PHP source to its API
// directory. Never serve the repository copy as a static asset on Pages.
export async function onRequest() {
  return new Response("Not found", { status: 404 });
}
