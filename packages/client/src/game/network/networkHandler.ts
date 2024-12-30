import EventEmitter from 'eventemitter3';
import {
  MSG_PING,
  NETWORK_EVENTS,
} from '../../../../shared/src/networkPackets';
import { SyncLatency } from '../../gameTime';

export class NetworkHandler extends EventEmitter {
  private socket!: WebSocket;
  static instance: NetworkHandler;
  private sessionId!: string;

  public static getInstance(): NetworkHandler {
    if (!NetworkHandler.instance) {
      NetworkHandler.instance = new NetworkHandler();
    }
    return NetworkHandler.instance;
  }

  constructor() {
    super();

    try {
      this.initWebSocket();

      setInterval(() => {
        this.sendToServer({
          event: NETWORK_EVENTS.MSG_PING,
          senderTime: Date.now(),
        });
      }, 8321);
    } catch (error) {}
  }

  private initWebSocket(): void {
    try {
      this.socket = new WebSocket(`ws://localhost:6969`);

      this.socket.onopen = () => {
        console.log('Connected to game server');

        // Add some delay to avoid launch time latency
        setTimeout(() => {
          this.socket.send(
            JSON.stringify({
              event: NETWORK_EVENTS.MSG_PING,
              senderTime: Date.now(),
            } as MSG_PING)
          );
        }, 200);
      };

      this.socket.onmessage = (msg) => {
        try {
          const message = JSON.parse(msg.data);

          //    console.log("received", msg.data);

          if (message.event === NETWORK_EVENTS.MSG_AUTH) {
            this.sessionId = message.sessionId;
            console.log('Authenticated with sessionId:', this.sessionId);
            return;
          }

          if (message.event === NETWORK_EVENTS.MSG_PING) {
            this.sendToServer({
              event: NETWORK_EVENTS.MSG_PONG,
              senderTime: message.senderTime,
            });
            return;
          }

          if (message.event === NETWORK_EVENTS.MSG_PONG) {
            SyncLatency(Date.now() - message.senderTime);
            return;
          }

          this.emit('networkEvent', message);

          // Handle different message types here
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.socket.onclose = () => {
        // console.log("Disconnected from game server");
        // Optional: Implement reconnection logic
        setTimeout(() => this.initWebSocket(), 5000);
      };

      this.socket.onerror = (error) => {
        // console.error("WebSocket error:", error);
      };
    } catch (error) {
      //   console.log("Error connecting to server", error);
    }
  }

  // Method to send messages to server
  public sendToServer<T>(message: T): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // ...existing code...
}
