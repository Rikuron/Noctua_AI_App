# NotebookLM-style App Migration Plan

## Overview

Transform the current chat-focused app into a NotebookLM-style application with notebooks, source materials, AI-powered chat, and automatic summary generation using Firebase Authentication and Google Gemini API.

## 1. Authentication Migration (Clerk → Firebase)

### Remove Clerk Dependencies

- Uninstall `@clerk/clerk-react` package
- Remove Clerk environment variables from `.env`
- Delete `src/components/userButton.tsx` (Clerk-specific)

### Implement Firebase Authentication

- Update `src/components/authProvider.tsx` to use Firebase Auth instead of Clerk
- Create Firebase Auth context with sign-in, sign-up, and sign-out methods
- Support email/password and Google OAuth for MSU-IIT students
- Update `src/components/signIn.tsx` with custom Firebase auth UI
- Create new `src/components/userButton.tsx` for Firebase user management

### Update Protected Routes

- Modify `ProtectedRoute` component to use Firebase auth state
- Update route redirects to check Firebase authentication

## 2. Data Structure & Firestore Schema

### Firestore Collections

```
notebooks/
  {notebookId}/
    - id: string
    - userId: string
    - name: string
    - description: string
    - createdAt: timestamp
    - updatedAt: timestamp
    
    sources/ (subcollection)
      {sourceId}/
        - id: string
        - name: string
        - url: string (Firebase Storage URL)
        - size: number
        - uploadedAt: timestamp
        - extractedText: string
        - type: 'pdf' | 'docx' | 'txt'
    
    summaries/ (subcollection)
      {summaryId}/
        - id: string
        - content: string
        - generatedAt: timestamp
        - sourceIds: string[] (references to sources)
    
    chats/ (subcollection)
      {chatId}/
        - id: string
        - messages: array
          - role: 'user' | 'assistant'
          - content: string
          - timestamp: timestamp
        - createdAt: timestamp
```

## 3. Routes Restructure

### New Route Structure

- `/sign-in` - Authentication page (Firebase)
- `/` - Notebooks homepage (list of all user notebooks)
- `/notebooks/:notebookId` - Notebook detail page (3-section layout)

### Files to Create/Update

- `src/routes/index.tsx` - Notebooks list page (replaces current chat interface)
- `src/routes/notebooks.$notebookId.tsx` - New notebook detail page
- Update `src/routes/__root.tsx` - Keep auth provider wrapper

## 4. Google Gemini Integration

### Setup

- Install `@google/generative-ai` package
- Add `VITE_GEMINI_API_KEY` to environment variables
- Create `src/lib/gemini.ts` for Gemini API client

### PDF Text Extraction

- Install `pdf-parse` or `pdfjs-dist` for client-side PDF text extraction
- Create `src/lib/pdfExtractor.ts` for extracting text from PDFs

### Features

- **Summary Generation**: Use Gemini to generate summaries from extracted PDF text
- **Chat with Context**: Send user questions + extracted text as context to Gemini
- **Streaming Responses**: Implement streaming for real-time chat responses

## 5. Component Development

### Homepage Components

- `src/components/notebookCard.tsx` - Individual notebook card display
- `src/components/notebookList.tsx` - Grid of notebooks with add button
- `src/components/createNotebookDialog.tsx` - Modal for creating new notebooks

### Notebook Detail Components

- `src/components/notebook/sourcesPanel.tsx` - Left panel for source uploads
- `src/components/notebook/chatPanel.tsx` - Middle panel for AI chat
- `src/components/notebook/studyMaterialsPanel.tsx` - Right panel for summaries
- `src/components/notebook/notebookLayout.tsx` - 3-column layout wrapper

### Reusable Components

- Keep existing `src/components/pdfUpload.tsx` (adapt for notebooks)
- Keep existing `src/components/loadingSpinner.tsx`
- Keep sidebar styling for consistent branding

## 6. Custom Hooks

### New Hooks

- `src/hooks/useNotebooks.ts` - Fetch user's notebooks
- `src/hooks/useNotebookSources.ts` - Fetch sources for a notebook
- `src/hooks/useNotebookSummaries.ts` - Fetch summaries for a notebook
- `src/hooks/useNotebookChat.ts` - Handle chat state and Gemini API calls
- Update `src/hooks/useFirebaseAuth.ts` - Enhanced auth hook

### Existing Hooks

- Adapt `src/hooks/usePDFs.ts` logic for notebook sources

## 7. Key Features Implementation

### Auto-Summary Generation Flow

1. User uploads PDF(s) to notebook
2. Extract text from PDF using pdfjs-dist
3. Store extracted text in Firestore source document
4. Automatically call Gemini API to generate summary
5. Store summary in Firestore summaries subcollection
6. Display summary in right panel

### Chat with Sources Flow

1. User types question in chat panel
2. Retrieve all source texts from notebook
3. Construct prompt: "Given these sources: [texts...], answer: [question]"
4. Send to Gemini API with streaming
5. Display response in chat panel
6. Save chat history to Firestore

### Upload More Sources

- Allow adding PDFs after initial upload
- Regenerate summary including all sources (old + new)
- Update chat context to include new sources

## 8. UI/UX Enhancements

### 3-Section Layout (Notebook Detail)

- Left: 25% width - Source list with upload button
- Middle: 50% width - Chat interface with message history
- Right: 25% width - Tabs for different study materials (Summaries for MVP)

### Responsive Design

- Stack sections vertically on mobile
- Collapsible panels for better mobile UX
- Keep existing dark theme and gradient accents

## 9. Environment Variables

### Required Variables

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
```

## 10. Implementation Order

1. Remove Clerk and implement Firebase Auth
2. Create Firestore data structure and notebooks homepage
3. Integrate Google Gemini API (basic setup)
4. Build notebook detail page layout
5. Implement PDF upload and text extraction
6. Implement auto-summary generation
7. Implement chat with sources
8. Polish UI and add loading states
9. Test end-to-end flow

## Files to Delete

- Current sidebar navigation (replace with notebook-specific UI)
- Clerk-specific components
- `/repository` route (functionality moves to notebook detail)

## Files to Keep & Adapt

- `src/firebase.ts` - Already configured
- `src/components/loadingSpinner.tsx`
- Design system and styling from `src/styles.css`