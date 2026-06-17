import { config } from 'dotenv'
import { resolve } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

config({ path: resolve(process.cwd(), '.env.local') })

async function testClaudeAPI() {
  console.log('\n========== TESTING CLAUDE API ==========')

  const apiKey = process.env.ANTHROPIC_API_KEY
  console.log('API Key present:', !!apiKey)
  console.log('API Key format:', apiKey?.substring(0, 15) + '...')

  if (!apiKey) {
    console.log('❌ No Claude API key found')
    return
  }

  const anthropic = new Anthropic({ apiKey })

  // Test with different models
  const modelsToTest = [
    'claude-opus-4-8',
    'claude-sonnet-4-6',
    'claude-haiku-4-5',
  ]

  for (const model of modelsToTest) {
    try {
      console.log(`\nTesting model: ${model}`)
      const response = await anthropic.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      console.log(`✅ ${model} - WORKS!`)
      console.log('Response:', response.content[0])
      break // Stop on first working model
    } catch (error: any) {
      console.log(`❌ ${model} - FAILED`)
      console.log('Error:', error.status, error.message || error.error?.message)
    }
  }
}

async function testOpenAIAPI() {
  console.log('\n\n========== TESTING OPENAI API ==========')

  const apiKey = process.env.OPENAI_API_KEY
  console.log('API Key present:', !!apiKey)
  console.log('API Key format:', apiKey?.substring(0, 20) + '...')

  if (!apiKey) {
    console.log('❌ No OpenAI API key found')
    return
  }

  const openai = new OpenAI({ apiKey })

  // Test with different models
  const modelsToTest = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ]

  for (const model of modelsToTest) {
    try {
      console.log(`\nTesting model: ${model}`)
      const response = await openai.chat.completions.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      console.log(`✅ ${model} - WORKS!`)
      console.log('Response:', response.choices[0]?.message?.content)
      break // Stop on first working model
    } catch (error: any) {
      console.log(`❌ ${model} - FAILED`)
      console.log('Error:', error.status, error.message)
    }
  }
}

async function main() {
  console.log('Testing API Keys and Models...\n')

  await testClaudeAPI()
  await testOpenAIAPI()

  console.log('\n========== TEST COMPLETE ==========\n')
}

main()
