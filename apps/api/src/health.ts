export interface HealthResponse {
  readonly status: "ok";
  readonly service: "atlas-api";
  readonly version: "0.0.0";
}

export function getHealth(): HealthResponse {
  return {
    status: "ok",
    service: "atlas-api",
    version: "0.0.0",
  };
}
