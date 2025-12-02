PNPM ?= pnpm
NODE_VERSION ?= 22
NVM_SH ?= $(HOME)/.nvm/nvm.sh
NVM_USE = . "$(NVM_SH)" && nvm use $(NODE_VERSION) >/dev/null &&

.PHONY: default nvm-use install compile watch watch-client watch-extensions compile-web compile-cli test test-node test-browser smoketest hygiene clean

default: nvm-use

nvm-use:
	$(NVM_USE) node --version

install:
	$(NVM_USE) $(PNPM) install

compile:
	$(NVM_USE) $(PNPM) run compile

watch:
	$(NVM_USE) $(PNPM) run watch

watch-client:
	$(NVM_USE) $(PNPM) run watch-client

watch-extensions:
	$(NVM_USE) $(PNPM) run watch-extensions

compile-web:
	$(NVM_USE) $(PNPM) run compile-web

compile-cli:
	$(NVM_USE) $(PNPM) run compile-cli

dev:
	$(NVM_USE) sh -c 'set -e; $(PNPM) rebuild @vscode/policy-watcher; mkdir -p .dev; if [ -f .dev/watch-client.pid ]; then kill "$$(cat .dev/watch-client.pid)" >/dev/null 2>&1 || true; rm -f .dev/watch-client.pid; fi; $(PNPM) run watch-client & watch_pid=$$!; echo "$$watch_pid" > .dev/watch-client.pid; trap "kill $$watch_pid >/dev/null 2>&1 || true; rm -f .dev/watch-client.pid" EXIT; $(PNPM) run gulp electron; ./scripts/code.sh'

test:
	$(NVM_USE) $(PNPM) run test

test-node:
	$(NVM_USE) $(PNPM) run test-node

test-browser:
	$(NVM_USE) $(PNPM) run test-browser

smoketest:
	$(NVM_USE) $(PNPM) run smoketest

hygiene:
	$(NVM_USE) $(PNPM) run hygiene

clean:
	rm -rf out */out
