# ECS Deployment

Use `./deploy/deploy_ecs.ps1` from the project root on Windows PowerShell.

The script deploys the TDOS app to `/opt/tdos` on the `arteta` SSH alias. It
runs local checks, builds with `VITE_BASE=/`, uploads the static build and Node
runtime files, installs production dependencies, and restarts pm2 services
`tdos-web` and `tdos-ws`.

Useful command:

```powershell
.\deploy\deploy_ecs.ps1
```

The public URL is `http://118.178.140.171:1314/`.

The script also verifies the cover video endpoint with a byte range request. A
healthy response includes `206 Partial Content`, `Accept-Ranges: bytes`, and a
`Content-Range` header so the large mp4 can stream instead of downloading as one
full blocking response.
