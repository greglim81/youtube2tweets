import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { message: 'Transcript is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that converts transcripts into a series of tweets. Each tweet must be 280 characters or less. Break the content into logical, self-contained tweets that maintain context and flow. Number each tweet. Make sure each tweet is engaging and can stand on its own."
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.7,
    });

    const tweetsText = completion.choices[0].message.content;
    
    if (!tweetsText) {
      throw new Error('Failed to generate tweets');
    }

    // Split the response into individual tweets and clean them up
    const tweets = tweetsText
      .split('\n')
      .map(tweet => tweet.replace(/^\d+\.\s*/, '').trim())
      .filter(tweet => tweet.length > 0 && tweet.length <= 280);

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error('Repurpose error:', error);
    return NextResponse.json(
      { message: 'Failed to repurpose transcript' },
      { status: 500 }
    );
  }
} 