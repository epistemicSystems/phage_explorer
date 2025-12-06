import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { usePhageStore } from '@phage-explorer/state';
import type { PhageRepository } from '@phage-explorer/db-runtime';

interface SearchOverlayProps {
  repository: PhageRepository;
}

export function SearchOverlay({ repository }: SearchOverlayProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const searchQuery = usePhageStore(s => s.searchQuery);
  const searchResults = usePhageStore(s => s.searchResults);
  const setSearchQuery = usePhageStore(s => s.setSearchQuery);
  const setSearchResults = usePhageStore(s => s.setSearchResults);
  const setCurrentPhageIndex = usePhageStore(s => s.setCurrentPhageIndex);
  const phages = usePhageStore(s => s.phages);
  const closeOverlay = usePhageStore(s => s.closeOverlay);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const colors = theme.colors;

  // Search when query changes
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const doSearch = async () => {
      const results = await repository.searchPhages(searchQuery);
      setSearchResults(results);
      setSelectedIndex(0);
    };

    doSearch();
  }, [searchQuery, repository, setSearchResults]);

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (key.upArrow) {
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (key.return && searchResults.length > 0) {
      // Find the index of this phage in the main list
      const selected = searchResults[selectedIndex];
      const mainIndex = phages.findIndex(p => p.id === selected.id);
      if (mainIndex >= 0) {
        setCurrentPhageIndex(mainIndex);
      }
      closeOverlay();
    } else if (key.escape) {
      closeOverlay();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text color={colors.accent} bold>
          SEARCH PHAGES
        </Text>
      </Box>

      {/* Search input */}
      <Box marginBottom={1}>
        <Text color={colors.textDim}>Search: </Text>
        <TextInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Type to search..."
        />
      </Box>

      {/* Results */}
      <Box flexDirection="column" height={10}>
        {searchResults.length === 0 && searchQuery.length > 0 ? (
          <Text color={colors.textDim}>No results found</Text>
        ) : searchResults.length === 0 ? (
          <Text color={colors.textDim}>
            Search by name, host, family, or accession
          </Text>
        ) : (
          searchResults.slice(0, 10).map((phage, i) => (
            <Box key={phage.id}>
              <Text
                color={i === selectedIndex ? colors.accent : colors.text}
                backgroundColor={i === selectedIndex ? colors.background : undefined}
                bold={i === selectedIndex}
              >
                {i === selectedIndex ? '▶ ' : '  '}
                {phage.name}
              </Text>
              <Text color={colors.textDim}>
                {phage.host ? ` (${phage.host.split(' ')[0]})` : ''}
              </Text>
            </Box>
          ))
        )}
      </Box>

      {/* Instructions */}
      <Box justifyContent="center" marginTop={1}>
        <Text color={colors.textDim}>
          ↑↓ navigate | Enter select | Esc cancel
        </Text>
      </Box>
    </Box>
  );
}
