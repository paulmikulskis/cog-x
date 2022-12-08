.PHONY: serve reset docker up down aws clean build up api worker ssh prodmock


aws:
	export AWS_PROFILE=default 

clean:
	docker compose down -v

build:
	docker build --no-cache .

prodmock:
	docker image rm --force cog-x:latest && docker compose -f docker-compose-prod-mock.yml up -d --force-recreate

up:
	docker compose up -d --force-recreate && docker compose logs -f
prod:
	docker compose up -d --force-recreate

down:
	docker compose down

api:
	. ${NVM_DIR}/nvm.sh && nvm use
	docker compose up -d --remove-orphans redis
	yarn nodemon --watch './**/*.ts' --exec 'ts-node' src/server/index.ts

worker: ## Starts Redis,
	. ${NVM_DIR}/nvm.sh && nvm use
	docker compose up -d --remove-orphans redis
	yarn nodemon --watch './**/*.ts' --exec 'ts-node' src/workers/exampleFunc/index.ts

jest:
	. ${NVM_DIR}/nvm.sh && nvm use
	yarn jest

jest-watch:
	. ${NVM_DIR}/nvm.sh && nvm use
	yarn jest --watch

format:
	yarn eslint --fix

lint:
	yarn eslint --max-warnings=0

ssh:
	ssh -i erigon.pem admin@35.172.201.104