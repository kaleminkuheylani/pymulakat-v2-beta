// lib/pyodide-manager.ts

// ✅ Bu tipi export ediyoruz ki usePyodide kullanabilsin
export type PyodideRunResult = {
  output: string;
  results: any[];
};

export type PyodideMessage = {
  type: 'init' | 'run' | 'init-done' | 'init-error' | 'run-done' | 'run-error' | 'status';
  code?: string;
  test_scripts?: string[];
  test_names?: string[];
  error?: string;
  status?: 'installing' | 'running';
  packages?: string[];
  result?: any;
};

export type PyodideCallbacks = {
  onInitDone?: () => void;
  onInitError?: (error: string) => void;
  onStatus?: (status: 'installing' | 'running', packages?: string[]) => void;
  onRunDone?: (result: PyodideRunResult) => void;
  onRunError?: (error: string) => void;
};

class PyodideManager {
  private static instance: PyodideManager;
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private callbacks: PyodideCallbacks = {};
  private isInitialized = false;
  private initAttempts = 0;
  private readonly MAX_INIT_ATTEMPTS = 3;

  private constructor() {}

  static getInstance(): PyodideManager {
    if (!PyodideManager.instance) {
      PyodideManager.instance = new PyodideManager();
    }
    return PyodideManager.instance;
  }

  async initialize(onCallbacks?: PyodideCallbacks): Promise<void> {
    if (this.isInitialized) {
      if (onCallbacks) this.callbacks = { ...this.callbacks, ...onCallbacks };
      return Promise.resolve();
    }

    if (this.initPromise) {
      if (onCallbacks) this.callbacks = { ...this.callbacks, ...onCallbacks };
      return this.initPromise;
    }

    if (onCallbacks) this.callbacks = { ...this.callbacks, ...onCallbacks };

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject('Window undefined - SSR context');
        return;
      }

      try {
        const workerUrl = '/workers/pyodide-worker.js';
        console.log('[PyodideManager] Creating worker:', workerUrl);
        
        this.worker = new Worker(workerUrl, { type: 'classic' });

        this.worker.onmessage = (e: MessageEvent<PyodideMessage>) => {
          const { type, error, status, result, packages } = e.data;
          console.log('[PyodideManager] Worker message:', type, { error, status });

          switch (type) {
            case 'init-done':
              this.isInitialized = true;
              this.initAttempts = 0;
              this.callbacks.onInitDone?.();
              resolve();
              break;
            case 'init-error':
              this.initAttempts++;
              console.error('[PyodideManager] Init error:', error);
              
              if (this.initAttempts < this.MAX_INIT_ATTEMPTS) {
                console.log(`[PyodideManager] Retrying init (${this.initAttempts}/${this.MAX_INIT_ATTEMPTS})`);
                setTimeout(() => {
                  this.initPromise = null;
                  this.initialize(onCallbacks).then(resolve).catch(reject);
                }, 1000 * this.initAttempts);
              } else {
                this.callbacks.onInitError?.(error || 'Unknown init error');
                reject(error);
              }
              break;
            case 'status':
              this.callbacks.onStatus?.(status!, packages);
              break;
            case 'run-done':
              this.callbacks.onRunDone?.(result);
              break;
            case 'run-error':
              this.callbacks.onRunError?.(error || 'Unknown run error');
              break;
          }
        };

        this.worker.onerror = (err: ErrorEvent) => {
          console.error('[PyodideManager] Worker error:', err);
          this.callbacks.onInitError?.(`Worker error: ${err.message}`);
          reject(err);
        };

        console.log('[PyodideManager] Sending init message to worker');
        this.worker.postMessage({ type: 'init' });

      } catch (err: any) {
        console.error('[PyodideManager] Failed to create worker:', err);
        this.callbacks.onInitError?.(`Failed to create worker: ${err.message}`);
        reject(err);
      }
    });

    return this.initPromise;
  }

  async runCode(code: string, test_scripts: string[], test_names: string[]): Promise<void> {
    if (!this.worker) throw new Error('Worker not initialized');
    
    if (!this.isInitialized) {
      console.log('[PyodideManager] Not initialized, waiting...');
      // Eğer initialize hiç çağrılmadıysa, burada başlat
      if (!this.initPromise) {
        this.initialize();
      }
      await this.initPromise;
    }

    this.worker.postMessage({ 
      type: 'run', 
      code, 
      test_scripts, 
      test_names 
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }
}

export const pyodideManager = PyodideManager.getInstance();

export function prefetchPyodide() {
  if (typeof window !== 'undefined') {
    console.log('[PyodideManager] Prefetch requested');
    pyodideManager.initialize().catch(err => {
      console.warn('[PyodideManager] Prefetch failed:', err);
    });
  }
}