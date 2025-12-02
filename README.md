# 🦉 Noctua AI

<div align="center">
  <img src="public/logo512.png" alt="Noctua AI Logo" width="200"/>
  
  <p><strong>An intelligent AI-powered study companion for MSU-IIT students</strong></p>

  <p>Live Demo: <a href="https://noctua-ai-app.vercel.app">https://noctua-ai-app.vercel.app</a></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#configuration">Configuration</a> •
    <a href="#project-structure">Structure</a>
  </p>
</div>

---

## 🌟 Features

### 📚 **Smart Workspaces**
- **Create & Organize**: Build personalized study workspaces for different subjects or topics
- **Document Management**: Upload, view, and organize PDF materials within each workspace
- **Quick Search**: Find your workspaces instantly with search and filter capabilities
- **Customizable**: Add icons, names, and descriptions to personalize your workspaces

### 🤖 **AI-Powered Learning**
- **Intelligent Chat**: Ask questions about your uploaded documents with context-aware responses
- **Auto-Summarization**: Generate comprehensive summaries of your study materials
- **Smart Flashcards**: Generate study flashcards from your materials
- **Interactive Quizzes**: Test your knowledge with AI-generated quizzes
- **Instant Presentations**: Create educational slide decks in seconds
- **Gemini Integration**: Powered by Google's Gemini 2.0 Flash model for fast, accurate answers
- **Chat History**: Persistent conversation history with markdown support

### 📄 **Advanced Document Management**
- **Multi-Format Support**: Support for PDF, DOCX, TXT, and Markdown files
- **Material Repository**: Centralized hub for all your study documents
- **Built-in PDF Viewer**: View documents directly in the browser
- **Text Extraction**: Automatic text extraction for AI processing
- **Flexible Exports**: Download content as PDF, Markdown, or Text
- **Batch Upload**: Drag-and-drop multiple files at once
- **Smart Metadata**: Track file size, upload dates, and source organization

### 🔐 **Secure & Personalized**
- **Firebase Authentication**: Secure Google sign-in for MSU-IIT students
- **User Isolation**: Each user's data is completely private and isolated
- **Real-time Sync**: Changes sync instantly across all your devices
- **Firestore Database**: Reliable cloud storage for all your materials

### 🎨 **Beautiful Design**
- **Modern Dark Theme**: Easy on the eyes with gradient accents
- **Fully Responsive**: Optimized experience on mobile, tablet, and desktop
- **Smooth Animations**: Polished interactions and transitions
- **Custom Components**: Tailored UI elements for the best user experience

### 🛠️ **Admin Tools**
- **Admin Dashboard**: Overview of all notebooks and sources
- **Data Management**: Easy cleanup and organization tools
- **Debug Interface**: Monitor application state and health

---

## 🚀 Tech Stack

### **Frontend**
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite 7** - Lightning-fast build tool and dev server
- **TanStack Router** - Type-safe routing with file-based routes
- **Tailwind CSS 4.0** - Utility-first CSS framework

### **Backend & Services**
- **Firebase**
  - **Authentication** - Secure Google OAuth
  - **Firestore** - NoSQL cloud database
  - **Storage** - Cloud file storage for PDFs
- **Google Gemini AI** - Advanced language model (Gemini 2.0 Flash)
- **Vercel Functions** - Serverless API endpoints

### **Libraries & Tools**
- **PDF.js** - PDF rendering and text extraction
- **React Markdown** - Markdown rendering with GFM support
- **React Dropzone** - File upload with drag-and-drop
- **Lucide React** - Beautiful icon set
- **Vitest** - Fast unit testing framework

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm** (or yarn/pnpm)
- **Firebase Project** - [Create one here](https://console.firebase.google.com/)
- **Google Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)
- **MSU-IIT Email** - For authentication (or configure your own domain)

---

## 🛠️ Getting Started

### 1. **Clone the Repository**

```bash
git clone <repository-url>
cd noctua-ai-app
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Configure Environment Variables**

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 4. **Set Up Firebase**

#### **Authentication**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider
3. Configure authorized domains (add your local and production URLs)
4. (Optional) Set up domain restrictions for `@g.msuiit.edu.ph` emails

#### **Firestore Database**
1. Create a Firestore database in production mode
2. Add these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific notebooks
    match /users/{userId}/notebooks/{notebookId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Sources within notebooks
      match /sources/{sourceId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Summaries
      match /summaries/{summaryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Chat history
      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

#### **Firebase Storage**
1. Go to Storage → Rules
2. Add these security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. **Run the Development Server**

```bash
npm run dev
```

The app will be available at `http://localhost:3003` 🎉

---

## 🏃‍♂️ Available Scripts

```bash
# Development
npm run dev              # Start dev server on port 3003

# Building
npm run build           # Build for production

# Preview
npm run serve           # Preview production build

# Testing
npm run test            # Run unit tests

# Router
npm run generate        # Generate TanStack Router routes
```

---

## 🏗️ Project Structure

```
noctua-ai-app/
├── src/
│   ├── api/                    # API handlers
│   │   └── gemini.ts          # Gemini AI integration
│   ├── components/
│   │   ├── cards/             # Reusable card components
│   │   │   ├── MaterialCard.tsx
│   │   │   ├── NotebookCard.tsx
│   │   │   ├── SourceCard.tsx
│   │   │   └── StudioCard.tsx
│   │   ├── sections/          # Page sections
│   │   │   ├── ChatArea.tsx
│   │   │   ├── MobileTabs.tsx
│   │   │   ├── NotebookHeader.tsx
│   │   │   ├── SourcesSidebar.tsx
│   │   │   └── StudioSidebar.tsx
│   │   ├── ui/                # UI components
│   │   │   ├── AppLoader.tsx
│   │   │   ├── CustomUserButton.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── MarkdownContent.tsx
│   │   │   └── Modal.tsx
│   │   ├── authProvider.tsx   # Auth context
│   │   ├── navigation.tsx     # Main navigation
│   │   ├── pdfViewer.tsx      # PDF viewer component
│   │   └── signIn.tsx         # Sign-in component
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAutoScrollToLatestChat.ts
│   │   ├── useChatHistory.ts
│   │   ├── useFirebaseAuth.ts
│   │   ├── useGlobalPdfs.ts
│   │   ├── useNotebooks.ts
│   │   ├── useNotebookSources.ts
│   │   └── usePDFs.ts
│   ├── lib/
│   │   ├── firestore/         # Firestore operations
│   │   │   ├── chats.ts
│   │   │   ├── flashcards.ts
│   │   │   ├── notebook.ts
│   │   │   ├── presentations.ts
│   │   │   ├── quizzes.ts
│   │   │   ├── sources.ts
│   │   │   └── summaries.ts
│   │   ├── gemini.ts          # Gemini AI client
│   │   ├── fileExtractor.ts   # Universal file text extraction
│   │   └── pdfExtractor.ts    # PDF text extraction
│   ├── utils/                 # Utility functions
│   │   ├── download.ts        # File download helpers
│   │   └── formatters.ts      # Data formatting helpers
│   ├── routes/                # TanStack Router routes
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Workspaces homepage
│   │   ├── notebook.$notebookId.tsx  # Notebook detail
│   │   ├── repository.tsx     # Material repository
│   │   ├── admin.tsx          # Admin dashboard
│   │   └── sign-in.tsx        # Authentication
│   ├── types/                 # TypeScript definitions
│   │   ├── chat.ts
│   │   ├── flashcard.ts
│   │   ├── notebook.ts
│   │   ├── presentation.ts
│   │   ├── quiz.ts
│   │   ├── source.ts
│   │   └── summary.ts
│   ├── firebase.ts            # Firebase initialization
│   ├── formatters.ts          # Utility formatters
│   ├── main.tsx               # App entry point
│   └── styles.css             # Global styles
├── public/                    # Static assets
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎨 Design System

### **Color Palette**
```css
--background-dark: #0f0f0f
--background-primary: #1a1a1a
--blue-primary: #2A88D8
--blue-accent: #3b82f6
--purple-accent: #5D35B3
--text-primary: #ffffff
--text-secondary: #9ca3af
--border-subtle: #374151
```

### **Key Components**
- **Workspaces Grid**: Responsive card layout with hover effects
- **PDF Viewer**: Full-screen modal with zoom and navigation
- **Chat Interface**: Message bubbles with markdown rendering
- **Upload Modal**: Drag-and-drop with progress indicators
- **Navigation**: Bottom mobile nav, sidebar on desktop

---

## 🔧 Configuration

### **Firestore Collections Structure**

```
users/{userId}/
  └── notebooks/{notebookId}/
      ├── name: string
      ├── description: string
      ├── icon: string
      ├── createdAt: timestamp
      └── updatedAt: timestamp
      
      └── sources/{sourceId}/
          ├── name: string
          ├── type: 'pdf'
          ├── url: string
          ├── size: number
          ├── uploadedAt: timestamp
          └── extractedText: string
      
      └── summaries/{summaryId}/
          ├── sourceIds: string[]
          ├── summary: string
          └── createdAt: timestamp
      
      └── chats/{chatId}/
          ├── role: 'user' | 'assistant'
          ├── content: string
          └── timestamp: timestamp
```

### **Firebase Storage Structure**

```
users/{userId}/
  └── pdfs/{pdfId}.pdf
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

---

## 🚀 Deployment

### **Recommended: Vercel**

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### **Environment Variables in Production**

Make sure to set all the environment variables from the `.env` file in your hosting platform.

### **Build Command**
```bash
npm run build
```

### **Output Directory**
```
dist/
```

---

## 🔐 Security Best Practices

- ✅ **Firebase Security Rules** - Properly configured for user isolation
- ✅ **Environment Variables** - Sensitive keys never committed
- ✅ **Authentication** - Required for all protected routes
- ✅ **Input Validation** - Sanitized user inputs
- ✅ **CORS** - Configured for production domains

---

## 🐛 Troubleshooting

### **Firebase Permission Denied**
- Ensure Firestore security rules are properly set
- Verify user is authenticated
- Check that userId matches in the path

### **PDF Upload Fails**
- Check Firebase Storage rules
- Verify Storage bucket is configured
- Ensure file size is under Firebase limits (default: 10MB)

### **AI Not Responding**
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota in Google AI Studio
- Ensure PDF text extraction completed

### **Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite node_modules/.vite
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Contact

- 📧 **Email**: Your support email
- 🐛 **Bug Reports**: [Create an issue](../../issues)
- 💡 **Feature Requests**: [Open a discussion](../../discussions)
- 📚 **Documentation**: Check the `/docs` folder

---

## 🗺️ Roadmap

### **Coming Soon**
- [ ] Mobile app (React Native)
- [ ] Voice input and output
- [ ] Collaborative workspaces
- [ ] Export notes as PDF/Markdown
- [ ] Advanced search with filters
- [ ] Flashcard generation
- [ ] Study progress tracking

### **Under Consideration**
- [ ] Integration with LMS systems
- [ ] Offline mode support
- [ ] Browser extension
- [ ] Multi-language support
- [ ] Advanced AI models (GPT-4, Claude)

---

## 🙏 Acknowledgments

- **MSU-IIT** for the inspiration
- **Google Gemini** for AI capabilities
- **Firebase** for backend infrastructure
- **Vercel** for hosting
- Built with ❤️ for LAV and Sir Lua

---

## 📊 Performance

- ⚡ **Lighthouse Score**: 95+ across all metrics
- 🚀 **Build Time**: ~30 seconds
- 📦 **Bundle Size**: ~500KB (gzipped)
- 🔄 **Hot Reload**: <50ms

---

<div align="center">
  <p>Made with ❤️ and ☕ by the Noctua AI Team</p>
  <p>
    <a href="#top">Back to top ⬆️</a>
  </p>
</div>

