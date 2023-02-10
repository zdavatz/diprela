.PHONY: all backend frontend

all: backend

backend: frontend
	cd backend && \
	deno task serve

frontend:
	cd frontend && \
	deno task build
