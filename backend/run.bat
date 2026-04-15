@echo off
setlocal

pushd "%~dp0"

if not exist "venv\Scripts\Activate.ps1" (
	echo Virtual environment not found at venv\Scripts\Activate.ps1
	echo Create it first with: python -m venv venv
	popd
	exit /b 1
)

call venv\Scripts\Activate.ps1

if "%DATABASE_URL%"=="" (
	set DATABASE_URL=sqlite:///./dev.sqlite3
)

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

popd