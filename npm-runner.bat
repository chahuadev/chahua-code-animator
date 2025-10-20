@echo off
chcp 65001 > nul
color 0A
title Chahua Code Animator Task Runner

echo.

:MENU
cls
echo ╔════════════════════════════════════════════════════════════════════════════════╗
echo ║                           🚀 Chahua Code Animator Toolkit                      ║
echo ║                                    Version 1.1.0                              ║
echo ╚════════════════════════════════════════════════════════════════════════════════╝
echo.
echo.
echo   --- Common Tasks ---
echo    [1] npm install   (ติดตั้ง Dependencies)
echo    [2] npm start     (รันโปรเจกต์)
echo    [3] npm run dev   (รันในโหมดพัฒนา)
echo    [4] npm test      (รันเทส)
echo.
echo   --- Build & Package ---
echo    [7] npm run build (Build โปรเจกต์)
echo    [8] npm run build:win (Build Windows Artifacts)
echo    [9] npm run dist:win  (สร้างตัวติดตั้ง Windows พร้อม Metrics)
echo.
echo   --- Utilities ---
echo    [5] Open Folder   (เปิดโฟลเดอร์นี้ใน Explorer)
echo    [6] Open VS Code  (เปิดโฟลเดอร์นี้ใน VS Code)
echo.
echo    [0] Exit          (ออกจากสคริปต์)
echo.
echo ===================================================
echo.

:: รับ Input จากผู้ใช้
set /p "CHOICE=Please select an option and press Enter: "

:: ตรวจสอบตัวเลือก
if "%CHOICE%"=="1" goto INSTALL
if "%CHOICE%"=="2" goto START
if "%CHOICE%"=="3" goto DEV
if "%CHOICE%"=="4" goto TEST
if "%CHOICE%"=="5" goto OPEN_FOLDER
if "%CHOICE%"=="6" goto OPEN_CODE
if "%CHOICE%"=="7" goto BUILD
if "%CHOICE%"=="8" goto BUILD_WIN
if "%CHOICE%"=="9" goto DIST_WIN
if "%CHOICE%"=="0" goto EXIT

:: ถ้าพิมพ์ผิด
echo Invalid choice. Please try again.
pause
goto MENU


:: =================================
:: ##     Action Sections         ##
:: =================================

:INSTALL
cls
echo ########## Running npm install ##########
echo.
call npm install
echo.
echo ########## 'npm install' finished. ##########
pause
goto MENU

:START
cls
echo ########## Running npm start ##########
echo.
call npm start
echo.
echo ########## 'npm start' finished or was terminated. ##########
pause
goto MENU

:DEV
cls
echo ########## Running npm run dev ##########
echo.
call npm run dev
echo.
echo ########## 'npm run dev' finished or was terminated. ##########
pause
goto MENU

:TEST
cls
echo ########## Running npm test ##########
echo.
call npm test
echo.
echo ########## 'npm test' finished. ##########
pause
goto MENU

:BUILD
cls
echo ########## Running npm run build ##########
echo.
call npm run build
echo.
echo ########## 'npm run build' finished. ##########
pause
goto MENU

:BUILD_WIN
cls
echo ########## Running npm run build:win ##########
echo.
call npm run build:win
echo.
echo ########## 'npm run build:win' finished. ##########
pause
goto MENU

:DIST_WIN
cls
echo ########## Running npm run dist:win ##########
echo.
call npm run dist:win
echo.
echo ########## 'npm run dist:win' finished. ##########
pause
goto MENU

:OPEN_FOLDER
cls
echo ########## Opening current folder... ##########
explorer .
goto MENU

:OPEN_CODE
cls
echo ########## Opening in VS Code... ##########
code .
goto MENU

:EXIT
exit /b