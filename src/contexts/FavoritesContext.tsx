'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ref, set, remove, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface FavoriteTweet {
  id: string;
  text: string;
  timestamp: number;
  videoUrl?: string;
}

interface FavoritesContextType {
  favorites: FavoriteTweet[];
  addFavorite: (tweet: { id: string; text: string; videoUrl?: string }) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({} as FavoritesContextType);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteTweet[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const favoritesRef = ref(database, `users/${user.uid}/favorites`);
    
    onValue(favoritesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const favoritesArray = Object.entries(data).map(([id, tweet]: [string, any]) => ({
          id,
          ...tweet,
        }));
        setFavorites(favoritesArray);
      } else {
        setFavorites([]);
      }
    });

    return () => {
      off(favoritesRef);
    };
  }, [user]);

  const addFavorite = async (tweet: { id: string; text: string; videoUrl?: string }) => {
    if (!user) {
      console.log('No user found in addFavorite');
      return;
    }
    const newFavoriteRef = ref(database, `users/${user.uid}/favorites/${tweet.id}`);
    const data: any = {
      text: tweet.text,
      timestamp: Date.now(),
    };
    if (tweet.videoUrl) {
      data.videoUrl = tweet.videoUrl;
    }
    console.log('Writing to path:', `users/${user.uid}/favorites/${tweet.id}`);
    try {
      await set(newFavoriteRef, data);
      console.log('Favorite saved to database:', data);
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const removeFavorite = async (id: string) => {
    if (!user) return;

    const favoriteRef = ref(database, `users/${user.uid}/favorites/${id}`);
    await remove(favoriteRef);
  };

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  return useContext(FavoritesContext);
}; 