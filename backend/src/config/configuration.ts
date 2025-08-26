export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'mindarity_user',
    password: process.env.DATABASE_PASSWORD || 'mindarity_password',
    database: process.env.DATABASE_NAME || 'mindarity',
    url: process.env.DATABASE_URL,
    synchronize: process.env.TYPEORM_SYNC === 'true',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL,
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    bucket: process.env.MINIO_BUCKET || 'mindarity-files',
  },
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'mindarity',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'mindarity-client',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  files: {
    maxSize: process.env.MAX_FILE_SIZE || '100mb',
    allowedTypes:
      process.env.ALLOWED_FILE_TYPES ||
      'image/*,video/*,audio/*,application/pdf',
  },
  search: {
    elasticsearchIndex: process.env.ELASTICSEARCH_INDEX || 'mindarity',
    elasticsearchShards: parseInt(process.env.ELASTICSEARCH_SHARDS || '1', 10),
    elasticsearchReplicas: parseInt(
      process.env.ELASTICSEARCH_REPLICAS || '0',
      10,
    ),
  },
  bigdata: {
    maxWorkers: parseInt(process.env.BIGDATA_MAX_WORKERS || '3'),
    chunkSize: parseInt(process.env.BIGDATA_CHUNK_SIZE || '1048576'), // 1MB
    tempDir: process.env.BIGDATA_TEMP_DIR || './temp',
    supportedFormats: [
      'csv',
      'json',
      'xml',
      'txt',
      'log',
      'parquet',
      'avro',
      'xlsx',
      'xls',
    ],
    maxFileSize: parseInt(process.env.BIGDATA_MAX_FILE_SIZE || '1073741824'), // 1GB
    minFileSize: parseInt(process.env.BIGDATA_MIN_FILE_SIZE || '104857600'), // 100MB
    processingTimeout: parseInt(process.env.BIGDATA_PROCESSING_TIMEOUT || '3600000'), // 1 hour
    cleanupInterval: parseInt(process.env.BIGDATA_CLEANUP_INTERVAL || '86400000'), // 24 hours
    retentionDays: parseInt(process.env.BIGDATA_RETENTION_DAYS || '30'),
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    domain: process.env.DOMAIN || 'localhost',
    sslEnabled: process.env.SSL_ENABLED === 'true',
  },
});
