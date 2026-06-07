# ShortURL Management System

A modern, lightweight short URL management system built with Astro, TypeScript, and JSON storage. No database required.

## Features

- ✅ User authentication with bcrypt password hashing
- ✅ Create, edit, and delete short URLs
- ✅ Click tracking for each short URL
- ✅ Admin panel for user and link management
- ✅ Role-based access control (Admin/User)
- ✅ JSON file-based storage (no database needed)
- ✅ Fast redirects with 302 status code
- ✅ Search and pagination
- ✅ Responsive TailwindCSS UI
- ✅ TypeScript with strict mode

## Tech Stack

- **Frontend**: Astro + TypeScript + TailwindCSS
- **Backend**: Astro API Routes
- **Authentication**: bcrypt + Session cookies
- **Storage**: JSON files
- **Runtime**: Node.js

## System Requirements

- Node.js 18+
- npm or yarn

## Installation

1. **Clone or navigate to the project directory**

```bash
cd /path/to/Shortlink
```

2. **Install dependencies**

```bash
npm install
```

## Configuration

The system initializes automatically with default configuration:

- **Registration enabled** by default
- **Site URL** defaults to `http://localhost:4321`

To change these, edit `data/config.json` after first run.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Initial Setup

1. Start the application with `npm run dev`
2. An admin user is **not** created automatically
3. Go to `/register` to create your first user account
4. After creating an account, you can log in at `/login`
5. To create additional admin users, log in as an admin and use the admin panel

## Project Structure

```
src/
├── pages/
│   ├── index.astro              # Home page
│   ├── login.astro              # Login page
│   ├── register.astro           # Registration page
│   ├── dashboard.astro          # Main dashboard
│   ├── [slug].astro             # Short URL redirect
│   ├── links/
│   │   ├── index.astro          # Links list
│   │   ├── create.astro         # Create link
│   │   └── edit/[id].astro      # Edit link
│   ├── users/
│   │   ├── index.astro          # Users list (admin only)
│   │   ├── create.astro         # Create user (admin only)
│   │   └── edit/[id].astro      # Edit user (admin only)
│   └── api/
│       ├── auth/
│       │   ├── login.ts         # Login endpoint
│       │   ├── register.ts      # Register endpoint
│       │   └── logout.ts        # Logout endpoint
│       ├── links/
│       │   ├── create.ts        # Create link endpoint
│       │   └── [id].ts          # Update/delete link endpoints
│       ├── users/
│       │   ├── create.ts        # Create user endpoint
│       │   └── [id].ts          # Update/delete user endpoints
│       └── [slug].ts            # Redirect endpoint
├── lib/
│   ├── storage.ts               # JSON file operations
│   ├── auth.ts                  # User management
│   ├── session.ts               # Session management
│   └── links.ts                 # Short link management
├── layouts/
│   └── MainLayout.astro         # Main layout component
└── middleware.ts                # Auth middleware

data/
├── users.json                   # User data
├── links.json                   # Short links data
├── sessions.json                # Active sessions
└── config.json                  # System configuration
```

## Usage

### For Users

1. **Register**: Create an account at `/register`
2. **Login**: Log in at `/login`
3. **Create Links**: Go to Links → Create Link
4. **View Links**: See all your links at Links page
5. **Edit Links**: Click Edit on any link to modify it
6. **View Stats**: Dashboard shows your links and click statistics

### For Admins

1. All user features plus:
2. **Manage Users**: Users menu to view, create, and edit users
3. **View Global Stats**: Dashboard shows system-wide statistics
4. **Manage All Links**: Can edit or delete any link in the system

## Security Features

- ✅ bcrypt password hashing with salt rounds
- ✅ HttpOnly, Secure, SameSite cookies for sessions
- ✅ Session expiration (24 hours)
- ✅ Input validation and sanitization
- ✅ Authorization checks on all protected endpoints
- ✅ Atomic file writes to prevent corruption

## Data Storage

All data is stored as JSON files in the `data/` directory:

- **users.json**: User accounts and password hashes
- **links.json**: Short URL mappings and statistics
- **sessions.json**: Active user sessions
- **config.json**: System configuration

## Backup and Recovery

To backup your data:

```bash
# Copy the data directory
cp -r data/ data-backup/
```

To restore:

```bash
cp -r data-backup/* data/
```

## Troubleshooting

### Port Already in Use

If port 4321 is already in use, you can specify a different port:

```bash
npm run dev -- --port 3001
```

### Data Corruption

If JSON files become corrupted, delete them and restart the application. New files will be created automatically.

```bash
rm data/*.json
npm run dev
```

### Session Issues

Clear the session cookie in your browser and log in again.

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["npm", "run", "preview"]
```

Build and run:

```bash
docker build -t shorturl .
docker run -p 4321:4321 -v $(pwd)/data:/app/data shorturl
```

### VPS/Server

1. Clone the repository
2. Install Node.js 18+
3. Run `npm install`
4. Run `npm run build`
5. Use PM2 or systemd to run the application

```bash
npm install -g pm2
pm2 start "npm run preview" --name "shorturl"
```

## Performance

- Redirect response time: < 100ms
- Dashboard load time: < 1 second
- Supports ~10,000+ links efficiently

## License

MIT

## Support

For issues and feature requests, please contact the development team.

## Changelog

### v0.1.0 - Initial Release

- Complete authentication system
- User and link management
- Click tracking
- Admin dashboard
- Responsive UI
