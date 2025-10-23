# Noctua AI

A modern, intelligent AI assistant application built for MSU-IIT students, featuring secure authentication and a beautiful chat interface.

![Noctua AI Logo](public/logo512.png)

## 🌟 Features

- **🔐 Secure Authentication**: Powered by Clerk with domain restrictions for MSU-IIT students
- **💬 AI Chat Interface**: Modern, responsive chat UI with real-time messaging
- **🎨 Beautiful Design**: Dark theme with gradient accents and smooth animations
- **📱 Responsive Layout**: Optimized for desktop and mobile devices
- **⚡ Fast Performance**: Built with Vite and modern React patterns
- **🛡️ Protected Routes**: Secure access control with authentication guards

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS 4.0
- **Authentication**: Clerk
- **Icons**: Lucide React
- **Testing**: Vitest, Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account for authentication

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd noctua-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```

4. **Configure Clerk Authentication**
   - Create a Clerk account at [clerk.com](https://clerk.com)
   - Set up domain restrictions for `@g.msuiit.edu.ph` emails
   - Copy your publishable key to the `.env` file

## 🏃‍♂️ Getting Started

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:3003`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run serve
```

### Testing
```bash
npm run test
```

## 🏗️ Project Structure

src/  <br>
├── components/  <br>
│   ├── authProvider.tsx      # Authentication context and protected routes  <br>
│   ├── loadingSpinner.tsx    # Custom loading components  <br>
│   ├── signIn.tsx           # Sign-in page component  <br>
│   └── userButton.tsx       # User account management  <br>
├── routes/  <br>
│   ├── __root.tsx           # Root layout with auth provider  <br>
│   ├── index.tsx            # Main chat interface  <br>
│   └── sign-in.tsx          # Authentication route  <br>
├── styles.css               # Global styles and Tailwind config  <br>
└── main.tsx                 # Application entry point  <br>

## 🔧 Configuration

### Clerk Authentication Setup

1. **Domain Restrictions**: Configure Clerk to only allow `@g.msuiit.edu.ph` emails
2. **Social Providers**: Set up Google OAuth for easier MSU-IIT student access
3. **Custom Styling**: The app includes custom Clerk component styling to match the dark theme

### Tailwind CSS

The project uses Tailwind CSS 4.0 with custom color scheme:
- Primary: `#2A88D8` (Blue)
- Secondary: `#5D35B3` (Purple)

## 🎨 Design System

### Color Palette
- **Background**: `#1a1a1a` (Dark)
- **Secondary Background**: `#0f0f0f` (Darker)
- **Primary**: `#2A88D8` (Blue)
- **Secondary**: `#5D35B3` (Purple)
- **Text**: White/Gray variants

### Components
- **Loading Spinner**: Custom logo with animated blue ring
- **Chat Interface**: Modern message bubbles with gradient accents
- **Authentication**: Styled Clerk components matching the theme

## 🔐 Authentication Flow

1. **Access Control**: All routes are protected by default
2. **Sign-in Redirect**: Unauthenticated users are redirected to `/sign-in`
3. **Domain Validation**: Only MSU-IIT students can register
4. **User Management**: Integrated user button for account management

## 📱 Features Overview

### Chat Interface
- Real-time message display
- User and AI message differentiation
- Input area with send button
- Chat history sidebar
- Responsive design

### Authentication
- Secure sign-in/sign-up
- Domain-restricted access
- User profile management
- Session persistence

### UI/UX
- Dark theme with gradient accents
- Smooth animations and transitions
- Loading states with custom spinner
- Responsive layout

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables
Ensure the following environment variables are set in production:
- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

### Build Optimization
The project is optimized for production with:
- Tree shaking
- Code splitting
- Asset optimization
- TypeScript compilation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] AI model integration
- [ ] Chat history persistence
- [ ] File upload support
- [ ] Voice input/output
- [ ] Mobile app development
- [ ] Advanced user preferences

---

Built with ❤️ for LAV and Sir Lua lmao