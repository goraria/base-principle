import { Hono } from "hono"

import { bodyLimit } from "hono/body-limit"
import { compress } from "hono/compress"
import { cors } from "hono/cors"
import { csrf } from "hono/csrf"
import { etag } from "hono/etag"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"
import { timeout } from "hono/timeout"
import { timing } from "hono/timing"
import { rateLimiter } from "hono-rate-limiter"

export function application() {
  const app = new Hono()

  app.use("*", requestId())
  app.use("*", logger())
  app.use("*", timing())
  app.use("*", secureHeaders())

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-Id",
      ],
      exposeHeaders: [
        "Content-Length",
        "X-Request-Id",
        "Server-Timing",
      ],
      credentials: true,
      maxAge: 86400,
    }),
  )

  app.use(
    "*",
    csrf({
      origin: "*",
    }),
  )

  app.use(
    "*",
    rateLimiter({
      windowMs: 60_000,
      limit: 100,
      standardHeaders: "draft-6",
      keyGenerator: (c) =>
        c.req.header("x-forwarded-for") ??
        c.req.header("x-real-ip") ??
        "unknown",
    }),
  )

  app.use(
    "*",
    bodyLimit({
      maxSize: 10 * 1024 * 1024,

      onError: (c) =>
        c.json(
          {
            error: "Payload Too Large",
          },
          413,
        ),
    }),
  )

  app.use(
    "*",
    timeout(
      30_000,
      () =>
        new HTTPException(408, {
          message: "Request Timeout",
        }),
    ),
  )

  app.use("*", compress())
  app.use("*", etag())

  if (process.env.NODE_ENV === "development") {
    app.use("*", prettyJSON())
  }

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  )

  app.notFound((c) =>
    c.json(
      {
        error: "Not Found",
        path: c.req.path,
      },
      404,
    ),
  )

  app.onError((error, c) => {
    console.error(error)

    if (error instanceof HTTPException) {
      return c.json(
        {
          error: error.message,
        },
        error.status,
      )
    }

    return c.json(
      {
        error: "Internal Server Error",
      },
      500,
    )
  })

  return app
}