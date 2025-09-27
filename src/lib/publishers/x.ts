export async function publishToX(params: {
  accessToken: string;
  text: string;
  // imageUrl?: string; // TODO: media upload flow (v2 media endpoints) if needed
}) {
  const { accessToken, text } = params;
  if (!text?.trim()) throw new Error("Caption/text is required for X");

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const raw = await res.text();
  let body: any;
  try { body = JSON.parse(raw); } catch { body = raw; }
  if (!res.ok) {
    const msg =
      typeof body === "object" && (body?.detail || body?.title || body?.message)
        ? body.detail || body.title || body.message
        : `HTTP ${res.status}`;
    throw new Error(`X publish failed: ${msg}`);
  }

  const id = body?.data?.id as string | undefined;
  if (!id) throw new Error("X publish: missing tweet id");
  return { id }; // tweet id
}
