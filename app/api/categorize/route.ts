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

export async function POST(request: Request) {
  try {
    const body: CategorizeRequest = await request.json()
    const { transactions, categories, userNotes } = body

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 })
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
- Use "Misc" for anything that doesn't clearly fit
- "Drinks" is for bars and alcohol
- "Food" is for delivery/takeout
- "Dining Out" is for sit-down restaurants
- Refunds (negative amounts) should still be categorized by what they were for`

    // Call Anthropic API via Vercel AI Gateway
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
        { error: 'AI categorization failed. Please try again.' },
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
