import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { Payscribe, PayscribeApiError } from "@payscribe/sdk";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(projectRoot, ".env") });

const secretKey = process.env.PAYSCRIBE_SECRET_KEY?.trim();
if (!secretKey) {
  throw new Error(
    `Set PAYSCRIBE_SECRET_KEY in ${path.join(projectRoot, ".env")}.`
  );
}

const environment = process.env.PAYSCRIBE_ENVIRONMENT === "production"
  ? "production"
  : "sandbox";
const port = Number(process.env.PORT || 4000);
const payscribe = new Payscribe({ secretKey, environment });
const app = express();

app.use(express.json({ limit: "32kb" }));
app.use((_request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});
app.options("*splat", (_request, response) => response.sendStatus(204));

app.get("/health", (_request, response) => {
  response.json({ status: true, environment });
});

app.post("/api/checkout-session", async (request, response, next) => {
  try {
    const name = String(request.body?.name || "").trim();
    const email = String(request.body?.email || "").trim();
    const phone = String(request.body?.phone || "").trim();

    if (!name || !email || !phone) {
      response.status(400).json({
        status: false,
        message: "name, email, and phone are required."
      });
      return;
    }

    const result = await payscribe.checkout.createSession({
      currency: "NGN",
      reference: `mobile_${Date.now()}_${randomUUID().slice(0, 8)}`,
      name,
      email,
      phone,
      ...(process.env.MERCHANT_ORIGIN ? { origin: process.env.MERCHANT_ORIGIN } : {}),
      ...(process.env.PAYMENT_SUCCESS_URL
        ? { successUrl: process.env.PAYMENT_SUCCESS_URL }
        : {}),
      ...(process.env.PAYMENT_CANCEL_URL
        ? { cancelUrl: process.env.PAYMENT_CANCEL_URL }
        : {})
    });

    console.log("Payscribe checkout session result:");
    console.dir(result.data, { depth: null, colors: true });

    response.status(201).json({
      ...result.data,
      // pk_ keys are explicitly publishable and are needed by the hosted canvas
      // for authenticated plan, bouquet, and provider catalog requests.
      ...( /^pk_(test|live)_/i.test(secretKey) ? { checkoutPublicKey: secretKey } : {})
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof PayscribeApiError) {
    response.status(error.statusCode || 502).json({
      status: false,
      message: error.message,
      details: error.response
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    status: false,
    message: error instanceof Error ? error.message : "Unable to create checkout session."
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Payscribe checkout server listening on http://0.0.0.0:${port}`);
  console.log(`Environment: ${environment}`);
});
