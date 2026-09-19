import { realtimeBus } from './realtimeService';

/**
 * A robust, resilient WebSocket / STOMP client for real-time consultation chat
 * and system-wide Zero-F5 data synchronization across AURA portals.
 */
export class StompChatClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map();
  private isConnected = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private retryCount = 0;
  private maxRetries = 15;
  private manualDisconnect = false;

  constructor(endpoint = '/ws-aura-raw') {
    const protocol = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' && window.location?.host ? window.location.host : 'localhost:8080';
    this.url = `${protocol}//${host}${endpoint}`;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isConnected && !this.manualDisconnect) {
          this.retryCount = 0;
          this.connect();
        }
      });
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getStatus(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
    if (!this.ws) return 'CLOSED';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
      default:
        return 'CLOSED';
    }
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
        // Send STOMP CONNECT frame with Auth token & 10s heartbeat negotiation
        this.ws?.send(`CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n${authHeader}\n\0`);
      };

      this.ws.onmessage = (event) => {
        const text = event.data;
        if (typeof text === 'string') {
          // Ignore server heartbeat ping (\n)
          if (text === '\n' || text === '\r\n') {
            return;
          }

          if (text.startsWith('CONNECTED')) {
            this.isConnected = true;
            this.retryCount = 0;
            this.startHeartbeat();

            if (onConnected) onConnected();

            // Resubscribe to all active topics
            this.subscriptions.forEach((_, topic) => {
              this.sendSubscribe(topic);
            });
          } else if (text.startsWith('MESSAGE')) {
            // Parse STOMP MESSAGE frame (supporting both \r\n and \n)
            const normalizedText = text.replace(/\r\n/g, '\n');
            const parts = normalizedText.split('\n\n');
            if (parts.length >= 2) {
              const headers = parts[0].split('\n');
              const bodyStr = parts.slice(1).join('\n\n').replace(/\0$/, '');
              let dest = '';
              for (const h of headers) {
                if (h.startsWith('destination:')) {
                  dest = h.replace('destination:', '').trim();
                }
              }

              let data: any;
              try {
                data = JSON.parse(bodyStr);
              } catch {
                data = bodyStr;
              }

              // 1. Route directly into global realtimeBus for zero-F5 UI reactivity
              try {
                realtimeBus.handleIncomingPayload(data, 'websocket');
              } catch (busErr) {
                console.warn('Error routing STOMP message to realtimeBus:', busErr);
              }

              // 2. Dispatch to specific topic subscribers
              const handlers = this.subscriptions.get(dest);
              if (handlers && handlers.size > 0) {
                handlers.forEach((fn) => {
                  try {
                    fn(data);
                  } catch (e) {
                    console.warn('Error in STOMP topic handler for', dest, e);
                  }
                });
              }
            }
          }
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        clearTimeout(this.reconnectTimer);

        if (this.manualDisconnect) return;

        const currentToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (currentToken && this.retryCount < this.maxRetries) {
          // FE-06: Bổ sung randomized jitter (±20%) ngăn ngừa thundering herd reconnect storm
          const baseDelay = Math.min(30000, 1000 * Math.pow(1.5, this.retryCount));
          const jitter = 0.8 + Math.random() * 0.4;
          const delay = Math.min(30000, Math.round(baseDelay * jitter));
          this.retryCount++;
          this.reconnectTimer = setTimeout(() => {
            this.connect(onConnected, onError);
          }, delay);
        }
      };

      this.ws.onerror = (err) => {
        this.stopHeartbeat();
        if (onError) onError(err);
      };
    } catch (e) {
      this.stopHeartbeat();
      if (onError) onError(e);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('\n');
        } catch {
          this.stopHeartbeat();
        }
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public subscribe(topic: string, callback: (message: any) => void): () => void {
    const isNew = !this.subscriptions.has(topic) || this.subscriptions.get(topic)!.size === 0;
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(callback);

    if (this.isConnected && isNew) {
      this.sendSubscribe(topic);
    }

    return () => this.unsubscribe(topic, callback);
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
    this.stopHeartbeat();
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

export const StompClient = StompChatClient;
export const AuraWebSocketClient = StompChatClient;
export const stompClient = new StompChatClient();
export const websocketService = stompClient;
