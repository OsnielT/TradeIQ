export const AI_PROVIDER = {
  baseURL: "https://router.huggingface.co/v1",
  model: "openai/gpt-oss-120b:cerebras",
  fallbackModel: "openai/gpt-oss-120b:fastest",
  maxTokens: 512,
  temperature: 0.7,
} as const;
