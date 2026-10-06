WORKING_DIR = $(shell pwd)
PART ?= patch

# tiktoken is OpenAI's tokenizer, so counts approximate Claude's — fine for relative cost between files.
count-tokens: FILE ?= $(WORKING_DIR)
count-tokens: ## Count tokens in FILE=<path> (file or directory; defaults to all of .agents)
	@test -e "$(FILE)" || { echo "not found: $(FILE)" >&2; exit 1; }
	@npx -y tiktoken-cli "$(FILE)"

# bumpp rewrites version strings in place. Opt out of its release defaults: commit, tag, push, and the package.json script lookup.
bump-version: ## Bump plugin manifest versions with bumpp. PART=patch|minor|major. Does not commit.
	@case "$(PART)" in \
	  patch|minor|major) ;; \
	  *) echo "PART must be patch, minor, or major (got $(PART))" >&2; exit 1 ;; \
	esac
	npx -y bumpp@11.1.0 --yes --no-commit --no-tag --no-push --ignore-scripts --release "$(PART)" \
	  plugin.json \
	  .cursor-plugin/plugin.json \
	  .claude-plugin/plugin.json \
	  .cursor-plugin/marketplace.json \
	  .claude-plugin/marketplace.json