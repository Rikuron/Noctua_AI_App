# Firebase Setup Guide

## Firestore Security Rules Configuration

To enable notebook creation and management AND access to PDF collections, you need to configure Firestore security rules in your Firebase Console.

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `noctua-ai-app-6efb9`
3. Navigate to **Firestore Database** → **Rules**

### Step 2: Update Security Rules for PDFs Access
Replace your **existing rules** with this updated version that adds PDF collection access:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Notebooks - users can only access their own notebooks
    match /notebooks/{notebookId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      
      // Sources subcollection - inherits notebook ownership
      match /sources/{sourceId} {
        allow read, write: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/notebooks/$(notebookId)).data.userId;
        allow create: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/notebooks/$(notebookId)).data.userId;
      }
      
      // Summaries subcollection - inherits notebook ownership
      match /summaries/{summaryId} {
        allow read, write: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/notebooks/$(notebookId)).data.userId;
        allow create: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/notebooks/$(notebookId)).data.userId;
      }
      
      // Chats subcollection - inherits notebook ownership
      match /chats/{chatId} {
        allow read, write: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/notebooks/$(notebookId)).data.userId;
        allow create: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/notebooks/$(notebookId)).data.userId;
      }
    }
    
    // ===== ADD THESE PDF COLLECTION RULES =====
    // Global PDF collections - allow authenticated users to read
    match /pdfs/{pdfId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /files/{fileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /documents/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /uploads/{uploadId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /materials/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    // ==========================================
    
    // Deny all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Key Changes:**
- Added rules for `pdfs`, `files`, `documents`, `uploads`, and `materials` collections
- These rules are placed **before** the final deny-all rule
- Allows any authenticated user to read/write these collections

### Step 3: Alternative - Open Rules for Development (Simpler)
If you want to quickly test and access all PDFs without restrictions, you can use these open rules temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Note: This allows all authenticated users to access any document. Use only for development/testing!**

### Step 4: Publish Rules
1. Click **Publish** to save the changes
2. Wait 30-60 seconds for the rules to propagate

### What This Fixes
With the updated rules, your app will be able to:
- ✅ Access the global `pdfs` collection (where the 4 PDFs likely are)
- ✅ Read from `files`, `documents`, `uploads`, `materials` collections
- ✅ Access notebook subcollections
- ✅ Maintain security for user-specific data

### Expected Result
After updating the rules, refresh your Material Repository page and you should see the 4 PDFs that your teammate uploaded!
