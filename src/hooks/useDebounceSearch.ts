import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

interface UseDebounceSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebounceSearch(
  initialValue: string = '',
  options: UseDebounceSearchOptions = {}
) {
  const { delay = 500, minLength = 0 } = options;
  
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedValue] = useDebounce(searchTerm, delay);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm !== debouncedValue) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedValue]);

  const shouldSearch = debouncedValue.length >= minLength;

  return {
    searchTerm,
    setSearchTerm,
    debouncedValue: shouldSearch ? debouncedValue : '',
    isSearching,
    shouldSearch,
  };
}
