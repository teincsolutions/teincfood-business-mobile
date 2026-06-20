import { useState, useEffect, useRef, useCallback } from 'react';
import { placesService, type PlaceSuggestion, type PlaceDetails } from '@/services/places.service';

export function usePlacesSearch(debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await placesService.searchPlaces(query);
        if (!cancelled) {
          setSuggestions(results);
        }
      } catch (error) {
        console.error('Places search error:', error);
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setIsLoading(false);
    };
  }, [query, debounceMs]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsLoading(false);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clearSearch,
    clearAll,
  };
}

export function usePlaceDetails(placeId: string | null) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placeId) {
      setDetails(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    placesService.getPlaceDetails(placeId).then((result) => {
      if (!cancelled && result) {
        setDetails(result);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return { details, isLoading };
}

export function clearPlacesCache() {
  placesService.clearCache();
}
