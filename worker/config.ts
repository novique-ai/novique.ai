import configJson from './config.json';
import type { WorkerConfig } from './types';

export const config = configJson as WorkerConfig;

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required environment variable ${name} is missing`);
  return value;
}
