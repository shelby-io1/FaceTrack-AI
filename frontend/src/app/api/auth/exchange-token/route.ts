import { auth } from "@/lib/auth/server";

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/neon-exchange`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEON_AUTH_SHARED_SECRET}`,
      },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name,
        sub: session.user.id,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return Response.json(data, { status: res.status });
  }

  return Response.json(data);
}
