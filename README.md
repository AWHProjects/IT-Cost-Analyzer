# IT Cost Analyzer Framework

A comprehensive TypeScript-based solution for monitoring, analyzing, and optimizing organizational software spending across SaaS portfolios.

## 🚀 Features

### Core Analytics
- **Cost Trend Analysis** - Track spending patterns over time with detailed growth rate calculations
- **License Utilization Monitoring** - Identify unused and underutilized software licenses
- **Savings Opportunity Detection** - Automated identification of cost optimization opportunities
- **Usage Pattern Analysis** - Understand software adoption and usage trends
- **Predictive Cost Forecasting** - AI-driven predictions for future spending

### Enterprise Security
- **Advanced Encryption** - AES-256 encryption for sensitive data
- **Compliance Reporting** - GDPR, SOX, and ISO 27001 compliance features
- **Audit Logging** - Comprehensive activity tracking and reporting
- **Role-Based Access Control** - Granular permission management
- **JWT Authentication** - Secure token-based authentication system

### Real-Time Features
- **Live Notifications** - WebSocket-based real-time alerts
- **Interactive Dashboards** - Dynamic visualizations with Chart.js
- **File Processing** - Automated invoice and usage report processing
- **Multi-Format Exports** - PDF, Excel, CSV, and JSON report generation

### SaaS Integrations
- **Microsoft 365** - User activity and license data synchronization
- **Slack** - Workspace usage analytics and cost tracking
- **GitHub** - Repository and user activity monitoring
- **Extensible Architecture** - Easy addition of new platform connectors

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
```
src/server/
├── index.ts                 # Express server entry point
├── middleware/              # Authentication, rate limiting, error handling
├── routes/                  # RESTful API endpoints
├── services/                # Business logic and data processing
├── utils/                   # Shared utilities and helpers
└── connectors/              # SaaS platform integrations
```

### Frontend (React + TypeScript)
```
src/client/
├── src/
│   ├── components/          # React components
│   ├── services/            # API client and utilities
│   └── styles/              # CSS styling
└── public/                  # Static assets
```

### Database (SQLite + Prisma)
```
prisma/
├── schema.prisma           # Database schema definition
├── migrations/             # Database migration files
└── seed.ts                 # Initial data seeding
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.IO
- **File Processing**: Multer
- **Encryption**: Node.js crypto module

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: CSS3 with custom components
- **Charts**: Chart.js
- **HTTP Client**: Axios
- **Build Tool**: Create React App

### Development & Testing
- **Testing**: Jest with TypeScript support
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler
- **Package Manager**: npm

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd it-cost-analyzer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize the database**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Start the development servers**

Backend:
```bash
npm run dev:server
```

Frontend (in a new terminal):
```bash
npm run dev:client
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS="12"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Server Configuration
PORT="3001"
NODE_ENV="development"

# SaaS Integration Credentials
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="your-microsoft-tenant-id"

SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Schema

The application uses a comprehensive database schema with 9 main entities:

- **User** - User accounts and authentication
- **Organization** - Multi-tenant organization support
- **Application** - Software applications being tracked
- **License** - License information and costs
- **UsageData** - Daily usage statistics
- **Cost** - Cost tracking and billing information
- **Alert** - System notifications and alerts
- **Integration** - SaaS platform connections
- **AuditLog** - Security and compliance logging

## 🚀 Deployment

### Production Build

1. **Build the application**
```bash
npm run build
```

2. **Set production environment variables**
```bash
export NODE_ENV=production
export DATABASE_URL="your-production-database-url"
export JWT_SECRET="your-production-jwt-secret"
# ... other production variables
```

3. **Start the production server**
```bash
npm start
```

### Docker Deployment

1. **Build the Docker image**
```bash
docker build -t it-cost-analyzer .
```

2. **Run the container**
```bash
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  it-cost-analyzer
```

### Cloud Deployment Options

#### Heroku
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-jwt-secret"
git push heroku main
```

#### AWS EC2
1. Launch an EC2 instance with Node.js
2. Clone the repository
3. Install dependencies and build
4. Configure environment variables
5. Use PM2 for process management

#### Vercel (Frontend only)
```bash
npm install -g vercel
vercel --prod
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/services/authService.test.ts
```

### Test Structure
```
tests/
├── setup.ts                # Test configuration and global mocks
├── services/               # Service layer tests
├── components/             # React component tests
└── integration/            # Integration tests
```

### Coverage Requirements
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/cost-trends` - Cost trend analysis
- `GET /api/analytics/license-utilization` - License usage data
- `GET /api/analytics/recommendations` - Savings opportunities
- `GET /api/analytics/export` - Export analytics data

### Application Management
- `GET /api/applications` - List applications
- `POST /api/applications` - Add new application
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Remove application

### File Upload
- `POST /api/upload/invoice` - Upload invoice files
- `POST /api/upload/usage-report` - Upload usage reports
- `POST /api/upload/license-export` - Upload license data
- `GET /api/upload/status/:id` - Check processing status

## 🔒 Security Features

### Data Protection
- AES-256 encryption for sensitive data
- Secure password hashing with bcrypt
- JWT token-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization

### Compliance
- GDPR compliance with data export/deletion
- SOX compliance with audit trails
- ISO 27001 security controls
- Comprehensive logging and monitoring

### Access Control
- Role-based permissions (Viewer, Member, Admin, Owner)
- Organization-level data isolation
- API key management for integrations
- Session management and timeout

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write comprehensive tests
- Document public APIs
- Use conventional commit messages

### Pull Request Process
1. Update documentation for any new features
2. Ensure test coverage meets requirements
3. Update CHANGELOG.md
4. Request review from maintainers

## 📈 Performance Optimization

### Backend Optimizations
- Database query optimization with Prisma
- Response caching for frequently accessed data
- Compression middleware for API responses
- Connection pooling for database connections

### Frontend Optimizations
- Code splitting with React.lazy()
- Memoization of expensive calculations
- Optimized bundle size with tree shaking
- Lazy loading of chart components

### Monitoring
- Application performance monitoring
- Database query performance tracking
- Error tracking and alerting
- Usage analytics and metrics

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

**Port Already in Use**
```bash
# Kill process on port 3001
npx kill-port 3001
```

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev:server
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chart.js for visualization components
- Prisma for database management
- Socket.IO for real-time features
- React community for frontend components
- TypeScript team for type safety

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions

---

**Built with ❤️ for enterprise IT cost optimization**