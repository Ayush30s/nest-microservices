// ecosystem.config.js
module.exports = {
  apps: [

    // ── API Gateway ─────────────────────────────────────────────
    // This is the only HTTP-facing service receiving traffic from Nginx
    // cluster mode + 2 instances = 2 CPU cores handling HTTP in parallel
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/main.js',
      instances: 2,               // ← 2 instances, uses 2 CPU cores
      exec_mode: 'cluster',       // ← PM2 shares port 3000 between both
      watch: false,
      max_memory_restart: '400M', // ← restart if RAM exceeds 400MB
      error_file: 'logs/api-gateway-error.log',
      out_file: 'logs/api-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.API_GATEWAY_PORT || 3000,
        JWT_SECRET: process.env.JWT_SECRET,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
        REDIS_URL: process.env.REDIS_URL,
        AUTH_SERVICE_HOST: process.env.AUTH_SERVICE_HOST || 'localhost',
        AUTH_SERVICE_PORT: process.env.AUTH_SERVICE_PORT || 3002,
        USER_SERVICE_HOST: process.env.USER_SERVICE_HOST || 'localhost',
        USER_SERVICE_PORT: process.env.USER_SERVICE_PORT || 3001,
        GYM_SERVICE_HOST: process.env.GYM_SERVICE_HOST || 'localhost',
        GYM_SERVICE_PORT: process.env.GYM_SERVICE_PORT || 3003,
        REALTIME_SERVICE_HOST: process.env.REALTIME_SERVICE_HOST || 'localhost',
        REALTIME_SERVICE_PORT: process.env.REALTIME_SERVICE_PORT || 3004,
      },
    },

    // ── User Service ─────────────────────────────────────────────
    // Message-based → fork, not cluster
    // 1 instance is fine, it consumes from message queue
    {
      name: 'user-service',
      script: 'dist/apps/user-service/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      error_file: 'logs/user-service-error.log',
      out_file: 'logs/user-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.USER_SERVICE_PORT || 3001,
        DB_HOST: process.env.USER_DB_HOST,
        DB_PORT: process.env.USER_DB_PORT || 5432,
        DB_USER: process.env.USER_DB_USER,
        DB_PASS: process.env.USER_DB_PASS,
        DB_NAME: process.env.USER_DB_NAME || 'postgres',
        JWT_SECRET: process.env.JWT_SECRET,
      },
    },

    // ── Auth Service ─────────────────────────────────────────────
    {
      name: 'auth-service',
      script: 'dist/apps/auth-service/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      error_file: 'logs/auth-service-error.log',
      out_file: 'logs/auth-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.AUTH_SERVICE_PORT || 3002,
        DB_HOST: process.env.AUTH_DB_HOST,
        DB_PORT: process.env.AUTH_DB_PORT || 5432,
        DB_USER: process.env.AUTH_DB_USER,
        DB_PASS: process.env.AUTH_DB_PASS,
        DB_NAME: process.env.AUTH_DB_NAME || 'postgres',
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL: process.env.REDIS_URL,          // ← auth usually needs Redis for token blacklist
      },
    },

    // ── Gym Service ──────────────────────────────────────────────
    {
      name: 'gym-service',
      script: 'dist/apps/gym-service/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      error_file: 'logs/gym-service-error.log',
      out_file: 'logs/gym-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.GYM_SERVICE_PORT || 3003,
        DB_HOST: process.env.GYM_DB_HOST,
        DB_PORT: process.env.GYM_DB_PORT || 5432,
        DB_USER: process.env.GYM_DB_USER,
        DB_PASS: process.env.GYM_DB_PASS,
        DB_NAME: process.env.GYM_DB_NAME || 'postgres',
        JWT_SECRET: process.env.JWT_SECRET,
      },
    },

    // ── Realtime Service ─────────────────────────────────────────
    // WebSocket service — MUST stay at 1 instance
    // You have redis-io.adapter.ts so scaling is possible later
    // but keep at 1 until you verify the Redis adapter is fully wired
    {
      name: 'realtime-service',
      script: 'dist/apps/realtime-service/main.js',
      instances: 1,               // ← do NOT change to cluster without testing Redis adapter
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '400M', // ← WebSocket holds many connections, needs more RAM
      error_file: 'logs/realtime-service-error.log',
      out_file: 'logs/realtime-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.REALTIME_SERVICE_PORT || 3004,
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL: process.env.REDIS_URL,
      },
    },

    // ── Email Service ────────────────────────────────────────────
    // Fire-and-forget, low traffic — 1 instance always enough
    {
      name: 'email-service',
      script: 'dist/apps/email-service/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      error_file: 'logs/email-service-error.log',
      out_file: 'logs/email-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_FROM: process.env.SMTP_FROM,
      },
    },

    // ── AI Service ───────────────────────────────────────────────
    // CPU and memory heavy — 2 instances worth it
    // fork mode because it consumes from message queue, not HTTP
    {
      name: 'ai-service',
      script: 'dist/apps/ai-service/main.js',
      instances: 2,               // ← AI processing is heavy, use 2 cores
      exec_mode: 'fork',          // ← fork not cluster, it's message-based
      watch: false,
      max_memory_restart: '1G',   // ← AI/vector ops need more RAM
      error_file: 'logs/ai-service-error.log',
      out_file: 'logs/ai-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.AI_SERVICE_PORT || 3005,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        DB_HOST: process.env.AI_DB_HOST,           // ← added, ai-service has prisma
        DB_PORT: process.env.AI_DB_PORT || 5432,
        DB_USER: process.env.AI_DB_USER,
        DB_PASS: process.env.AI_DB_PASS,
        DB_NAME: process.env.AI_DB_NAME || 'postgres',
      },
    },

    // ── Product Service ──────────────────────────────────────────
    // ✅ THIS WAS MISSING from your original file
    {
      name: 'product-service',
      script: 'dist/apps/product-service/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      error_file: 'logs/product-service-error.log',
      out_file: 'logs/product-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PRODUCT_SERVICE_PORT || 3006,
        JWT_SECRET: process.env.JWT_SECRET,
      },
    },

  ],
};