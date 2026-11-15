# How far is up?

A kid is sure the Moon is made of cheese. There is only one way to find out: go.

You plan the trip with real NASA numbers. Build something, press Play, watch it work or fall apart, fix it and try again. Like Poly Bridge, but with rockets.

**Play:** https://spacesyntax.laubuilds.work

Made for NASA Space Apps 2026, Space Mission Design Game challenge.

## The trip

0. Pick the question you want to answer.
1. Build the spacecraft and pick a rocket.
2. Pack air, food and water for the crew.
3. Plan the burns and how much fuel to spare.
4. Choose how to talk to Earth.
5. Pick a landing site and land.
6. Explore and test the hypothesis.
7. Fly home and take everything to the lab.

## Real science

Every number comes from NASA or is marked as a game value. The rocket equation, NASA life support data, the Deep Space Network, Apollo landing sites, Artemis reentry. All sources are linked inside the game and listed in [docs/sources.md](docs/sources.md).

## Run it

```bash
npm install
npm run dev   # http://localhost:5173
npm test
```

The engine is plain JavaScript in `js/`. The screens are React in `src/`. More in [docs/api.md](docs/api.md) and [docs/pantallas.md](docs/pantallas.md).

No login and no tracking. See [SECURITY.md](SECURITY.md).

## How we built it

- **Images:** generated with OpenAI image models (gpt-image), then edited for the game. Grey backgrounds removed with `tools/quitar-gris.mjs`.
- **Code:** frontend and backend written with Claude Code.
- **Review workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `tools/check.js`, the test suite and the production build on every pull request and every push to `main`. If the checks pass, it merges the PR into `main` automatically unless the PR is a draft or has the `no-automerge` label.
- **Deploy workflow:** Vercel builds and serves `main` at https://spacesyntax.laubuilds.work. When Vercel reports a successful deploy, [`.github/workflows/deploy-check.yml`](.github/workflows/deploy-check.yml) smoke-tests the live site.

## Team

- [Laura Angel](https://www.linkedin.com/in/laujml), Software Engineer
- [Kevin Luna](https://www.linkedin.com/in/kevin-elías-luna-palacios), Software Engineer
- [Jorge Flores](https://www.linkedin.com/in/jorge-echeverria2710), Software Engineer
- [Violeta Jacobo](https://www.linkedin.com/in/violetajacobo/)
