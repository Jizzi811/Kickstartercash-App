# Brandmind Frontend

Brandmind is the standalone AI Growth OS frontend. It uses Create React App with CRACO, Tailwind CSS, React Router, and the Brandmind product-level design system.

## Quick start

```bash
npm ci --legacy-peer-deps
npm start
```

The app runs locally at [http://localhost:3000](http://localhost:3000).

> `--legacy-peer-deps` is currently required because the locked dependency tree includes peer ranges from CRA-era packages (for example `react-day-picker` and `eslint-config-react-app`) that do not fully match the newer root dependency versions.

## PR readiness checklist

Before opening or merging a design refresh PR, run the following from this `frontend` directory:

```bash
npm ci --legacy-peer-deps
npm run build
CI=true npm test -- --watchAll=false --passWithNoTests
```

Notes for reviewers:

- `npm run build` is the primary merge gate for the current frontend.
- The repository currently has no Jest test files, so use `--passWithNoTests` when checking the CRA test runner in CI-style mode.
- Visual changes should be reviewed in the authenticated app shell and key design routes such as `/`, `/mission`, `/intelligence`, `/gateway`, `/brand-identity`, `/memory`, `/skills`, and `/agents`.

## Available scripts

### `npm start`

Runs the app in development mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm test`

Launches the CRA test runner. For non-interactive checks in this repo, prefer:

```bash
CI=true npm test -- --watchAll=false --passWithNoTests
```

## Project entry points

- `src/App.js` wires the authenticated app shell and routes.
- `src/brandmind.js` stores product-level Brandmind copy and color tokens.
- `src/App.css` contains app-wide styling and design-system utilities.
