# Contributing Guide

Thank you for considering a contribution to **Chahua Code Animator**. This document explains how to collaborate effectively and keep the project healthy.

## Development Workflow
- **Fork & clone** the repository, then create a feature branch: `git checkout -b feature/my-update`.
- Install dependencies with `npm install` and launch the app locally using `npm start`.
- When packaging changes, prefer `npm run dist:win` (or the matching platform target) so artifact telemetry remains accurate.
- Keep pull requests focused. Small, well-scoped changes are easier to review and ship.

## Coding Standards
- Follow the existing project structure and avoid introducing unused dependencies.
- Use modern JavaScript/TypeScript patterns, keep imports ordered, and write self-documenting code. Add succinct comments only when behaviour is non-obvious.
- Run `npm test` (plus any targeted scripts relevant to your change) before opening a PR.
- Validate Presentation Mode behaviour using the scenarios listed in `docs/en/PRESENTATION_MODE_STATUS.md`.

## Commits & Reviews
- Write commits in the present tense (e.g. `Add CLI telemetry tagging`).
- Reference related issues or roadmap items when applicable.
- Ensure CI passes and artifact telemetry is regenerated if packaging logic changes.
- Expect code review feedback. We collaborate respectfully and iterate quickly.

## Issue Reporting
- Use GitHub Issues for bugs, feature proposals, and documentation requests.
- Include reproduction steps, screenshots, or sample Markdown files whenever possible.
- Security issues should **not** be filed publicly; follow the [Security Policy](SECURITY_POLICY.md).

## Community Expectations
- Respect the [Code of Conduct](CODE_OF_CONDUCT.md).
- Be patient and constructive. Maintainers balance this work alongside other responsibilities.

We appreciate every contribution—small fixes, new features, and thoughtful reviews all move the project forward.