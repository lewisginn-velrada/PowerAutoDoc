# vel-docgen

Automated as-built documentation generator for Power Platform solutions.

Reads unpacked solution XML from Git and produces structured markdown documentation 
for Azure DevOps Wiki — automatically, on every deployment.

## Quick Start
```bash
pac solution unpack --zipfile MySolution.zip --folder ./unpacked
npm install
npm run dev
```

## Architecture

See `docs/architecture.jsx` for the full system design (open as a React artifact in Claude).

## Output

Generated docs are written to `./output/`. See `src/config/` for filtering and render options.

test to new ado repo