import { NextResponse } from 'next/server';
import { generateText } from '@ingat/ai';
import { models } from '@ingat/ai';

export async function POST(req: Request) {
  try {
    const { totalRemitted, activeLocks, allocationsCount } = await req.json();

    if (totalRemitted === undefined || activeLocks === undefined || allocationsCount === undefined) {
      return NextResponse.json({ error: 'Missing history stats' }, { status: 400 });
    }

    const { text } = await generateText({
      model: models.fast,
      prompt: `Write exactly ONE short, encouraging sentence summarizing a user's remittance history. 
They have made ${allocationsCount} total deposits. 
They have ${activeLocks} active locked goals on-chain. 
They have remitted a total of ${totalRemitted} XLM. 
Keep it very brief (under 15 words) and human. No extra formatting.`,
    });

    return NextResponse.json({ summary: text.trim() });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
