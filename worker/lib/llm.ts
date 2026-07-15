/**
 * OpenRouter LLM client for the Novique content worker.
 * Open-weight models only (workspace guardrail). No direct Anthropic.
 */
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import { z, type ZodType } from 'zod';
import { config, requiredEnv } from '../config';
import type { ModelConfig, UsageRecord } from '../types';

const stateDir = path.join(process.cwd(), 'worker', 'state');
export const usageLedgerPath = path.join(stateDir, 'usage.jsonl');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

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

function client(): OpenAI {
  return new OpenAI({
    apiKey: requiredEnv('OPENROUTER_API_KEY'),
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'https://www.novique.ai',
      'X-Title': 'Novique Content Worker',
    },
  });
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.search(/[{[]/);
  const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
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
  const response = await client().chat.completions.create({
    model: options.model,
    max_tokens: options.maxTokens,
    temperature: options.temperature ?? 0.3,
    messages: [
      { role: 'system', content: options.system },
      { role: 'user', content: options.prompt },
    ],
  });
  const value = response.choices[0]?.message?.content?.trim() ?? '';
  if (!value) throw new Error(`LLM returned no text for ${options.stage}`);
  const usage = await recordUsage(
    options.campaignId ?? null,
    options.stage,
    options.model,
    response.usage?.prompt_tokens ?? 0,
    response.usage?.completion_tokens ?? 0
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
  const jsonSchema = z.toJSONSchema(options.schema) as Record<string, unknown>;
  // OpenAI-compatible json_schema expects a plain object schema without $schema noise.
  const { $schema: _drop, ...schemaBody } = jsonSchema;

  const runOnce = async (repairHint?: string) => {
    const userContent = repairHint
      ? `${options.prompt}\n\n${repairHint}`
      : options.prompt;
    const response = await client().chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature ?? 0,
      messages: [
        {
          role: 'system',
          content: `${options.system}\nRespond with valid JSON only that matches the required schema.`,
        },
        { role: 'user', content: userContent },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: options.stage.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'result',
          strict: true,
          schema: schemaBody,
        },
      },
    });
    const raw = response.choices[0]?.message?.content?.trim() ?? '';
    if (!raw) throw new Error(`LLM returned no structured output for ${options.stage}`);
    const parsedJson = JSON.parse(extractJsonText(raw));
    const value = options.schema.parse(parsedJson);
    const usage = await recordUsage(
      options.campaignId ?? null,
      options.stage,
      options.model,
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    );
    return { value, usage };
  };

  try {
    return await runOnce();
  } catch (firstError) {
    try {
      return await runOnce(
        'Previous response was invalid. Return ONLY valid JSON matching the schema. No markdown fences or commentary.'
      );
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error(`LLM structured output failed for ${options.stage}`);
    }
  }
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

export async function budgetAvailable(): Promise<{
  available: boolean;
  spent: number;
  limit: number;
}> {
  const spent = await monthToDateCost();
  return {
    available: spent < config.monthly_token_budget_usd,
    spent,
    limit: config.monthly_token_budget_usd,
  };
}
