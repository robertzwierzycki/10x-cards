# 10xCards API Documentation

Comprehensive REST API for the 10xCards flashcard application.

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [GET /api/decks/:id](#get-apidecksid)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)

---

## Authentication

All API endpoints require JWT authentication via Supabase Auth.

### Getting a Token

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sign in to get token
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

const token = data.session.access_token;
```

### Using the Token

Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### GET /api/decks/:id

Retrieves detailed information about a specific deck including all flashcards.

**URL:** `/api/decks/{id}`

**Method:** `GET`

**Auth Required:** Yes

**Permissions:** Deck owner only

#### URL Parameters

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `id`      | string | Yes      | UUID of the deck      |

#### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "JavaScript Basics",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "flashcards": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "deck_id": "550e8400-e29b-41d4-a716-446655440000",
      "front": "What is a closure?",
      "back": "A function that has access to outer scope variables",
      "is_ai_generated": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "deck_id": "550e8400-e29b-41d4-a716-446655440000",
      "front": "What is hoisting?",
      "back": "Variable and function declarations are moved to the top",
      "is_ai_generated": true,
      "created_at": "2024-01-02T12:00:00Z",
      "updated_at": "2024-01-02T12:00:00Z"
    }
  ]
}
```

#### Error Responses

##### 400 Bad Request - Invalid UUID

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "message": "Invalid deck ID format",
      "path": ["id"]
    }
  ]
}
```

##### 401 Unauthorized - Missing/Invalid Token

```json
{
  "error": "Authentication required"
}
```

##### 404 Not Found - Deck Doesn't Exist or Access Denied

```json
{
  "error": "Deck not found"
}
```

**Note:** For security reasons, this endpoint returns 404 for both non-existent decks and decks owned by other users. This prevents information disclosure about deck existence.

##### 500 Internal Server Error

```json
{
  "error": "Failed to retrieve deck"
}
```

---

## Error Handling

All errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
  details?: unknown[]; // Optional array of detailed errors (e.g., validation)
  retry_after?: number; // Seconds to wait (for rate limits)
}
```

### HTTP Status Codes

| Code | Meaning                     | Description                                     |
| ---- | --------------------------- | ----------------------------------------------- |
| 200  | OK                          | Request successful                              |
| 400  | Bad Request                 | Invalid input (validation failed)               |
| 401  | Unauthorized                | Missing or invalid authentication               |
| 403  | Forbidden                   | Valid auth but insufficient permissions         |
| 404  | Not Found                   | Resource doesn't exist                          |
| 429  | Too Many Requests           | Rate limit exceeded                             |
| 500  | Internal Server Error       | Server error                                    |

---

## Code Examples

### cURL

```bash
# Get deck with flashcards
curl -X GET "http://localhost:3000/api/decks/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript (fetch)

```typescript
async function getDeckWithFlashcards(deckId: string, token: string) {
  const response = await fetch(`http://localhost:3000/api/decks/${deckId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const deck = await getDeckWithFlashcards(
    '550e8400-e29b-41d4-a716-446655440000',
    'your-jwt-token'
  );
  console.log(`Deck: ${deck.name}`);
  console.log(`Flashcards: ${deck.flashcards.length}`);
} catch (error) {
  console.error('Failed to fetch deck:', error.message);
}
```

### JavaScript/TypeScript (axios)

```typescript
import axios from 'axios';

async function getDeckWithFlashcards(deckId: string, token: string) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/decks/${deckId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Unknown error');
    }
    throw error;
  }
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import type { DeckWithFlashcardsDTO } from '@/types';

function useDeck(deckId: string, token: string) {
  const [deck, setDeck] = useState<DeckWithFlashcardsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeck() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/decks/${deckId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        const data = await response.json();
        setDeck(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (deckId && token) {
      fetchDeck();
    }
  }, [deckId, token]);

  return { deck, loading, error };
}

// Usage in component
function DeckViewer({ deckId }: { deckId: string }) {
  const token = useAuthToken(); // Your auth hook
  const { deck, loading, error } = useDeck(deckId, token);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div>
      <h1>{deck.name}</h1>
      <p>{deck.flashcards.length} flashcards</p>
      <ul>
        {deck.flashcards.map((card) => (
          <li key={card.id}>
            <strong>{card.front}</strong>
            <p>{card.back}</p>
            {card.is_ai_generated && <span>🤖 AI Generated</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Python Example

```python
import requests
from typing import Optional, Dict, Any

def get_deck_with_flashcards(
    deck_id: str,
    token: str,
    base_url: str = "http://localhost:3000"
) -> Optional[Dict[str, Any]]:
    """
    Fetch deck with flashcards from 10xCards API.

    Args:
        deck_id: UUID of the deck
        token: JWT authentication token
        base_url: Base URL of the API

    Returns:
        Dict containing deck data or None if not found

    Raises:
        requests.HTTPError: If request fails
    """
    url = f"{base_url}/api/decks/{deck_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return None
    else:
        response.raise_for_status()

# Usage
try:
    deck = get_deck_with_flashcards(
        deck_id="550e8400-e29b-41d4-a716-446655440000",
        token="your-jwt-token"
    )

    if deck:
        print(f"Deck: {deck['name']}")
        print(f"Flashcards: {len(deck['flashcards'])}")
    else:
        print("Deck not found")

except requests.HTTPError as e:
    print(f"Error: {e.response.json().get('error', 'Unknown error')}")
```

---

## Best Practices

### Caching

The endpoint returns `Cache-Control: private, max-age=300` header. Client applications should:

- Cache responses for up to 5 minutes
- Invalidate cache after deck/flashcard mutations
- Use ETags for conditional requests (if implemented)

### Error Handling

Always handle all possible HTTP status codes:

```typescript
async function fetchDeckSafe(deckId: string, token: string) {
  try {
    const response = await fetch(`/api/decks/${deckId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    switch (response.status) {
      case 200:
        return await response.json();
      case 400:
        throw new Error('Invalid deck ID format');
      case 401:
        throw new Error('Please log in to continue');
      case 404:
        throw new Error('Deck not found or access denied');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error('Unexpected error');
    }
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

### Performance Tips

1. **Batch Requests**: If fetching multiple decks, consider implementing a batch endpoint
2. **Pagination**: For decks with >1000 flashcards, use the paginated flashcard endpoint
3. **Selective Fields**: Consider implementing field selection (e.g., `?fields=id,name`)

---

## Rate Limits

| Endpoint Type | Limit                    |
| ------------- | ------------------------ |
| AI Generation | 10 requests/minute/user  |
| Other APIs    | 100 requests/minute/user |

When rate limit is exceeded, the API returns 429 with a `Retry-After` header indicating seconds to wait.

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourorg/10xcards/issues
- Email: support@10xcards.app
- Documentation: https://docs.10xcards.app
