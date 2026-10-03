import jwt from "jsonwebtoken";

export const generateToken = (userId: string, role: string) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    {
      userId,
      role,
    },
    secret,
    {
      // JWT_EXPIRES_IN from .env (e.g. "7d", "12h"); defaults to 7 days.
      expiresIn: (process.env.JWT_EXPIRES_IN ||
        "7d") as jwt.SignOptions["expiresIn"],
    }
  );
};