import type { UsageRecord } from '../types';
import { assertNoError, getSupabase } from './supabase';

export type ArtifactKind = 'brief' | 'outline' | 'draft' | 'editorial' | 'fact_check' | 'final';

export async function saveArtifact(options: {
  campaignId: string;
  kind: ArtifactKind;
  content: string;
  model: string | null;
  stage: string;
  usage?: UsageRecord;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabase();
  const { data: latest, error: revisionError } = await supabase
    .from('campaign_artifacts')
    .select('revision')
    .eq('campaign_id', options.campaignId)
    .eq('kind', options.kind)
    .order('revision', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(revisionError, `Read ${options.kind} artifact revision`);

  const { error } = await supabase.from('campaign_artifacts').insert({
    campaign_id: options.campaignId,
    kind: options.kind,
    revision: (latest?.revision ?? 0) + 1,
    content_md: options.content,
    model: options.model,
    meta: {
      stage: options.stage,
      ...(options.meta ?? {}),
      ...(options.usage ? { usage: options.usage } : {}),
    },
  });
  assertNoError(error, `Save ${options.kind} artifact`);
}
