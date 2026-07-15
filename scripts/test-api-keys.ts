import { config } from 'dotenv'
import { resolve } from 'path'
import OpenAI from 'openai'

config({ path: resolve(process.cwd(), '.env.local') })

async function testOpenRouterAPI() {
  console.log('\n========== TESTING OPENROUTER API ==========')

  const apiKey = process.env.OPENROUTER_API_KEY
  console.log('API Key present:', !!apiKey)
  console.log('API Key format:', apiKey?.substring(0, 12) + '...')

  if (!apiKey) {
    console.log('❌ No OPENROUTER_API_KEY found')
    return
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://www.novique.ai',
      'X-Title': 'Novique test-api-keys',
    },
  })

  const modelsToTest = [
    'qwen/qwen3-32b',
    'deepseek/deepseek-v3.2',
  ]

  for (const model of modelsToTest) {
    try {
      console.log(`\nTesting model: ${model}`)
      const response = await client.chat.completions.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      console.log(`✅ ${model} - WORKS!`)
      console.log('Response:', response.choices[0]?.message?.content)
    } catch (error: any) {
      console.log(`❌ ${model} - FAILED`)
      console.log('Error:', error.status, error.message || error.error?.message)
    }
  }
}

async function testOpenAIAPI() {
  console.log('\n\n========== TESTING OPENAI API (images etc.) ==========')

  const apiKey = process.env.OPENAI_API_KEY
  console.log('API Key present:', !!apiKey)

  if (!apiKey) {
    console.log('❌ No OpenAI API key found')
    return
  }

  const openai = new OpenAI({ apiKey })
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    console.log('✅ gpt-4o-mini - WORKS!')
    console.log('Response:', response.choices[0]?.message?.content)
  } catch (error: any) {
    console.log('❌ OpenAI - FAILED', error.status, error.message)
  }
}

async function main() {
  console.log('Testing API Keys and Models...\n')
  await testOpenRouterAPI()
  await testOpenAIAPI()
  console.log('\n========== TEST COMPLETE ==========\n')
}

main()
