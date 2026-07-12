/**
 * Encrypt legacy plaintext social account tokens in place.
 *
 * Run with: npx tsx scripts/encrypt-social-tokens.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'
import { encryptToken, isEncrypted } from '../lib/social/tokenCrypto'

config({ path: path.resolve(process.cwd(), '.env.local') })

const BATCH_SIZE = 500

async function encryptSocialTokens() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let scanned = 0
  let updated = 0
  let skipped = 0
  let lastId: string | null = null

  while (true) {
    let query = supabase
      .from('social_accounts')
      .select('id, access_token, refresh_token')
      .order('id', { ascending: true })
      .limit(BATCH_SIZE)

    if (lastId) {
      query = query.gt('id', lastId)
    }

    const { data: accounts, error: fetchError } = await query

    if (fetchError) {
      throw new Error('Failed to read social account tokens')
    }

    if (!accounts || accounts.length === 0) {
      break
    }

    for (const account of accounts) {
      scanned++

      const accessNeedsEncryption = !isEncrypted(account.access_token)
      const refreshNeedsEncryption =
        account.refresh_token !== null && !isEncrypted(account.refresh_token)

      if (!accessNeedsEncryption && !refreshNeedsEncryption) {
        skipped++
        continue
      }

      const tokenUpdate: {
        access_token?: string
        refresh_token?: string
      } = {}

      if (accessNeedsEncryption) {
        tokenUpdate.access_token = encryptToken(account.access_token)
      }
      if (refreshNeedsEncryption && account.refresh_token !== null) {
        tokenUpdate.refresh_token = encryptToken(account.refresh_token)
      }

      const { error: updateError } = await supabase
        .from('social_accounts')
        .update(tokenUpdate)
        .eq('id', account.id)

      if (updateError) {
        throw new Error('Failed to update encrypted social account tokens')
      }

      updated++
    }

    lastId = accounts[accounts.length - 1].id
  }

  console.log(`Scanned: ${scanned}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
}

encryptSocialTokens().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Token encryption failed')
  process.exit(1)
})
