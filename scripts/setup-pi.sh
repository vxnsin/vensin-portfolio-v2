#!/bin/bash
# One-shot setup for vensin.dev on a Raspberry Pi (64-bit Raspberry Pi OS / Debian).
# Installs Node, clones + builds the site into ~/portfolio, runs it as a systemd
# service, puts Caddy in front (automatic Let's Encrypt), and keeps the A-records
# at Vercel DNS in sync with the home IP via a cron job.
#
# Run as your normal user (not root), it uses sudo where needed:
#   bash setup-pi.sh
# Re-running is safe: it pulls, rebuilds and restarts instead of reinstalling.
#
# Optional env vars:
#   GITHUB_TOKEN   token with repo access, used to clone the private repo over https
#   DOMAIN         default vensin.dev
#   APP_DIR        default $HOME/portfolio
set -euo pipefail

REPO="${REPO:-vxnsin/vensin-portfolio-v2}"
DOMAIN="${DOMAIN:-vensin.dev}"
APP_DIR="${APP_DIR:-$HOME/portfolio}"
DATA_DIR="${DATA_DIR:-/var/lib/vensin}"
PORT="${PORT:-3000}"
ENV_FILE=/etc/vensin.env
SERVICE=vensin
USER_NAME="$(id -un)"

if [ "$EUID" -eq 0 ]; then
  echo "Bitte als normaler Benutzer ausfuehren, nicht als root (das Script nutzt sudo)."; exit 1
fi

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- packages
say "System-Pakete"
sudo apt-get update -qq
sudo apt-get install -y -qq git curl jq build-essential python3 ca-certificates gnupg \
  debian-keyring debian-archive-keyring apt-transport-https

# ---------------------------------------------------------------- node
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$MAJOR" -ge 22 ] && NEED_NODE=0
fi
if [ "$NEED_NODE" -eq 1 ]; then
  say "Node 24 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
say "Node $(node -v), npm $(npm -v)"

# ---------------------------------------------------------------- caddy
if ! command -v caddy >/dev/null 2>&1; then
  say "Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | sudo gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq caddy
fi

# ---------------------------------------------------------------- data dir
say "Datenverzeichnis $DATA_DIR"
sudo mkdir -p "$DATA_DIR/uploads" "$DATA_DIR/backups"
sudo chown -R "$USER_NAME:$USER_NAME" "$DATA_DIR"

# ---------------------------------------------------------------- repo
if [ -d "$APP_DIR/.git" ]; then
  say "Repo aktualisieren ($APP_DIR)"
  git -C "$APP_DIR" pull --ff-only
else
  say "Repo klonen nach $APP_DIR"
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    git clone "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git" "$APP_DIR"
    git -C "$APP_DIR" remote set-url origin "https://github.com/${REPO}.git"
  else
    git clone "https://github.com/${REPO}.git" "$APP_DIR"
  fi
fi
ln -sfn "$DATA_DIR/uploads" "$APP_DIR/public/uploads"

# ---------------------------------------------------------------- env file
if [ ! -f "$ENV_FILE" ]; then
  say "Env-Datei $ENV_FILE anlegen"
  {
    echo "NODE_ENV=production"
    echo "PORT=$PORT"
    echo "DATA_DIR=$DATA_DIR"
    echo "UPLOAD_DIR=$DATA_DIR/uploads"
    echo "# Vercel API token (Account Settings -> Tokens) for the dynamic-DNS cron job"
    echo "VERCEL_TOKEN="
    echo "# only if the domain belongs to a Vercel team: its id (team_...), Team Settings -> General"
    echo "VERCEL_TEAM_ID="
    echo
    cat "$APP_DIR/.env.example"
  } | sudo tee "$ENV_FILE" >/dev/null
  sudo chown "$USER_NAME:$USER_NAME" "$ENV_FILE"
  sudo chmod 600 "$ENV_FILE"
  ENV_CREATED=1
else
  ENV_CREATED=0
fi

# ---------------------------------------------------------------- build
say "npm ci"
cd "$APP_DIR"
if ! npm ci; then
  echo "npm ci ist an node-gyp gescheitert, nochmal ohne Install-Scripts (better-sqlite3 bringt ein fertiges Binary mit)"
  npm ci --ignore-scripts
  if [ -f node_modules/unrs-resolver/postinstall.js ]; then
    (cd node_modules/unrs-resolver && node postinstall.js) || true
  fi
fi
say "next build"
NODE_OPTIONS=--max-old-space-size=2048 NEXT_PUBLIC_BUILD_SHA="$(git rev-parse --short HEAD)" npm run build

# ---------------------------------------------------------------- systemd
say "systemd-Dienst $SERVICE"
sudo tee /etc/systemd/system/$SERVICE.service >/dev/null <<UNIT
[Unit]
Description=$DOMAIN (next start)
After=network-online.target
Wants=network-online.target

[Service]
User=$USER_NAME
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v npm) start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE" >/dev/null
sudo systemctl restart "$SERVICE"

# ---------------------------------------------------------------- caddy config
say "Caddyfile"
sudo tee /etc/caddy/Caddyfile >/dev/null <<CADDY
$DOMAIN {
	reverse_proxy localhost:$PORT
	encode gzip zstd
}

www.$DOMAIN {
	redir https://$DOMAIN{uri} permanent
}
CADDY
sudo systemctl enable caddy >/dev/null
sudo systemctl restart caddy

# ---------------------------------------------------------------- dynamic dns
say "Dynamic-DNS-Script + Cron"
sudo tee /usr/local/bin/vensin-ddns.sh >/dev/null <<'DDNS'
#!/bin/bash
# Keeps the A-records for @ and www at Vercel DNS pointed at the current home IP.
set -e
source /etc/vensin.env
[ -n "${VERCEL_TOKEN:-}" ] || { echo "VERCEL_TOKEN fehlt in /etc/vensin.env"; exit 0; }
DOMAIN="${DDNS_DOMAIN:-__DOMAIN__}"
IP=$(curl -4 -fs https://ifconfig.me) || exit 0
API="https://api.vercel.com"
H="Authorization: Bearer $VERCEL_TOKEN"
# domains owned by a Vercel team need ?teamId=... on every call; VERCEL_TEAM_ID in /etc/vensin.env, otherwise personal account
Q=""; [ -n "${VERCEL_TEAM_ID:-}" ] && Q="teamId=$VERCEL_TEAM_ID"
RECORDS=$(curl -fs -H "$H" "$API/v4/domains/$DOMAIN/records?limit=100${Q:+&$Q}") || { echo "$(date) listing records failed (token scope / team id?)"; exit 1; }
for NAME in "" "www"; do
  ID=$(echo "$RECORDS" | jq -r --arg n "$NAME" '.records[] | select(.type=="A" and .name==$n) | .id' | head -1)
  CUR=$(echo "$RECORDS" | jq -r --arg n "$NAME" '.records[] | select(.type=="A" and .name==$n) | .value' | head -1)
  if [ -z "$ID" ]; then
    curl -fs -X POST -H "$H" -H "Content-Type: application/json" \
      -d "{\"name\":\"$NAME\",\"type\":\"A\",\"value\":\"$IP\",\"ttl\":60}" \
      "$API/v2/domains/$DOMAIN/records${Q:+?$Q}" >/dev/null
    echo "$(date) created ${NAME:-@} -> $IP"
  elif [ "$CUR" != "$IP" ]; then
    curl -fs -X PATCH -H "$H" -H "Content-Type: application/json" \
      -d "{\"value\":\"$IP\"}" "$API/v1/domains/records/$ID${Q:+?$Q}" >/dev/null
    echo "$(date) updated ${NAME:-@} -> $IP"
  fi
done
DDNS
sudo sed -i "s/__DOMAIN__/$DOMAIN/" /usr/local/bin/vensin-ddns.sh
sudo chmod +x /usr/local/bin/vensin-ddns.sh
sudo touch /var/log/vensin-ddns.log && sudo chown "$USER_NAME" /var/log/vensin-ddns.log
CRON_LINE="*/5 * * * * /usr/local/bin/vensin-ddns.sh >> /var/log/vensin-ddns.log 2>&1"
( crontab -l 2>/dev/null | grep -v vensin-ddns.sh || true; echo "$CRON_LINE" ) | crontab -

# ---------------------------------------------------------------- summary
PUBLIC_IP="$(curl -4 -fs https://ifconfig.me || echo '?')"
LAN_IP="$(hostname -I | awk '{print $1}')"
say "Fertig"
cat <<SUMMARY

  Site:        http://$LAN_IP:$PORT  (LAN)   ->  https://$DOMAIN (sobald DNS + Router stehen)
  App-Dienst:  sudo systemctl status $SERVICE     Logs: journalctl -u $SERVICE -f
  Caddy:       sudo systemctl status caddy        Logs: journalctl -u caddy -f
  Env:         $ENV_FILE  (danach: sudo systemctl restart $SERVICE)
  Daten:       $DATA_DIR/vensin.sqlite   Uploads: $DATA_DIR/uploads
  DDNS:        /usr/local/bin/vensin-ddns.sh, alle 5 min, Log /var/log/vensin-ddns.log

Noch zu tun:
  1. $ENV_FILE ausfuellen (ADMIN_PASSWORD, Discord, Backup, VERCEL_TOKEN ...), dann: sudo systemctl restart $SERVICE
  2. Backup einspielen: sudo systemctl stop $SERVICE; Datei nach $DATA_DIR/vensin.sqlite; sudo systemctl start $SERVICE
  3. Router: dem Pi ($LAN_IP) eine feste LAN-IP geben, TCP 80 und 443 auf den Pi weiterleiten
  4. Vercel: Domain aus dem alten Projekt entfernen, dann A-Records @ und www auf $PUBLIC_IP
     (oder VERCEL_TOKEN setzen und einmal /usr/local/bin/vensin-ddns.sh ausfuehren, das legt sie an)
  5. Von aussen testen (Handy ohne WLAN): https://$DOMAIN
SUMMARY
if [ "$ENV_CREATED" -eq 1 ]; then
  echo
  echo "  Hinweis: $ENV_FILE wurde neu angelegt und ist noch leer."
fi
