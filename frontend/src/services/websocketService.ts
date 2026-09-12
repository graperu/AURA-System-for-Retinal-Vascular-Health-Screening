/**
 * A lightweight, dependency-free WebSocket / STOMP client for real-time chat
 */
export class StompChatClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Map<string, (message: any) => void> = new Map();
  private isConnected = false;
  private reconnectTimer: any = null;

  constructor(endpoint = '/ws-aura-raw') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}${endpoint}`;
  }

  public connect(onConnected?: () => void, onError?: (err: any) => void) {
    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        const token = localStorage.getItem('accessToken');
        const authHeader = token ? `Authorization:Bearer ${token}\n` : '';
        // Send STOMP CONNECT frame with Auth token
        this.ws?.send(`CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n${authHeader}\n\0`);
      };

      this.ws.onmessage = (event) => {
        const text = event.data;
        if (typeof text === 'string') {
          if (text.startsWith('CONNECTED')) {
            this.isConnected = true;
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
              const handler = this.subscriptions.get(dest);
              if (handler) {
                try {
                  const data = JSON.parse(bodyStr);
                  handler(data);
                } catch {
                  handler(bodyStr);
                }
              }
            }
          }
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto reconnect every 4 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect(onConnected, onError);
        }, 4000);
      };

      this.ws.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (e) {
      if (onError) onError(e);
    }
  }

  public subscribe(topic: string, callback: (message: any) => void) {
    this.subscriptions.set(topic, callback);
    if (this.isConnected) {
      this.sendSubscribe(topic);
    }
  }

  public unsubscribe(topic: string) {
    this.subscriptions.delete(topic);
    if (this.isConnected && this.ws) {
      const subId = `sub-${topic}`;
      this.ws.send(`UNSUBSCRIBE\nid:${subId}\n\n\0`);
    }
  }

  private sendSubscribe(topic: string) {
    if (this.ws && this.isConnected) {
      const subId = `sub-${topic}`;
      this.ws.send(`SUBSCRIBE\nid:${subId}\ndestination:${topic}\n\n\0`);
    }
  }

  public disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const stompClient = new StompChatClient();
