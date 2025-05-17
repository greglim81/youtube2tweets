'use client';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function FavoritesPage() {
  const { favorites, removeFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();

  const handleFavorite = async (tweet: { id: string; text: string }) => {
    if (isFavorite(tweet.id)) {
      await removeFavorite(tweet.id);
    }
  };

  const handleTweet = (tweetText: string) => {
    const encodedText = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your favorites</h1>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            My Favorite Tweets
          </h1>
          <Link
            href="/"
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
        
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">You haven't favorited any tweets yet.</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
              Go back to home
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <p className="text-gray-300 flex-1">{favorite.text}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {favorite.text.length}/280 characters
                    </span>
                    {favorite.videoUrl && (
                      <Link
                        href={favorite.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View original video
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFavorite(favorite)}
                      className="p-2 rounded-lg transition-colors bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleTweet(favorite.text)}
                      className="px-4 py-1.5 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Tweet
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {new Date(favorite.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 