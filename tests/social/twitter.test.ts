import { describe, expect, it } from 'vitest'
import { countCharacters, splitIntoTweets } from '@/lib/social/clients/twitter'

describe('Twitter text helpers', () => {
  it('weights every URL as 23 characters', () => {
    expect(countCharacters('See https://example.com/a/very/long/path now')).toBe(
      'See  now'.length + 23
    )
  })

  it('keeps short content in one unnumbered tweet', () => {
    expect(splitIntoTweets('A short post')).toEqual(['A short post'])
  })

  it('splits long content without losing words and numbers the thread', () => {
    const tweets = splitIntoTweets('alpha beta gamma delta epsilon zeta', 18)

    expect(tweets.length).toBeGreaterThan(1)
    expect(tweets.every((tweet) => /^\d+\/\d+ /.test(tweet))).toBe(true)
    expect(tweets.map((tweet) => tweet.replace(/^\d+\/\d+ /, '')).join(' ')).toBe(
      'alpha beta gamma delta epsilon zeta'
    )
  })

  it('keeps a long URL intact while applying weighted length', () => {
    const url = 'https://example.com/this/path/is/much/longer/than/twenty-three'
    const tweets = splitIntoTweets(`Intro words ${url} closing words`, 30)

    expect(tweets.some((tweet) => tweet.includes(url))).toBe(true)
    expect(tweets.every((tweet) => countCharacters(tweet) <= 280)).toBe(true)
  })

  it('splits a single oversized non-URL token without data loss', () => {
    const token = 'x'.repeat(50)
    const tweets = splitIntoTweets(token, 20)

    expect(tweets.map((tweet) => tweet.replace(/^\d+\/\d+ /, '')).join('')).toBe(token)
  })
})
