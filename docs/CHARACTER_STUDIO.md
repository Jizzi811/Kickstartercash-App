# BrandMind Character Studio

The Character Studio turns BrandMind's agent registry into a visual creation workflow. Instead of collecting static avatars, every agent receives a reusable Character DNA profile that can regenerate consistent avatar assets across image providers.

## Workflow

1. Quantum asks which role the new agent should own.
2. BrandMind proposes a name, role, personality, accent color, icon direction and system prompt seed.
3. The Character DNA Generator stores visual traits such as gender, age, hair, expression, style, background and glow.
4. The avatar pipeline sends the generated prompt to the configured image provider: OpenAI Images, FLUX, Stable Diffusion, ComfyUI or another provider behind the AI Gateway.
5. Generated assets are normalized into the public avatar library.

## Asset convention

Generated files should be stored under:

```text
/public/agents/avatars/
```

Each agent should receive these variants:

- `avatar-1024.png`
- `avatar-512.png`
- `thumbnail.png`
- `icon.png`

## Character DNA schema

```json
{
  "name": "Dina",
  "role": "Creative Director",
  "gender": "Female",
  "age": 29,
  "hair": "Purple",
  "personality": ["Creative", "Friendly", "Confident"],
  "style": "Premium Pixar",
  "accent": "Purple",
  "background": "Dark Glass",
  "expression": "Smiling",
  "glow": "Purple"
}
```

The first implementation is a front-end studio and prompt generator. The next backend step is to connect this schema to the Agent Registry, AI Provider Gateway and durable asset storage.
