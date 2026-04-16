// libs/common/contants/event.ts
export const REALTIME_EVENTS = {
  // Client -> Server
  SEND_MESSAGE: 'send_message',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  TYPING: 'typing',
  PING: 'ping',

  // Server -> Client
  RECEIVE_MESSAGE: 'receive_message',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_TYPING: 'user_typing',
  ERROR: 'error',
  CONNECTED: 'connected',
  PONG: 'pong',
} as const;

export const MESSAGE_PATTERNS = {
  // Gateway -> Service
  PROCESS_MESSAGE: 'realtime.process.message',
  PROCESS_JOIN_ROOM: 'realtime.process.join_room',
  PROCESS_LEAVE_ROOM: 'realtime.process.leave_room',
  PROCESS_TYPING: 'realtime.process.typing',

  // Service -> Gateway
  BROADCAST_MESSAGE: 'realtime.broadcast.message',
  BROADCAST_USER_JOINED: 'realtime.broadcast.user_joined',
  BROADCAST_USER_LEFT: 'realtime.broadcast.user_left',
  BROADCAST_TYPING: 'realtime.broadcast.typing',
} as const;

// Type for event values
export type RealtimeEvent =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
export type MessagePattern =
  (typeof MESSAGE_PATTERNS)[keyof typeof MESSAGE_PATTERNS];
