@echo off
title Farmer AI Selenium Tests

echo ==================================================
echo   Farmer AI Selenium Test Runner
echo ==================================================
echo.

echo Checking if required servers are running...
echo.

echo Please ensure you have started:
echo  - Farmer AI Backend Server (port 5002)
echo  - Farmer AI Frontend Server (port 5174)
echo.

echo Select a test to run:
echo 1. Simple WebDriver Check
echo 2. Full Workflow Test
echo 3. Farmer AI Application Access Test
echo 4. Generate Test Report
echo 5. Run All Tests
echo.
echo 0. Exit
echo.

:menu
set /p choice=Enter your choice (0-5): 

if "%choice%"=="1" goto test1
if "%choice%"=="2" goto test2
if "%choice%"=="3" goto test3
if "%choice%"=="4" goto test4
if "%choice%"=="5" goto test5
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
goto menu

:test1
echo.
echo Running Simple WebDriver Check...
echo.
node simple-check.js
echo.
echo Test completed.
echo.
pause
goto menu

:test2
echo.
echo Running Full Workflow Test...
echo.
node full-workflow-test.js
echo.
echo Test completed.
echo.
pause
goto menu

:test3
echo.
echo Running Farmer AI Application Access Test...
echo.
node debug-farmerai.js
echo.
echo Test completed.
echo.
pause
goto menu

:test4
echo.
echo Generating Test Report...
echo.
node generate-report.js
echo.
echo Report generation completed.
echo.
pause
goto menu

:test5
echo.
echo Running All Tests...
echo.
echo --- Simple WebDriver Check ---
node simple-check.js
echo.
echo --- Farmer AI Application Access Test ---
node debug-farmerai.js
echo.
echo --- Test Report Generation ---
node generate-report.js
echo.
echo All tests completed.
echo.
pause
goto menu

:exit
echo.
echo Thank you for using Farmer AI Selenium Test Runner!
echo.
pause
exit