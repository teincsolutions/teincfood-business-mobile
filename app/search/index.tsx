// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Keyboard } from 'react-native';
import { YStack, XStack, Text, Separator, Input as TInput } from 'tamagui';
import { Search as SearchIcon, X, Clock, SlidersHorizontal } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, BackButton } from '@/components/ui';
import { FoodCard, RestaurantCard } from '@/components/home';
import { useSearchStore } from '@/stores/search.store';
import { useSearchCatalogQuery } from '@/services/search.service';

import { FilterSheet } from '@/components/search/FilterSheet';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const recentSearches = useSearchStore((state) => state.recentSearches);
  const addSearch = useSearchStore((state) => state.addSearch);
  const removeSearch = useSearchStore((state) => state.removeSearch);
  const clearSearches = useSearchStore((state) => state.clearSearches);

  // Debounced search effect (mocking a backend call)
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults } = useSearchCatalogQuery(debouncedQuery);
  const resultsFoods = searchResults?.foods || [];
  const resultsRestaurants = searchResults?.restaurants || [];

  const handleSearchCommit = (term: string) => {
    if (term.trim()) {
      addSearch(term.trim());
      setQuery(term);
      Keyboard.dismiss();
    }
  };

  const handleApplyFilters = (filters) => {
    // Usually this modifies the backend API query parameters. 
    // This completes the mock setup.
    console.log('Applied filters:', filters);
  };

  const hasResults = resultsFoods.length > 0 || resultsRestaurants.length > 0;
  const isQuerying = debouncedQuery.trim().length > 0;

  return (
    <>
      <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
        
        {/* Search Header */}
        <XStack alignItems="center" paddingHorizontal="$5" gap="$3" paddingBottom="$3">
          <BackButton />
          <XStack flex={1} alignItems="center" backgroundColor="$backgroundSoft" borderRadius="$4" paddingHorizontal="$4" height={56}>
            <SearchIcon size={20} color="$colorSecondary" />
            <TInput
              flex={1} 
              placeholder="Search for dishes..." 
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={(e) => handleSearchCommit(e.nativeEvent.text)}
              autoFocus
              backgroundColor="transparent"
              color="$color"
              borderWidth={0}
              height={56}
              fontFamily="$body"
              fontSize="$4"
              focusStyle={{ borderWidth: 0, backgroundColor: 'transparent' }}
              paddingHorizontal="$2"
              placeholderTextColor="$colorSecondary"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Button
                width={32}
                height={32}
                circular
                variant="ghost"
                backgroundColor="transparent"
                padding={0}
                onPress={() => setQuery('')}
              >
                 <X size={16} color="$colorSecondary" />
              </Button>
            )}
          </XStack>
          <Button 
            width={44}
            height={44}
            variant="ghost" 
            circular 
            backgroundColor="transparent"
            padding={0}
            icon={<SlidersHorizontal size={22} color="$primary" />} 
            onPress={() => setShowFilters(true)}
          />
        </XStack>

        {/* Content Area */}
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <YStack padding="$5" paddingBottom="$10">
            
            {/* Empty State: Recent Searches */}
            {!isQuerying && (
              <YStack gap="$4">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Recent Searches
                  </Text>
                  {recentSearches.length > 0 && (
                    <Button variant="ghost" size="$2" onPress={clearSearches}>
                      <Text fontSize="$3" color="$red" fontFamily="$body">Clear All</Text>
                    </Button>
                  )}
                </XStack>

                {recentSearches.length === 0 ? (
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center" marginTop="$4">
                    No recent searches
                  </Text>
                ) : (
                  <YStack gap="$2">
                    {recentSearches.map(term => (
                      <XStack key={term} justifyContent="space-between" alignItems="center">
                        <Button 
                          variant="ghost" 
                          flex={1} 
                          justifyContent="flex-start" 
                          icon={<Clock size={16} color="$colorSecondary" />}
                          onPress={() => handleSearchCommit(term)}
                        >
                          <Text fontSize="$4" color="$color" fontFamily="$body">{term}</Text>
                        </Button>
                        <Button size="$2" circular variant="ghost" onPress={() => removeSearch(term)}>
                          <X size={16} color="$colorSecondary" />
                        </Button>
                      </XStack>
                    ))}
                  </YStack>
                )}
              </YStack>
            )}

            {/* Search Results */}
            {isQuerying && (
              <YStack gap="$6">
                {!hasResults ? (
                  <YStack alignItems="center" gap="$3" marginTop="$10">
                    <SearchIcon size={48} color="$gray200" />
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      No results found
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                      We couldn't find any exact matches for "{debouncedQuery}".
                    </Text>
                  </YStack>
                ) : (
                  <>
                    {/* Restaurant Results */}
                    {resultsRestaurants.length > 0 && (
                      <YStack gap="$4">
                        <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                          Restaurants
                        </Text>
                        <YStack gap="$4">
                          {resultsRestaurants.map(rest => (
                            <RestaurantCard key={rest.id} restaurant={rest} />
                          ))}
                        </YStack>
                        {resultsFoods.length > 0 && <Separator borderColor="$gray100" />}
                      </YStack>
                    )}

                    {/* Food Results */}
                    {resultsFoods.length > 0 && (
                      <YStack gap="$4">
                        <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                          Dishes
                        </Text>
                        <XStack flexWrap="wrap" justifyContent="space-between" gap="$4">
                          {resultsFoods.map(food => (
                            <YStack key={food.id} width="47%">
                              <FoodCard food={food} width="100%" marginRight={0} />
                            </YStack>
                          ))}
                        </XStack>
                      </YStack>
                    )}
                  </>
                )}
              </YStack>
            )}

          </YStack>
        </ScrollView>
      </YStack>
      
      <FilterSheet 
        open={showFilters} 
        onOpenChange={setShowFilters} 
        onApply={handleApplyFilters} 
      />
    </>
  );
}
