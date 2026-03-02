use crate::api::AppState;
use crate::models::LoginRequest;
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(request): Json<LoginRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    match state.auth_service.login(&request) {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((StatusCode::UNAUTHORIZED, e.to_string())),
    }
}
