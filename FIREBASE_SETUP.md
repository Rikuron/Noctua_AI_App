# Firebase Setup Guide

## Firestore Security Rules Configuration

To enable notebook creation and management, you need to configure Firestore security rules in your Firebase Console.

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `noctua-ai-app-6efb9`
3. Navigate to **Firestore Database** → **Rules**

### Step 2: Update Security Rules
Replace the existing rules with this configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own notebooks
    match /notebooks/{notebookId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Allow authenticated users to read and write their own sources
    match /sources/{sourceId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Deny all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** to save the changes
2. Wait a few seconds for the rules to propagate

### For Development Only (Quick Test)
If you want to test quickly during development, you can temporarily use these open rules:

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

**⚠️ Important: Change back to secure rules for production!**

### Troubleshooting
- **Permission denied errors**: Make sure you're signed in with an MSU-IIT email
- **Rules not working**: Wait 30-60 seconds after publishing rules
- **Still having issues**: Check the Firebase Console → Authentication → Users to verify your account is properly authenticated
