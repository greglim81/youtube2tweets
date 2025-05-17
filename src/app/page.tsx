'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [tweets, setTweets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTranscript('');
    setTweets([]);
    setIsTranscriptExpanded(true);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transcript');
      }

      setTranscript(data.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRepurpose = async () => {
    if (!transcript) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/repurpose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to repurpose transcript');
      }

      setTweets(data.tweets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTweet = (tweetText: string) => {
    const encodedText = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Greg's YouTube Transcriber
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Transcribing...' : 'Transcribe'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {transcript && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Transcript</h2>
                <button
                  onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isTranscriptExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              {isTranscriptExpanded && (
                <>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {transcript}
                  </div>
                  <button
                    onClick={handleRepurpose}
                    disabled={loading}
                    className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Repurposing...' : 'Repurpose into Tweets'}
                  </button>
                </>
              )}
            </div>

            {tweets.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Tweets</h2>
                <div className="space-y-4">
                  {tweets.map((tweet, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 font-mono">{index + 1}.</span>
                        <p className="text-gray-300">{tweet}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {tweet.length}/280 characters
                        </span>
                        <button
                          onClick={() => handleTweet(tweet)}
                          className="px-4 py-1.5 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          Tweet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
