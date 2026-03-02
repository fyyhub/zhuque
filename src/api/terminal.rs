use crate::api::AppState;
use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, State, WebSocketUpgrade,
    },
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct ConnectQuery {
    pub token: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type")]
enum TerminalMessage {
    #[serde(rename = "input")]
    Input { data: String },
    #[serde(rename = "resize")]
    Resize { rows: u16, cols: u16 },
}

pub async fn connect_terminal(
    ws: WebSocketUpgrade,
    Query(_query): Query<ConnectQuery>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();

    // 获取环境变量
    let env_vars = match state.env_service.get_all_as_map().await {
        Ok(vars) => vars,
        Err(e) => {
            tracing::error!("Failed to get environment variables: {}", e);
            let _ = sender
                .send(Message::Text(format!("Error: {}\r\n", e)))
                .await;
            return;
        }
    };

    // 创建终端会话
    let (session_id, mut reader, mut writer, master) = match state
        .terminal_service
        .create_session(env_vars, 24, 80)
        .await
    {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to create terminal session: {}", e);
            let _ = sender
                .send(Message::Text(format!("Error: {}\r\n", e)))
                .await;
            return;
        }
    };

    let state_clone = state.clone();

    // 创建通道用于从阻塞任务发送数据到异步任务
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    // PTY → WebSocket（读取任务）
    let read_task = tokio::task::spawn_blocking(move || {
        let mut buffer = vec![0u8; 8192];
        loop {
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    if let Err(e) = tx.send(data) {
                        tracing::error!("Failed to send to channel: {}", e);
                        break;
                    }
                }
                Ok(_) => {
                    tracing::info!("PTY reader reached EOF");
                    break;
                }
                Err(e) => {
                    tracing::error!("Failed to read from PTY: {}", e);
                    break;
                }
            }
        }
    });

    // 从通道接收数据并发送到 WebSocket
    let forward_task = tokio::spawn(async move {
        while let Some(data) = rx.recv().await {
            if let Err(e) = sender.send(Message::Text(data)).await {
                tracing::error!("Failed to send to WebSocket: {}", e);
                break;
            }
        }
    });

    // WebSocket → PTY（写入任务）
    let write_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    // 尝试解析为 JSON 消息
                    if let Ok(terminal_msg) = serde_json::from_str::<TerminalMessage>(&text) {
                        match terminal_msg {
                            TerminalMessage::Input { data } => {
                                let data_bytes = data.as_bytes().to_vec();
                                if let Err(e) = tokio::task::block_in_place(|| {
                                    writer.write_all(&data_bytes)?;
                                    writer.flush()
                                }) {
                                    tracing::error!("Failed to write to PTY: {}", e);
                                    break;
                                }
                            }
                            TerminalMessage::Resize { rows, cols } => {
                                let master_lock = master.lock().await;
                                if let Err(e) = master_lock.resize(portable_pty::PtySize {
                                    rows,
                                    cols,
                                    pixel_width: 0,
                                    pixel_height: 0,
                                }) {
                                    tracing::error!("Failed to resize terminal: {}", e);
                                }
                            }
                        }
                    } else {
                        // 如果不是 JSON，直接作为输入发送
                        let text_bytes = text.as_bytes().to_vec();
                        if let Err(e) = tokio::task::block_in_place(|| {
                            writer.write_all(&text_bytes)?;
                            writer.flush()
                        }) {
                            tracing::error!("Failed to write to PTY: {}", e);
                            break;
                        }
                    }
                }
                Ok(Message::Binary(_)) => {
                    // 忽略二进制消息
                }
                Ok(Message::Close(_)) => {
                    tracing::info!("WebSocket closed by client");
                    break;
                }
                Err(e) => {
                    tracing::error!("WebSocket error: {}", e);
                    break;
                }
                _ => {}
            }
        }
    });

    // 等待任务完成
    tokio::select! {
        _ = read_task => {
            tracing::info!("Read task completed");
        }
        _ = forward_task => {
            tracing::info!("Forward task completed");
        }
        _ = write_task => {
            tracing::info!("Write task completed");
        }
    }

    // 清理会话
    if let Err(e) = state_clone.terminal_service.remove_session(&session_id).await {
        tracing::error!("Failed to remove session: {}", e);
    }
}
