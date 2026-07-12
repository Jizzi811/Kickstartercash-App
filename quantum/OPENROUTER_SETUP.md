# OpenRouter setup for Quantum

Configure these variables in Netlify under **Project configuration → Environment variables**:

- `OPENROUTER_API_KEY`: your OpenRouter key
- `OPENROUTER_MODEL`: `openrouter/free`
- `QUANTUM_ACCESS_TOKEN`: a long random password used to protect the AI gateway
- `QUANTUM_ALLOWED_ORIGIN`: the exact public Quantum URL, for example `https://your-site.netlify.app`

Redeploy the site after saving the variables. The access token is requested in Quantum when an AI skill is used and is kept only in the current browser tab's session storage.

The gateway accepts only the configured site origin and access token and limits each client to ten requests per minute.
