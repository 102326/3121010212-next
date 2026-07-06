# Local Infrastructure

The local database stack already exists outside this repository:

```text
C:\Ubuntu\huanjing\componse\PostgreSQL
```

Relevant Compose settings observed:

- PostgreSQL service: `postgres`
- Container name: `pylab_pg`
- Image: `pgvector/pgvector:pg18`
- Host port: `5432`
- User: `root`
- Password: `123456`
- Default database: `root`
- Docker network: external `pylab_network`

Use this project database connection string for local API development:

```text
postgres://root:123456@localhost:5432/mental_health?sslmode=disable
```

This project should not define a second PostgreSQL Docker Compose service unless the shared local infrastructure is intentionally replaced.

## Initialize Database

```powershell
docker exec pylab_pg psql -U root -d postgres -c "CREATE DATABASE mental_health"
Get-Content -Raw .\database\migrations\000001_core.up.sql | docker exec -i pylab_pg psql -U root -d mental_health -v ON_ERROR_STOP=1
Get-Content -Raw .\database\seeds\001_demo.sql | docker exec -i pylab_pg psql -U root -d mental_health -v ON_ERROR_STOP=1
```
