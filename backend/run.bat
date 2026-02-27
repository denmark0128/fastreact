@echo off
setlocal

pushd "%~dp0"

if not exist "\venv\Scripts\python" (
	echo Virtual environment not found at \venv\Scripts\python
	echo Create it first with: python -m venv venv
	popd
	exit /b 1
)

call .\venv\Scripts\activate.bat

if "%DATABASE_URL%"=="" (
	set DATABASE_URL=sqlite:///./dev.sqlite3
)

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

popd