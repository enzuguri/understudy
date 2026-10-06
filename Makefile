WORKING_DIR = $(shell pwd)
PART ?= patch
VERSION_FILES = \
	plugin.json \
	.cursor-plugin/plugin.json \
	.claude-plugin/plugin.json \
	.cursor-plugin/marketplace.json \
	.claude-plugin/marketplace.json

count-tokens: FILE ?= $(WORKING_DIR)
count-tokens: ## Count tokens in FILE=<path> (file or directory; defaults to all of .agents)
	@test -e "$(FILE)" || { echo "not found: $(FILE)" >&2; exit 1; }
	@npx -y tiktoken-cli "$(FILE)"

bump-version: ## Bump manifest versions. PART=patch|minor|major. Does not commit.
	@case "$(PART)" in \
	  patch|minor|major) ;; \
	  *) echo "PART must be patch, minor, or major (got $(PART))" >&2; exit 1 ;; \
	esac
	npx -y bumpp@11.1.0 --yes --no-commit --no-tag --no-push --ignore-scripts --release "$(PART)" $(VERSION_FILES)