# Intric AI Platform Integration Guide

This guide provides detailed information about integrating with the Intric AI platform.

## Base URL
```
https://sundsvall.backend.intric.ai
```

## Authentication

Authentication is handled using OAuth2 password flow. The platform requires a client ID and client secret for authentication.

### Obtaining Authentication Token
```typescript
POST /api/v1/users/login/token/
Content-Type: application/x-www-form-urlencoded

grant_type=password&username={clientId}&password={clientSecret}
```

The response includes an access token that should be included in subsequent requests:
```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

## Session Management

### Creating a New Session
```typescript
POST /api/v1/assistants/{assistantId}/sessions/
Authorization: Bearer {token}
```

### Interacting with a Session
```typescript
POST /api/v1/assistants/{assistantId}/sessions/{sessionId}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Your question here",
  "files": ["file-id-1", "file-id-2"],
  "stream": false
}
```

## File Operations

### Uploading Files
```typescript
POST /api/v1/files/
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form data:
- upload_file: (binary)
```

### Deleting Files
```typescript
DELETE /api/v1/files/{fileId}/
Authorization: Bearer {token}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error description",
  "intric_error_code": 9000
}
```

## Best Practices

1. Token Management
   - Store tokens securely
   - Implement token refresh logic
   - Handle token expiration gracefully

2. Error Handling
   - Implement comprehensive error handling
   - Log errors appropriately
   - Provide meaningful error messages to users

3. File Operations
   - Validate file types before upload
   - Implement file size checks
   - Handle upload timeouts

4. Session Management
   - Maintain session state
   - Clean up unused sessions
   - Handle session timeouts

## Type Safety

The integration includes TypeScript definitions for all API responses and requests. Use these types to ensure type safety in your application.

## Example Usage

```typescript
import { IntricClient } from './lib/intric';

async function example() {
  // Initialize client
  const client = new IntricClient('your-client-id', 'your-client-secret');

  // Create session
  const session = await client.createSession('assistant-id');

  // Upload file
  const file = new File(['content'], 'example.txt');
  const uploadedFile = await client.uploadFile(file);

  // Interact with session
  const response = await client.interactWithSession(
    'assistant-id',
    session.id,
    'What can you tell me about this document?',
    [uploadedFile.id]
  );

  console.log(response.answer);
}
```

## Security Considerations

1. Credential Management
   - Never expose client credentials in client-side code
   - Use environment variables for sensitive data
   - Implement proper credential rotation

2. Data Protection
   - Implement TLS for all API communications
   - Validate and sanitize all user inputs
   - Implement proper access controls

3. Session Security
   - Implement session timeouts
   - Validate session ownership
   - Implement rate limiting

## Support

For additional support or questions, contact the Intric AI support team.