# Payscribe React Native Checkout Example

Standalone Expo TypeScript example for `@payscribe/checkout-react-native`. The
mobile app requests a hosted-checkout session from `server.ts`; the Payscribe
secret key remains server-only.

## Configure

```bash
cp .env.example .env
```

Set your test or live secret key:

```dotenv
PAYSCRIBE_SECRET_KEY=YOUR_PAYSCRIBE_API_KEY
PAYSCRIBE_ENVIRONMENT=sandbox
PORT=4000
EXPO_PUBLIC_CHECKOUT_SERVER_URL=http://localhost:4000
```

The server URL depends on where the app runs:

- iOS simulator: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`
- Physical phone: `http://YOUR_MAC_LAN_IP:4000`

Your Mac and physical phone must be on the same network. Find the Mac's Wi-Fi IP
in System Settings or with `ipconfig getifaddr en0`.

## Run everything

```bash
npm run dev
```

This starts `server.ts` on port 4000 and Expo together. You can also run them in
separate terminals:

```bash
npm run server
npm start
```

Then press `i` for the iOS simulator, `a` for Android, or scan the Expo QR code.

## Verify the session server

```bash
curl http://localhost:4000/health
```

The checkout endpoint is:

```text
POST /api/checkout-session
```

with this local request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "08012345678"
}
```

`server.ts` generates the unique reference and sends the new session-creation
contract to Payscribe. Service, metadata, and amount are selected later inside
the hosted checkout.

When `PAYSCRIBE_SECRET_KEY` contains a `pk_test_` or `pk_live_` publishable key,
the session endpoint also returns it to the app as `checkoutPublicKey`. The
hosted canvas uses it to authenticate data-plan, bouquet, and provider catalog
lookups. Keys with a server-secret prefix are never returned to the app.

## Security

Never rename `PAYSCRIBE_SECRET_KEY` to an `EXPO_PUBLIC_` variable. Expo public
variables are embedded in the app bundle and can be inspected by users.
# react-native-checkout
# react-native-checkout
