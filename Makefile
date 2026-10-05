WORKING_DIR = $(shell pwd)

# tiktoken is OpenAI's tokenizer, so counts approximate Claude's — fine for relative cost between files.
count-tokens: FILE ?= $(WORKING_DIR)
count-tokens: ## Count tokens in FILE=<path> (file or directory; defaults to all of .agents)
	@test -e "$(FILE)" || { echo "not found: $(FILE)" >&2; exit 1; }
	@npx -y tiktoken-cli "$(FILE)"