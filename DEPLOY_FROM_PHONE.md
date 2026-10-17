# Publishing Veltrix Markets from your phone

I prepared this project for deployment, but I cannot create accounts, accept terms, provide payment details, or publish under your identity on your behalf. You will need to do the account-owner steps below in your phone browser.

## Before you start

This package is a **demo website**, not a live broker. It has a registration/login backend and a virtual dashboard. It does not have live market prices, real orders, deposits, withdrawals, or a broker connection. Do not collect customer funds through it.

## Publish using Render (phone browser)

This configuration uses a persistent disk so demo user records and sessions can survive service restarts. Render's persistent disk requires a paid web-service plan; check the current price before confirming deployment.

1. Download and extract `veltrix_auth_starter.zip` if your phone supports ZIP extraction.
2. Create or sign in to a GitHub account in your phone browser.
3. Create a **private** repository called `veltrix-markets-demo` and upload the project files and folders from this ZIP. Include `render.yaml`, `server.js`, `package.json`, `public/`, `.gitignore`, and the README files. Do **not** upload a `.env` file, passwords, or secret keys.
4. Create/sign in to Render in your phone browser and choose **New → Blueprint** (or the current equivalent to deploy from a Git repository).
5. Connect GitHub and select the `veltrix-markets-demo` repository. Render should read `render.yaml` and show the service and persistent disk it plans to create.
6. Review the displayed price and configuration before confirming. The configuration generates a session secret on the hosting provider and sets HTTPS-only cookies.
7. Wait for the deployment to finish, then open the `.onrender.com` URL Render gives you.
8. Test by creating a demo account with an email you control and a unique password. Do not reuse your email password.

## If a screen differs

Hosting providers change their mobile interface. If you get stuck, send a screenshot with email addresses, account IDs, and other private details hidden. Never send me your password, payment-card information, identity documents, or secret keys.

## Important production limitations

Before allowing public users to rely on this service, add email verification, password reset, account deletion, privacy/consent flows, monitoring, backups, and a security review. SQLite is suitable for this small demo only. A real-money forex service for Italy/EU needs qualified legal/regulatory advice and appropriate authorisation or an authorised broker partnership, plus compliant KYC, risk disclosures, payments, and execution integrations. This package does not provide those.
