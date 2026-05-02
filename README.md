<!-- Ngnix + realtime service flow -->

1. Client requests ws://domain/realtime
                        ↓
2. Nginx matches location block (/realtime)
                        ↓
3. Selects upstream group → realtime_cluster
                        ↓
4. Loadbalancer picks one server (round-robin / least_conn)
                        ↓
5. Forwards the HTTP UPGRADE request to: 10.0.2.11:3004
                        ↓
6. Socket.IO + NestJS WebSocket server accepts the upgrade
                        ↓
7. Persistent WebSocket connection is established