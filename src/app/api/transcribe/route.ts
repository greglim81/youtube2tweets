import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CaptionTrack {
  baseUrl: string;
  name: { simpleText: string };
  languageCode: string;
}

async function getCaptionsUrl(videoId: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = response.data;
    
    // Extract caption tracks from the page
    const captionTracksMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!captionTracksMatch) return null;
    
    const captionTracks: CaptionTrack[] = JSON.parse(captionTracksMatch[1]);
    const englishTrack = captionTracks.find(track => 
      track.languageCode === 'en' || track.name.simpleText.toLowerCase().includes('english')
    );
    
    return englishTrack?.baseUrl || null;
  } catch (error) {
    console.error('Error fetching captions URL:', error);
    return null;
  }
}

async function fetchTranscriptWithRetry(videoId: string, maxRetries = 3): Promise<string> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const captionsUrl = await getCaptionsUrl(videoId);
      if (!captionsUrl) {
        throw new Error('No captions available for this video');
      }

      const response = await axios.get(captionsUrl);
      const xml = response.data;
      
      // Extract text from XML
      const textContent = xml
        .replace(/<[^>]+>/g, ' ') // Remove XML tags
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
      
      return textContent;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
}

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

    // Fetch transcript with retry logic
    let rawTranscript;
    try {
      rawTranscript = await fetchTranscriptWithRetry(videoId);
    } catch (error) {
      console.error('Failed to fetch transcript after retries:', error);
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