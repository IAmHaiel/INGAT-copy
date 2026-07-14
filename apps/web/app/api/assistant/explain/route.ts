import { NextResponse } from 'next/server';
import { generateText } from '@ingat/ai';
import { models } from '@ingat/ai';

export async function POST(req: Request) {
  try {
    const { amount, splitRatio, unlockDate } = await req.json();

    if (!amount || splitRatio === undefined || !unlockDate) {
      return NextResponse.json({ error: 'Missing transaction details' }, { status: 400 });
    }

    const spendingAmount = parseFloat(amount) * (splitRatio / 100);
    const goalAmount = parseFloat(amount) * ((100 - splitRatio) / 100);

    const { text } = await generateText({
      model: models.fast,
      prompt: `Write exactly ONE plain-language sentence summarizing a successful remittance. 
The total amount received is ${amount} XLM. 
${spendingAmount} XLM is available immediately. 
${goalAmount} XLM is locked until ${unlockDate}. 
The sentence should feel warm and human. Do not include any other text or explanation.`,
    });

    return NextResponse.json({ explanation: text.trim() });
  } catch (error) {
    console.error('Error generating explainer:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
