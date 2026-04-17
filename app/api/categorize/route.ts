import { NextResponse } from 'next/server'

interface TransactionInput {
  id: string
  description: string
  amount: number
}

interface CategorizeRequest {
  transactions: TransactionInput[]
  categories: string[]
  userNotes?: string
}

// Simple in-memory rate limiter (resets on cold start, which is fine for Vercel)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per window
const RATE_WINDOW = 60 * 1000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return false
  }

  record.count++
  if (record.count > RATE_LIMIT) {
    return true
  }

  return false
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const body: CategorizeRequest = await request.json()
    const { transactions, categories, userNotes } = body

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 })
    }

    // Cap transactions per request to prevent abuse
    if (transactions.length > 500) {
      return NextResponse.json({ error: 'Too many transactions. Please upload one month at a time.' }, { status: 400 })
    }

    // Create a prompt for categorization
    const transactionsList = transactions
      .map(t => `- "${t.description}" ($${t.amount.toFixed(2)})`)
      .join('\n')

    const prompt = `You are a financial categorization assistant. Categorize each transaction into ONE of these categories: ${categories.join(', ')}.

${userNotes ? `User notes: ${userNotes}\n` : ''}
Transactions to categorize:
${transactionsList}

Respond with ONLY a JSON array where each object has "id" and "category" fields. The id should match the transaction order (0-indexed).
Example: [{"id": "0", "category": "Groceries"}, {"id": "1", "category": "Transportation"}]

Rules:
- Use "Uncategorized" for anything that doesn't clearly fit
- "Drinks" is for bars and alcohol
- "Food" is for delivery/takeout
- "Dining Out" is for sit-down restaurants
- Refunds (negative amounts) should still be categorized by what they were for`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json(
        { error: 'Something went wrong on our end. Your data is still safe in your browser.' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('Could not parse AI response:', content)
      return NextResponse.json(
        { error: 'Could not parse AI response' },
        { status: 500 }
      )
    }

    const categorizations = JSON.parse(jsonMatch[0])

    // Map back to transaction IDs
    const result: Record<string, string> = {}
    categorizations.forEach((c: { id: string; category: string }, index: number) => {
      const transaction = transactions[index] || transactions[parseInt(c.id)]
      if (transaction) {
        result[transaction.id] = c.category
      }
    })

    return NextResponse.json({ categorizations: result })
  } catch (error) {
    console.error('Categorization error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
