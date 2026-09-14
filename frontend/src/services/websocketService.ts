/**
 * A robust, lightweight WebSocket / STOMP client for real-time consultation chat
 */
export class StompChatClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map();
  private isConnected = false;
  private reconnectTimer: any = null;
  private retryCount = 0;
  private maxRetries = 15;
  private manualDisconnect = false;

  constructor(endpoint = '/ws-aura-raw') {
    const protocol = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' && window.location?.host ? window.location.host : 'localhost:8080';
    this.url = `${protocol}//${host}${endpoint}`;
  }

  public connect(onConnected?: () => void, onError?: (err: any) => void) {
    try {
      this.manualDisconnect = false;
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        const authHeader = token ? `Authorization:Bearer ${token}\n` : '';
        // Send STOMP CONNECT frame with Auth token
        this.ws?.send(`CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n${authHeader}\n\0`);
      };

      this.ws.onmessage = (event) => {
        const text = event.data;
        if (typeof text === 'string') {
          if (text.startsWith('CONNECTED')) {
            this.isConnected = true;
            this.retryCount = 0;
            if (onConnected) onConnected();
            // Resubscribe to all active topics
            this.subscriptions.forEach((_, topic) => {
              this.sendSubscribe(topic);
            });
          } else if (text.startsWith('MESSAGE')) {
            // Parse STOMP MESSAGE
            const parts = text.split('\n\n');
            if (parts.length >= 2) {
              const headers = parts[0].split('\n');
              const bodyStr = parts.slice(1).join('\n\n').replace(/\0$/, '');
              let dest = '';
              for (const h of headers) {
                if (h.startsWith('destination:')) {
                  dest = h.replace('destination:', '').trim();
                }
              }
              const handlers = this.subscriptions.get(dest);
              if (handlers && handlers.size > 0) {
                let data: any;
                try {
                  data = JSON.parse(bodyStr);
                } catch {
                  data = bodyStr;
                }
                handlers.forEach((fn) => {
                  try {
                    fn(data);
                  } catch (e) {
                    console.warn('Error in STOMP message handler:', e);
                  }
                });
              }
            }
          }
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearTimeout(this.reconnectTimer);

        if (this.manualDisconnect) return;

        // Auto reconnect with exponential backoff if logged in and under max retries
        const currentToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (currentToken && this.retryCount < this.maxRetries) {
          const delay = Math.min(30000, 2000 * Math.pow(1.3, this.retryCount));
          this.retryCount++;
          this.reconnectTimer = setTimeout(() => {
            this.connect(onConnected, onError);
          }, delay);
        }
      };

      this.ws.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (e) {
      if (onError) onError(e);
    }
  }

  public subscribe(topic: string, callback: (message: any) => void) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(callback);

    if (this.isConnected) {
      this.sendSubscribe(topic);
    }
  }

  public unsubscribe(topic: string, callback?: (message: any) => void) {
    if (callback && this.subscriptions.has(topic)) {
      this.subscriptions.get(topic)!.delete(callback);
      if (this.subscriptions.get(topic)!.size === 0) {
        this.subscriptions.delete(topic);
        this.sendUnsubscribe(topic);
      }
    } else {
      this.subscriptions.delete(topic);
      this.sendUnsubscribe(topic);
    }
  }

  private sendSubscribe(topic: string) {
    if (this.ws && this.isConnected) {
      const subId = `sub-${topic}`;
      this.ws.send(`SUBSCRIBE\nid:${subId}\ndestination:${topic}\n\n\0`);
    }
  }

  private sendUnsubscribe(topic: string) {
    if (this.ws && this.isConnected) {
      const subId = `sub-${topic}`;
      try {
        this.ws.send(`UNSUBSCRIBE\nid:${subId}\n\n\0`);
      } catch {
        // Ignore send errors during shutdown
      }
    }
  }

  public disconnect() {
    this.manualDisconnect = true;
    clearTimeout(this.reconnectTimer);
    this.retryCount = 0;
    if (this.ws) {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('DISCONNECT\n\n\0');
        } catch {
          // Ignore error
        }
      }
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }
}

export const stompClient = new StompChatClient();
