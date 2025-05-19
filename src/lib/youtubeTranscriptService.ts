import axios from 'axios';

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'youtube-transcript3.p.rapidapi.com';

interface TranscriptSegment {
  text: string;
  duration: number;
  offset: number;
  lang: string;
}

interface ApiResponse {
  success: boolean;
  transcript: TranscriptSegment[];
}

export class YouTubeTranscriptService {
  private static instance: YouTubeTranscriptService;
  private readonly headers: Record<string, string>;

  private constructor() {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not defined in environment variables');
    }

    this.headers = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    };
  }

  public static getInstance(): YouTubeTranscriptService {
    if (!YouTubeTranscriptService.instance) {
      YouTubeTranscriptService.instance = new YouTubeTranscriptService();
    }
    return YouTubeTranscriptService.instance;
  }

  public async getTranscript(videoId: string): Promise<string> {
    try {
      console.log('Fetching transcript for video ID:', videoId);
      
      const response = await axios.get<ApiResponse>(
        `https://${RAPIDAPI_HOST}/api/transcript`,
        {
          headers: this.headers,
          params: {
            videoId: videoId,
          },
        }
      );

      console.log('API Response:', response.data);

      if (!response.data.success || !response.data.transcript) {
        throw new Error('No transcript available for this video');
      }

      // Combine all transcript segments into a single string
      const transcriptText = response.data.transcript
        .map(segment => segment.text)
        .join(' ');

      if (!transcriptText) {
        throw new Error('No transcript text found');
      }

      return transcriptText;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(error.response?.data?.message || 'Failed to fetch transcript');
      }
      console.error('Error fetching transcript:', error);
      throw new Error('Failed to fetch transcript');
    }
  }

  public async getTranscriptWithLanguage(videoId: string, language: string): Promise<string> {
    try {
      const response = await axios.get<ApiResponse>(
        `https://${RAPIDAPI_HOST}/api/transcript`,
        {
          headers: this.headers,
          params: {
            videoId: videoId,
            language: language,
          },
        }
      );

      if (!response.data.success || !response.data.transcript) {
        throw new Error('No transcript available for this video');
      }

      // Combine all transcript segments into a single string
      const transcriptText = response.data.transcript
        .map(segment => segment.text)
        .join(' ');

      if (!transcriptText) {
        throw new Error('No transcript text found');
      }

      return transcriptText;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch transcript');
      }
      console.error('Error fetching transcript:', error);
      throw new Error('Failed to fetch transcript');
    }
  }
} 