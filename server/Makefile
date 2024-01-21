.PHONY: run
run:
	uvicorn main:app --reload

.PHONY: setup
setup:
	test -f ./.venv/bin/activate || python3 -m venv .venv
	. ./.venv/bin/activate && pip install -r requirements.txt
