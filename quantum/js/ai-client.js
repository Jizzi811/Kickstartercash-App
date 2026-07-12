window.Quantum = window.Quantum || {};

(function () {
  'use strict';
  const endpoint = '/.netlify/functions/ai';

  async function ask({ system, prompt, temperature, maxTokens } = {}) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, prompt, temperature, maxTokens }),
    });
    let data = {};
    try { data = await res.json(); } catch (_) { /* handled below */ }
    if (!res.ok) throw new Error(data.error || 'Quantum AI Gateway ist nicht erreichbar.');
    return data;
  }

  window.Quantum.ai = { ask, endpoint };
})();

