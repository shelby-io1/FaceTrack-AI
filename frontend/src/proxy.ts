import { auth } from "@/lib/auth/server";

export const proxy = auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|$).*)"],
};
