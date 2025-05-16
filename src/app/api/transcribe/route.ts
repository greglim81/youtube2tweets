import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { message: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { message: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Combine all transcript segments into one text
    const rawTranscript = transcript
      .map((segment) => segment.text)
      .join(' ');

    // Use OpenAI to improve readability
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that improves the readability of transcripts while preserving all the original content. Add proper punctuation, fix grammar, and organize the text into paragraphs where appropriate. Do not add or remove any information from the original transcript."
        },
        {
          role: "user",
          content: rawTranscript
        }
      ],
      temperature: 0.1,
    });

    const improvedTranscript = completion.choices[0].message.content;

    return NextResponse.json({ transcript: improvedTranscript });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
} 