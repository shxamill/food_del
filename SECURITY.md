# Security Policy

## Reporting a vulnerability

Do not publish exploit details, credentials, payment data, customer records, or an unpatched vulnerability in a public issue or pull request.

Use the repository's **Security** tab and select **Report a vulnerability** to submit a private report when that feature is available. If private vulnerability reporting is unavailable, contact the maintainer privately through https://github.com/shxamill.

Include the affected route or component, impact, steps to reproduce, and suggested mitigation. Redact secrets and personal information.

## Application security notes

- Keep Stripe secret keys and JWT signing secrets on the backend only.
- Never commit .env files, database exports, customer details, or production uploads.
- Treat request bodies, uploaded files, and payment-provider callbacks as untrusted input.
- Test payment flows using a safe Stripe test environment.

Please allow the maintainer a reasonable opportunity to investigate before making a report public.
