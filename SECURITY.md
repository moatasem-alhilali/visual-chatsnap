# Security Policy

## Supported versions

Scenora is developed on a single branch. Security fixes land on `main` and are deployed to the [live demo](https://visual-chatsnap.vercel.app).

| Version | Supported |
| --- | --- |
| `main` (latest) | ✅ |
| Older commits and forks | ❌ |

## Reporting a vulnerability

**Please don't open a public issue for security problems.**

Report privately through GitHub: **Security → Advisories → [Report a vulnerability](https://github.com/moatasem-alhilali/visual-chatsnap/security/advisories/new)**.

Please include:

- a description of the issue and its impact;
- steps to reproduce (URL, browser, scenario JSON if relevant);
- any proof-of-concept, logs or screenshots;
- a suggested fix, if you have one.

What to expect:

- acknowledgement within **3 business days**;
- an initial assessment within **7 days**;
- a fix or mitigation plan as soon as practical, with credit in the advisory if you'd like it.

## Scope

In scope:

- the Next.js app in this repository, including the `/api/analytics/track` forwarding route, scenario import (JSON, images), the export pipeline and the dev-only `/preview` route (which must stay unavailable in production);
- issues that leak user content. Scenarios are meant to stay in the browser, and analytics must stay consent-gated and never include scenario content.

Out of scope:

- vulnerabilities in third-party services you connect via `BACKEND_API_URL`;
- issues that require a malicious browser extension or a compromised device;
- use of the tool to create misleading content. That is a policy matter covered in the README's *Responsible use* section, not a software vulnerability.

Thank you for helping keep Scenora and its users safe.
