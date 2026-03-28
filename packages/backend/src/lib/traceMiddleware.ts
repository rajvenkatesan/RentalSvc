import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { Logger } from "pino";
import logger from "./logger.js";
import prisma from "./prisma.js";

declare global {
  namespace Express {
    interface Request {
      log: Logger;
    }
  }
}

export default async function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const start = Date.now();

  const requestId =
    (req.headers["x-request-id"] as string) || crypto.randomUUID();
  const userId = req.headers["x-user-id"] as string | undefined;

  const childContext: Record<string, unknown> = {
    requestId,
    userId,
    method: req.method,
    url: req.originalUrl,
  };

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, displayName: true },
      });
      if (user) {
        childContext.userName = user.username;
        childContext.displayName = user.displayName;
      }
    } catch {
      // User lookup failed — proceed with userId only
    }
  }

  req.log = logger.child(childContext);

  res.setHeader("x-request-id", requestId);

  req.log.info("request started");

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    req.log.info(
      { statusCode: res.statusCode, durationMs },
      "request completed",
    );
  });

  next();
}
