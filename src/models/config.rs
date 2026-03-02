use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SystemConfig {
    pub id: i64,
    pub key: String,
    pub value: String, // JSON格式
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSystemConfig {
    pub key: String,
    pub value: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSystemConfig {
    pub value: String,
    pub description: Option<String>,
}

// 镜像源配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MirrorConfig {
    pub linux: Option<LinuxMirror>,
    pub nodejs: Option<NodejsMirror>,
    pub python: Option<PythonMirror>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinuxMirror {
    pub enabled: bool,
    pub apt_source: Option<String>, // Debian/Ubuntu
    pub yum_source: Option<String>, // CentOS/RHEL
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodejsMirror {
    pub enabled: bool,
    pub registry: Option<String>, // npm registry
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PythonMirror {
    pub enabled: bool,
    pub index_url: Option<String>, // pip index
}
