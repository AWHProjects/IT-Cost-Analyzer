interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = this.getTimestamp();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, ...args));
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage(LOG_LEVELS.INFO, message, ...args));
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, ...args));
    }
  }

  log(level: keyof LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case 'ERROR':
        this.error(message, ...args);
        break;
      case 'WARN':
        this.warn(message, ...args);
        break;
      case 'INFO':
        this.info(message, ...args);
        break;
      case 'DEBUG':
        this.debug(message, ...args);
        break;
      default:
        this.info(message, ...args);
    }
  }
}

export const logger = new Logger();