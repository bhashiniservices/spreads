WEBPACK_BIN=./node_modules/.bin/webpack
JEST_BIN=./node_modules/.bin/jest

all: production

clean:
	rm -rf node_modules build

node_modules:
	@echo Installing dependencies
	@npm install

production: node_modules
	@echo Building minified production package
	@$(WEBPACK_BIN)
	@cp ./node_modules/foundation-sites/dist/css/foundation.css ./build/
	@cp -r img/ build/

development: node_modules
	@echo Building development package with source map
	@$(WEBPACK_BIN) -d --config webpack.config.dev.js --progress > /dev/null

watch: node_modules
	$(WEBPACK_BIN) -d --config webpack.config.dev.js --watch

test: node_modules
	@echo Running tests
	@echo ==================================
	@$(JEST_BIN)
	@echo ==================================

test-debug: node_modules
	node --harmony --debug --debug-brk $(JEST_BIN) --runInBand

.PHONY: production development watch test test-debug
