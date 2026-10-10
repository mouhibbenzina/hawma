# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Assumption based on the request: residents in Tunisia who want to report and follow visible neighborhood issues, and community members who want to see what has been reported nearby.

## Product Purpose
Make it easier for residents to document a local public-space issue, find related reports, and follow its visible status. Success means a usable, accessible reporting flow and a transparent shared view of reports; the product does not itself repair infrastructure or guarantee a municipal response.

## Positioning
A lightweight, multilingual neighborhood issue board designed around clear locations, useful reports, and visible follow-up rather than an unverified promise of official case management.

## Operating Context
This is a web MVP for Tunisia. French is the initial interface language, with an Arabic interface and right-to-left layout. Users browse reports and can submit an issue with a category, location, and description.

## Capabilities and Constraints
The implementation uses React, Express, Node.js, and MongoDB, with a persistent single-instance JSON-file fallback when MongoDB is not configured. Reports are public and unverified by default. A bearer-token moderator can update a report's board status, add a private note, or hide it. No official municipal connection, identity system, emergency response, or real-world service outcome is established.

## Evidence on Hand
The World Bank's Tunisia Country Climate and Development Report overview identifies water scarcity, coastal erosion, and increasing flood risk among Tunisia's climate challenges: https://www.worldbank.org/en/country/tunisia/publication/tunisia-country-climate-and-development-report. This is context for why resilient local infrastructure matters, not evidence about individual reports or a claim that this app addresses those national challenges.

## Product Principles
- Make reporting understandable on a phone and with assistive technology.
- Show location, category, and status clearly.
- Distinguish synthetic examples from real submissions.
- Be transparent about what the service can and cannot do.
- Support Tunisia's Arabic and French language contexts.

## Accessibility & Inclusion
Provide semantic controls, visible keyboard focus, readable contrast, responsive layouts, and a right-to-left Arabic mode.
