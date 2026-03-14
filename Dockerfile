FROM rust:1.93-trixie AS builder

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY Cargo.toml ./
COPY src ./src

RUN cargo build --release

COPY web ./web
WORKDIR /build/web
RUN npm install && npm run build

FROM debian:stable-slim

RUN RUN printf 'APT::Install-Recommends "false";\nAPT::Install-Suggests "false";\n' > /etc/apt/apt.conf.d/90disable-suggests \
    && printf 'Acquire::http::Pipeline-Depth "0";\n' > /etc/apt/apt.conf.d/99nopipelining \
    && apt-get update \
    && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY --from=builder /build/target/release/zhuque /app/zhuque
COPY --from=builder /build/web/dist /app/web/dist

RUN mkdir -p /app/data/scripts /app/data/db

ENV DATABASE_URL=sqlite:///app/data/db/zhuque.db \
    RUST_LOG=info \
    PORT=3000

EXPOSE 3000

CMD ["/app/zhuque"]
