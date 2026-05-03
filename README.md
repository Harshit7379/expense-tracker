# Expense Tracker

Full-stack expense tracker application with a Spring Boot backend and a plain HTML/CSS/JavaScript frontend. Users can register, log in with JWT-based authentication, and manage daily expenses.

## Features

- User registration and login
- JWT authentication
- Add, view, and delete expenses
- REST API backend
- Simple browser-based frontend

## Tech Stack

- Backend: Java, Spring Boot, Spring Security
- Frontend: HTML, CSS, JavaScript
- Database: MySQL
- Auth: JWT

## Repository Structure

- `src/` - Spring Boot backend source code
- `frontend/` - frontend files (`index.html`, `style.css`, `auth.js`, `expense.js`)
- `pom.xml` - Maven project configuration

## Prerequisites

- Java installed
- Maven installed, or use `mvnw` / `mvnw.cmd`
- MySQL running locally

## Backend Configuration

The backend uses the following default database configuration from [src/main/resources/application.properties](src/main/resources/application.properties):

- Database URL: `jdbc:mysql://localhost:3306/expense_tracker`
- Username: `root`
- Password env var: `DB_PASSWORD`
- Server port: `8080`

Set the database password before starting the backend.

PowerShell:

```powershell
$env:DB_PASSWORD="your-mysql-password"
```

## Run the Backend

From the repository root:

```powershell
.\mvnw.cmd spring-boot:run
```

Or, if Maven is installed globally:

```powershell
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`.

## Run the Frontend

Open [frontend/index.html](frontend/index.html) in your browser.

The frontend is configured to call:

```text
http://localhost:8080
```

So the backend should be running before using the UI.
