# 🎓 Career Guidance Platform

A comprehensive web application designed to provide career guidance, educational resources, and interactive features for students and administrators. Built with modern web technologies and featuring AI-powered assistance.

## 🌟 Features

### 🔐 Authentication & Authorization
- **Secure Authentication**: JWT-based authentication with Supabase
- **Role-Based Access Control**: Student and Admin roles with different permissions
- **Session Management**: Persistent sessions with automatic refresh
- **Admin Privileges**: Special admin user with elevated permissions

### 👥 User Management
- **Student Dashboard**: Personalized dashboard for students
- **Admin Dashboard**: Administrative interface for managing content
- **Profile Management**: User profiles with role-based features
- **Admin Request System**: Students can request admin privileges

### 💬 Interactive Communication
- **Group Chat System**: Real-time group messaging
- **WhatsApp-like Interface**: Modern chat UI with message history
- **Group Management**: Create, join, and manage discussion groups
- **Real-time Updates**: Live message updates using Supabase realtime

### 🤖 AI-Powered Assistant
- **Career Guidance AI**: Powered by Google Gemini 2.5 Flash
- **Intelligent Responses**: Context-aware career advice and guidance
- **Chat History**: Persistent conversation history
- **Safety Filters**: Built-in content moderation and safety

### 📚 Educational Content
- **Weekly Content**: Organized weekly educational materials
- **File Management**: Support for photos, videos, and PDF documents
- **Content Viewing**: Interactive file viewer with navigation
- **Admin Content Management**: Upload and manage educational resources

### 🏫 School & Team Management
- **School Information**: Manage school visit information
- **Team Members**: Track team member details and positions
- **Visit Scheduling**: Plan and track school visits
- **Administrative Tools**: Comprehensive management interface

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first responsive interface
- **Glass Morphism**: Modern glass-effect design elements
- **Cosmic Loading Animation**: Beautiful holographic loading experience
- **Dark Theme**: Professional dark theme throughout
- **Smooth Animations**: Fluid transitions and micro-interactions

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons
- **React Hooks**: Modern React patterns

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Robust relational database
- **Row Level Security (RLS)**: Database-level security
- **Real-time Subscriptions**: Live data updates
- **File Storage**: Secure file upload and storage

### AI & External Services
- **Google Gemini AI**: Advanced language model integration
- **Gemini 1.5 Flash**: Fast and efficient AI responses
- **Content Safety**: Built-in AI safety measures

### Development Tools
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Git**: Version control

## 📁 Project Structure

```
career-guidance-website/
├── 📁 src/                        # Source code
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 admin/              # Admin dashboard & management
│   │   ├── 📁 ai-chat/            # AI-powered career assistant
│   │   ├── 📁 api/                # Backend API routes
│   │   │   ├── 📁 admin/          # Admin management endpoints
│   │   │   ├── 📁 ai-chat/        # AI chat API (Gemini integration)
│   │   │   ├── 📁 groups/         # Group chat management
│   │   │   ├── 📁 schools/        # School information management
│   │   │   ├── 📁 student/        # Student-specific endpoints
│   │   │   ├── 📁 team/           # Team member management
│   │   │   └── 📁 weeks/          # Weekly content management
│   │   ├── 📁 auth/               # Authentication callbacks
│   │   ├── 📁 groups/             # Real-time group chat interface
│   │   ├── 📁 login/              # User authentication
│   │   ├── 📁 request-admin/      # Admin privilege requests
│   │   ├── 📁 schools/            # School visit management
│   │   ├── 📁 student/            # Student dashboard
│   │   ├── 📁 team/               # Team information display
│   │   ├── 📁 weeks/              # Educational content browser
│   │   ├── favicon.ico            # App icon
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout component
│   │   └── page.tsx               # Homepage
│   ├── 📁 components/             # Reusable React components
│   │   ├── 📁 features/           # Feature-specific components
│   │   │   ├── 📁 AdminDashboard/ # Admin interface components
│   │   │   ├── 📁 HomePage/       # Landing page components
│   │   │   ├── 📁 LoginPage/      # Authentication components
│   │   │   ├── 📁 StudentDashboard/ # Student interface
│   │   │   └── 📁 WeeksPage/      # Content management
│   │   ├── 📁 groups/             # Group chat components
│   │   │   ├── GroupChatArea.tsx  # Main chat interface
│   │   │   ├── GroupsSidebar.tsx  # Group navigation
│   │   │   └── MessageList.tsx    # Message display
│   │   ├── 📁 layout/             # Layout components
│   │   │   ├── Layout.tsx         # Main app layout
│   │   │   ├── Navbar.tsx         # Navigation bar
│   │   │   └── Sidebar.tsx        # Side navigation
│   │   ├── 📁 providers/          # React context providers
│   │   │   ├── AppProvider.tsx    # Global app state
│   │   │   └── AuthProvider.tsx   # Authentication state
│   │   └── 📁 ui/                 # Reusable UI components
│   │       ├── Button.tsx         # Button component
│   │       ├── FileViewer.tsx     # Multi-format file viewer
│   │       ├── LoadingAnimation.tsx # Cosmic loading animation
│   │       └── Modal.tsx          # Modal dialogs
│   ├── 📁 hooks/                  # Custom React hooks
│   │   └── useSupabaseQuery.ts    # Database query hook
│   ├── 📁 lib/                    # Utility libraries & configurations
│   │   ├── 📁 hooks/              # Additional custom hooks
│   │   ├── auth-client.ts         # Client-side authentication
│   │   ├── auth-server.ts         # Server-side authentication
│   │   ├── auth.ts                # Authentication utilities
│   │   ├── groups.ts              # Group management utilities
│   │   ├── profile-utils.ts       # User profile utilities
│   │   ├── supabase-admin.ts      # Admin Supabase client
│   │   └── supabase.ts            # Main Supabase client
│   └── 📁 store/                  # State management
│       └── authStore.ts           # Authentication store (Zustand)
├── 📁 public/                     # Static assets
│   ├── 📁 images/                 # Image assets
│   └── favicon.ico                # Browser favicon
├── 📁 sql/                        # Database setup & migrations
│   ├── init.sql                   # Database initialization
│   └── storage-setup.sql          # File storage setup
├── 📁 scripts/                    # Utility scripts
│   ├── clear-cache.js             # Clear Next.js cache
│   └── setup-system.js            # System initialization
├── 📄 .env.local                  # Environment variables (local)
├── 📄 .env.production             # Production environment variables
├── 📄 .gitignore                  # Git ignore rules
├── 📄 eslint.config.mjs           # ESLint configuration
├── 📄 middleware.ts               # Next.js middleware
├── 📄 next.config.ts              # Next.js configuration
├── 📄 package.json                # Dependencies & scripts
├── 📄 postcss.config.mjs          # PostCSS configuration
├── 📄 README.md                   # Project documentation
├── 📄 tailwind.config.ts          # Tailwind CSS configuration
├── 📄 tsconfig.json               # TypeScript configuration
└── 📄 vercel.json                 # Vercel deployment config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google AI API key (for Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd career-guidance-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Configuration
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Initialize the system**
   ```bash
   # Set up database and create admin user
   npm run setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open `http://localhost:3000` in your browser
   - Login with the admin credentials provided by the setup script

### Default Admin Credentials
- **Email**: `nchaitanyanaidu@yahoo.com`
- **Password**: `adminncn@20`

## 🎯 Key Features Explained

### Authentication System
The platform uses Supabase authentication with custom role management:
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Different permissions for students and admins
- **Session Persistence**: Automatic session management
- **Security**: Row-level security policies in the database

### AI Chat Assistant
Powered by Google Gemini 1.5 Flash:
- **Career Guidance**: Specialized prompts for career advice
- **Context Awareness**: Maintains conversation context
- **Safety Measures**: Built-in content filtering
- **Performance**: Fast response times with efficient model

### Real-time Group Chat
WhatsApp-like messaging experience:
- **Live Updates**: Real-time message delivery
- **Group Management**: Create and join discussion groups
- **Message History**: Persistent chat history
- **Modern UI**: Clean, intuitive interface

### Content Management
Comprehensive educational content system:
- **Weekly Organization**: Content organized by weeks
- **Multi-media Support**: Photos, videos, and PDFs
- **File Viewer**: Built-in file viewing capabilities
- **Admin Controls**: Easy content upload and management

### Responsive Design
Mobile-first approach with modern aesthetics:
- **Glass Morphism**: Translucent design elements
- **Dark Theme**: Professional appearance
- **Smooth Animations**: Engaging user interactions
- **Cross-platform**: Works on all devices

## 🔧 Configuration

### Database Setup
The application uses Supabase with the following main tables:
- `profiles` - User profiles and roles
- `groups` - Discussion groups
- `group_members` - Group membership
- `group_messages` - Chat messages
- `weeks` - Weekly content
- `week_files` - Associated files
- `schools` - School information
- `team_members` - Team data
- `ai_chats` - AI conversation history
- `admin_requests` - Admin privilege requests

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `GEMINI_API_KEY` - Google AI API key for Gemini

### Deployment
The application is configured for deployment on Vercel:
- Automatic deployments from Git
- Environment variable management
- Edge function support
- Global CDN distribution

## 🛡️ Security Features

### Authentication Security
- JWT token validation
- Secure session management
- Role-based access control
- Protected API routes

### Database Security
- Row Level Security (RLS) policies
- User isolation
- Admin privilege verification
- Secure file storage

### AI Safety
- Content filtering
- Input validation
- Response moderation
- Usage monitoring

## 🎨 UI Components

### Core Components
- **LoadingAnimation**: Cosmic-themed loading experience
- **Modal**: Reusable modal dialogs
- **FileViewer**: Multi-format file display
- **Button**: Consistent button styling
- **Layout**: Application shell and navigation

### Feature Components
- **GroupsSidebar**: Chat group navigation
- **GroupChatArea**: Message display and input
- **WeeksPage**: Educational content browser
- **AdminDashboard**: Administrative interface
- **StudentDashboard**: Student-focused dashboard

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+
- **Large Desktop**: 1440px+

## 🔄 State Management

### Context Providers
- **AuthProvider**: Authentication state
- **AppProvider**: Global application state

### Custom Hooks
- **useAuth**: Authentication utilities
- **useGroups**: Group management
- **useRealtimeMessages**: Live message updates

## 🚀 Performance Optimizations

### Loading Strategies
- Lazy loading for components
- Image optimization
- Code splitting
- Bundle optimization

### Caching
- Static asset caching
- API response caching
- Database query optimization
- CDN utilization

## 🧪 Development Tools

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run setup        # Initialize system & create admin user
npm run clear-cache  # Clear Next.js cache
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Git hooks for pre-commit checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Contact the development team

## 🎉 Acknowledgments

- **Supabase** for the excellent backend platform
- **Google AI** for Gemini integration
- **Vercel** for hosting and deployment
- **Tailwind CSS** for the utility-first CSS framework
- **Next.js** for the powerful React framework

---

Built with ❤️ for career guidance and educational excellence.
