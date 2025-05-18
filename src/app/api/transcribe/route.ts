import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    if (!RAPIDAPI_KEY) {
      throw new Error('RapidAPI key is not configured');
    }

    console.log('Fetching transcript for video ID:', videoId);
    const response = await axios.get(
      `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        },
      }
    );

    if (!response.data?.transcript) {
      throw new Error('No transcript found in response');
    }

    // Combine all transcript segments into a single string
    const transcript = response.data.transcript
      .map((segment: any) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcript) {
      throw new Error('No text content found in transcript');
    }

    console.log('Successfully fetched transcript');
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    if (!RAPIDAPI_KEY) {
      return NextResponse.json(
        { message: 'RapidAPI key is not configured' },
        { status: 500 }
      );
    }

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
    let rawTranscript;
    try {
      rawTranscript = await fetchTranscript(videoId);
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
      return NextResponse.json(
        { 
          message: 'Unable to fetch transcript. This video might not have captions available or they might be disabled.',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    if (!rawTranscript.trim()) {
      return NextResponse.json(
        { message: 'No transcript content found for this video' },
        { status: 400 }
      );
    }

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
      { 
        message: 'Failed to process transcript',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
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