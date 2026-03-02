use crate::models::Log;
use anyhow::Result;
use chrono::Utc;
use serde::Serialize;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Serialize)]
pub struct LogListResponse {
    pub data: Vec<Log>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

pub struct LogService {
    pool: Arc<RwLock<SqlitePool>>,
}

impl LogService {
    pub fn new(pool: Arc<RwLock<SqlitePool>>) -> Self {
        Self { pool }
    }

    pub async fn list(&self, task_id: Option<i64>, page: i64, page_size: i64) -> Result<LogListResponse> {
        let pool = self.pool.read().await;
        let offset = (page - 1) * page_size;

        let (logs, total) = if let Some(tid) = task_id {
            let logs = sqlx::query_as::<_, Log>(
                "SELECT * FROM logs WHERE task_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            )
            .bind(tid)
            .bind(page_size)
            .bind(offset)
            .fetch_all(&*pool)
            .await?;

            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM logs WHERE task_id = ?",
            )
            .bind(tid)
            .fetch_one(&*pool)
            .await?;

            (logs, total.0)
        } else {
            let logs = sqlx::query_as::<_, Log>(
                "SELECT * FROM logs ORDER BY created_at DESC LIMIT ? OFFSET ?",
            )
            .bind(page_size)
            .bind(offset)
            .fetch_all(&*pool)
            .await?;

            let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM logs")
                .fetch_one(&*pool)
                .await?;

            (logs, total.0)
        };

        Ok(LogListResponse {
            data: logs,
            total,
            page,
            page_size,
        })
    }

    pub async fn create(&self, task_id: i64, output: String, status: String) -> Result<Log> {
        let pool = self.pool.read().await;
        let now = Utc::now();
        let result = sqlx::query(
            "INSERT INTO logs (task_id, output, status, created_at) VALUES (?, ?, ?, ?)",
        )
        .bind(task_id)
        .bind(&output)
        .bind(&status)
        .bind(now)
        .execute(&*pool)
        .await?;

        let log = sqlx::query_as::<_, Log>("SELECT * FROM logs WHERE id = ?")
            .bind(result.last_insert_rowid())
            .fetch_one(&*pool)
            .await?;

        Ok(log)
    }

    pub async fn delete_old_logs(&self, days: i64) -> Result<u64> {
        let pool = self.pool.read().await;
        let result = sqlx::query(
            "DELETE FROM logs WHERE created_at < datetime('now', '-' || ? || ' days')",
        )
        .bind(days)
        .execute(&*pool)
        .await?;

        Ok(result.rows_affected())
    }
}
