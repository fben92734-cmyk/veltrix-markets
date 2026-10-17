# Veltrix Markets — demo website starter

This folder contains a mobile-friendly trading-style demo website and a small Node.js authentication backend. It supports account registration, login, logout, server-side sessions, SQLite user records, bcrypt password hashing, CSRF checks, basic rate limiting, and security headers.

## Important: this is not a live trading website

- All market values and the chart are illustrative placeholders, not live prices.
- The displayed €10,000 balance is virtual and is not stored as a real financial balance.
- Demo Buy and Demo Sell buttons do not submit orders.
- There are no deposits, withdrawals, card processing, or broker connection.
- This is a development starter, not ready for public production use.

## Publish from a phone

See [`DEPLOY_FROM_PHONE.md`](DEPLOY_FROM_PHONE.md) for the prepared Render deployment configuration and mobile-browser steps. Hosting requires an account you control and may incur charges; review the price before approving anything.

## What is needed to run it

A computer or a cloud hosting account is needed to install and run the server. A phone browser alone cannot host this Node.js backend. If you do not have a computer, you can keep these files and use a trusted developer or a suitable cloud development/hosting service to deploy them. Do not share passwords, bank details, identity documents, or private keys with a developer unnecessarily.

1. Install Node.js 20 or newer.
2. Extract this folder.
3. Copy `.env.example` to `.env`.
4. Set `SESSION_SECRET` to a unique random secret of at least 32 characters.
5. In this folder, run `npm install` and then `npm start`.
6. Visit `http://localhost:3000` on the same computer.

## Before public deployment

Use HTTPS, configure `NODE_ENV=production` and `COOKIE_SECURE=true`, keep secrets out of source control, use persistent and backed-up storage, add email verification and password reset, MFA, privacy/consent and account deletion workflows, logging/monitoring, and obtain an independent security review.

A real-money forex service in Italy/EU needs qualified legal and regulatory advice, appropriate authorisation or an authorised broker partnership, and compliant trading, customer verification, risk disclosures, and payment integrations. Do not accept customer money or promise real trading through this prototype.
