import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { ZodType } from 'zod';
import { config, requiredEnv } from '../config';
import type { ModelConfig, UsageRecord } from '../types';

const stateDir = path.join(process.cwd(), 'worker', 'state');
export const usageLedgerPath = path.join(stateDir, 'usage.jsonl');

export interface GenerationResult<T> {
  value: T;
  usage: UsageRecord;
}

function modelConfig(model: string): ModelConfig {
  const found = Object.values(config.models).find((candidate) => candidate.id === model);
  if (!found) throw new Error(`No cost configuration exists for model ${model}`);
  return found;
}

async function recordUsage(
  campaignId: string | null,
  stage: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<UsageRecord> {
  const pricing = modelConfig(model);
  const cost =
    (inputTokens / 1_000_000) * pricing.input_cost_per_million_usd +
    (outputTokens / 1_000_000) * pricing.output_cost_per_million_usd;
  const record: UsageRecord = {
    timestamp: new Date().toISOString(),
    campaign_id: campaignId,
    stage,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: Number(cost.toFixed(8)),
  };
  await mkdir(stateDir, { recursive: true });
  await appendFile(usageLedgerPath, `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

function client(): Anthropic {
  return new Anthropic({ apiKey: requiredEnv('ANTHROPIC_API_KEY') });
}

export async function generateText(options: {
  campaignId?: string;
  stage: string;
  model: string;
  system: string;
  prompt: string;
  maxTokens: number;
  temperature?: number;
}): Promise<GenerationResult<string>> {
  const response = await client().messages.create({
    model: options.model,
    max_tokens: options.maxTokens,
    temperature: options.temperature ?? 0.3,
    system: options.system,
    messages: [{ role: 'user', content: options.prompt }],
  });
  const value = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  if (!value) throw new Error(`Claude returned no text for ${options.stage}`);
  const usage = await recordUsage(
    options.campaignId ?? null,
    options.stage,
    options.model,
    response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0) + (response.usage.cache_read_input_tokens ?? 0),
    response.usage.output_tokens
  );
  return { value, usage };
}

export async function generateStructured<T>(options: {
  campaignId?: string;
  stage: string;
  model: string;
  system: string;
  prompt: string;
  schema: ZodType<T>;
  maxTokens: number;
  temperature?: number;
}): Promise<GenerationResult<T>> {
  const response = await client().beta.messages.parse({
    model: options.model,
    max_tokens: options.maxTokens,
    temperature: options.temperature ?? 0,
    system: options.system,
    messages: [{ role: 'user', content: options.prompt }],
    output_format: betaZodOutputFormat(options.schema),
  });
  if (response.parsed_output === null) {
    throw new Error(`Claude returned no structured output for ${options.stage}`);
  }
  const usage = await recordUsage(
    options.campaignId ?? null,
    options.stage,
    options.model,
    response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0) + (response.usage.cache_read_input_tokens ?? 0),
    response.usage.output_tokens
  );
  return { value: response.parsed_output as T, usage };
}

export async function monthToDateCost(now = new Date()): Promise<number> {
  let raw: string;
  try {
    raw = await readFile(usageLedgerPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }
  const prefix = now.toISOString().slice(0, 7);
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as UsageRecord)
    .filter((record) => record.timestamp.startsWith(prefix))
    .reduce((sum, record) => sum + record.cost_usd, 0);
}

export async function budgetAvailable(): Promise<{ available: boolean; spent: number; limit: number }> {
  const spent = await monthToDateCost();
  return { available: spent < config.monthly_token_budget_usd, spent, limit: config.monthly_token_budget_usd };
}
