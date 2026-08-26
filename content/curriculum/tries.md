# Prefix trees

## Overview

A trie stores strings one character per edge, sharing nodes for common prefixes. Mark word endings separately because a prefix is not automatically a complete word.

## Recognition signals

Repeated prefix lookup, autocomplete, dictionary exploration, and search that benefits from abandoning impossible prefixes early.

## Complexity

Insert and lookup take `O(L)` time for a word of length `L`; space reflects the total stored characters, reduced by shared prefixes.

## Common mistakes and practice

Do not create nodes during lookup or forget end markers. Practice implementing insert/search, prefix search, and a board word search with trie-based pruning.
