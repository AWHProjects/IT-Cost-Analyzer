module.exports = {
  apps: [
    {
      name: 'it-cost-analyzer',
      script: './dist/server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        DATABASE_URL: 'file:./dev.db'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'file:./data/prod.db'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'data',
        '.git'
      ],
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/it-cost-analyzer.git',
      path: '/var/www/it-cost-analyzer',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && npx prisma generate && npx prisma db push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    },
    staging: {
      user: 'ubuntu',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/it-cost-analyzer.git',
      path: '/var/www/it-cost-analyzer-staging',
      'post-deploy': 'npm install && npm run build && npx prisma generate && npx prisma db push && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 3002
      }
    }
  }
};