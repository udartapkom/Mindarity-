export const bigdataConfig = () => ({
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
});
