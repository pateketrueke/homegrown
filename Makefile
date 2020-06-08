TASK ?= test

ifdef CI
	TASK=test:ci
endif

test-ci:
	@make -C application lint
	@make test-all

test-all:
	@make test:cli test:bud test:server test:conn test:access
	@make test:grpc test:graphql test:model test:logger test:render

ci: deps
	@make -s clean setup test-ci

publish:
	@make -C website dist deploy

release: install
	@mv lerna.json lerna.json_backup
	@cat lerna.json_backup | grep -v application > lerna.json
	@git update-index --assume-unchanged lerna.json
	@lerna publish || true
	@mv lerna.json_backup lerna.json
	@git update-index --no-assume-unchanged lerna.json

install: deps
	@(((which lerna) > /dev/null 2>&1) || npm i -g lerna) || true

setup: install
	@lerna bootstrap

dev\:%:
	@cd packages/$(subst dev:,,$*) && npm run dev

test\:%:
	@cd packages/$(subst test:,,$@) && npm run $(TASK)

clean: install
	@lerna clean -y

deps: package*.json
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true
