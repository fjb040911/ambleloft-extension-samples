# Contributing

Each runnable sample is standalone with locked npm dependencies, bilingual docs, permission declarations, meaningful tests, screenshots from the real host, and build/validate/pack scripts. Never auto-retry an unknown write. Keep services outside the extension archive. Record expected, actual, and unsupported behavior.

Run `npm ci`, `npm run setup`, `npm run build`, `npm run validate`, `npm run pack`, and `npm test`. Desktop QA: `AMBLE_HOST_PATH=/absolute/path/to/built/agent npm run test:desktop`; it uses temporary profiles, a fixture model, and fictional data. It never uses a saved user account.

Catalog statuses are planned / preview / verified. Do not mark verified from a browser mock or source-only doctor. Screenshots must have captions describing environment and state. Add both README languages and test archive validation.
