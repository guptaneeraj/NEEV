import { Hono } from 'hono';

const app = new Hono();

// Global catch-all to handle /api/wishlist specifically
// We use a broader match to ensure the Cloudflare Worker picks it up
app.post('/api/wishlist', async (c) => {
  const DIRECTUS_URL = "https://directus.neevios.com";
  const DIRECTUS_TOKEN = "KYe03vXlzO8-P1ec00OzGNJpFSHmyYj3";

  try {
    const body = await c.req.json();

    if (!body.email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const response = await fetch(`${DIRECTUS_URL}/items/Wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify({
        email: body.email.trim(),
        category: body.category || "parent",
        status: "published"
      }),
    });

    const result = await response.json();

    return c.json(result, response.status as any);

  } catch (err: any) {
    return c.json({ error: `Worker Proxy Error: ${err.message}` }, 500);
  }
});

app.get('/api/ping', (c) => c.json({ message: "Pong!" }));

export default app;





