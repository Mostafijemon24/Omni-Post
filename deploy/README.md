# Deploying OmniPost to the Hostinger VPS

Pushes to `main` run the tests and, if they pass, GitHub Actions logs into the VPS over SSH and runs
[`deploy.sh`](deploy.sh): pull `main`, `npm ci`, build, restart under pm2, health-check.

## 1. One-time server setup (on the VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/Mostafijemon24/Omni-Post/main/deploy/setup-vps.sh -o setup-vps.sh
bash setup-vps.sh
```

It installs pm2, clones the repo to `/var/www/omnipost`, asks for your keys **on the server** (hidden input)
into `app/.env.local`, builds and starts the app on port 3000. Then point nginx at it with
[`nginx-omnipost.conf`](nginx-omnipost.conf) if it isn't already, and run `sudo certbot --nginx -d post.avonixai.com`.

Also run both SQL files from `app/supabase/migrations/` in Supabase → SQL Editor, in order.

## 2. A deploy key just for GitHub Actions (on the VPS)

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions-omnipost" -f ~/.ssh/omnipost_deploy
cat ~/.ssh/omnipost_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/omnipost_deploy        # private key → secret VPS_SSH_KEY
ssh-keyscan -p 22 localhost 2>/dev/null | sed "s/^localhost/YOUR_VPS_IP/"   # → secret VPS_KNOWN_HOSTS
```

(Use your VPS IP or hostname in place of `YOUR_VPS_IP`, the same value as `VPS_HOST`.)

## 3. GitHub secrets

GitHub → repository → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | the Linux user that ran `setup-vps.sh` |
| `VPS_SSH_KEY` | the whole private key from step 2, including the `BEGIN`/`END` lines |
| `VPS_KNOWN_HOSTS` | the `ssh-keyscan` line(s) from step 2 |
| `VPS_PORT` | only if SSH is not on port 22 |

Optional **variable** (same page, Variables tab): `APP_DIR` if you didn't use `/var/www/omnipost`.

The deploy job runs in a GitHub environment called `production`; you can add a required reviewer there
if you want to approve each deploy.

## Manual deploy

```bash
APP_DIR=/var/www/omnipost bash /var/www/omnipost/deploy/deploy.sh
```
