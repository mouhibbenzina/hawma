# Security policy

Hawma is an early community pilot and does not promise uninterrupted availability or immunity from compromise.

## Reporting a vulnerability

Do not publish exploitable details in a public issue. Use GitHub's **Report a vulnerability** flow in this repository's Security tab to send a private report to the maintainers. Include affected versions, impact, and a minimal reproduction. Do not include residents' personal data.

## Operational security

- Keep `.env`, `ADMIN_TOKEN`, and `SUPPORT_SECRET` private; rotate them if exposed.
- Use the documented HTTPS reverse proxy, keep the host and container images updated, and never expose the MongoDB port publicly.
- Review every report before publication. Published observations remain unverified community content.
- Keep backups off-host and test restoration; the Compose backup volume alone is not disaster recovery.
- Rate limiting is in-memory and the deployment is a single-host pilot. Do not scale replicas without a shared rate-limit store and operational monitoring.
- Do not use Hawma for emergencies or submit contact details, exact home locations, or other sensitive personal information.
