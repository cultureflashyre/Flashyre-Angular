import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logs: string[] = [];

  // Log to console and store in memory
  log(level: 'DEBUG' | 'INFO' | 'ERROR', message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${level} ${timestamp} ${message}`;
    this.logs.push(formattedMessage);

    switch (level) {
      case 'DEBUG':
        console.debug(formattedMessage, ...args);
        break;
      case 'INFO':
        console.info(formattedMessage, ...args);
        break;
      case 'ERROR':
        console.error(formattedMessage, ...args);
        break;
    }

    // Optionally save to local storage or send to backend
    this.saveLogs();
  }
 
  debug(message: string, ...args: any[]): void {
    this.log('DEBUG', message, ...args);
  }
 
  info(message: string, ...args: any[]): void {
    this.log('INFO', message, ...args);
  }
 
  error(message: string, ...args: any[]): void {
    this.log('ERROR', message, ...args);
  }
 
  // Save logs to local storage (for persistence)
  private saveLogs(): void {
    localStorage.setItem('app_logs', JSON.stringify(this.logs));
  }
  // Retrieve logs (for debugging or sending to backend)
  getLogs(): string[] {
    return this.logs;
  }

 
  // Optionally send logs to backend (requires backend endpoint)
  /*
  sendLogsToBackend(): void {
    this.http.post('http://localhost:8000/api/logs/', { logs: this.logs }).subscribe(
      () => console.log('Logs sent to backend'),
      (error) => console.error('Failed to send logs', error)
    );
  }
  */

}

