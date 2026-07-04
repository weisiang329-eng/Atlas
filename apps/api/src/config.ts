export interface ApiConfig {
  readonly nodeEnv: string;
  readonly port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const rawPort = env.PORT ?? "3001";
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return {
    nodeEnv: env.NODE_ENV ?? "development",
    port,
  };
}
