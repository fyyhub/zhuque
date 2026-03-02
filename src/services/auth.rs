use crate::models::{Claims, LoginRequest, LoginResponse};
use anyhow::{anyhow, Result};
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use tracing::info;
use uuid::Uuid;

const TOKEN_EXPIRATION_DAYS: i64 = 7;

pub struct AuthService {
    username: String,
    password: String,
    jwt_secret: String,
}

impl AuthService {
    pub fn new() -> Result<Self> {
        let username = std::env::var("AUTH_USERNAME")
            .unwrap_or_else(|_| "admin".to_string());
        let password = std::env::var("AUTH_PASSWORD")
            .unwrap_or_else(|_| "admin".to_string());

        let jwt_secret = match std::env::var("JWT_SECRET") {
            Ok(secret) if !secret.is_empty() => {
                info!("Using JWT_SECRET from environment variable");
                secret
            }
            _ => {
                let generated_secret = Uuid::new_v4().to_string();
                info!("JWT_SECRET not set, generated random secret: {}", generated_secret);
                generated_secret
            }
        };

        Ok(Self {
            username,
            password,
            jwt_secret,
        })
    }

    pub fn login(&self, request: &LoginRequest) -> Result<LoginResponse> {
        // 验证用户名密码
        if request.username != self.username || request.password != self.password {
            return Err(anyhow!("Invalid username or password"));
        }

        // 生成 JWT token
        let now = Utc::now().timestamp();
        let expires_in = TOKEN_EXPIRATION_DAYS * 24 * 60 * 60;
        let exp = now + expires_in;

        let claims = Claims {
            sub: request.username.clone(),
            exp,
            iat: now,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )?;

        Ok(LoginResponse {
            token,
            expires_in,
        })
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }
}
