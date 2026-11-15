# How changes go live

1. Make a branch and open a pull request into `main`.
2. CI runs the checks, the tests and the build.
3. If everything passes, the PR merges by itself.
4. Vercel publishes `main` to https://spacesyntax.laubuilds.work, then a deploy check opens the live site to make sure it loads.

Want a PR to wait? Open it as a draft, or add the `no-automerge` label. Remove it when you are ready.

If CI fails, the PR stays open. Fix it and push again.

Before you push, you can run the same checks:

```bash
node tools/check.js
npm test
npm run build
```
