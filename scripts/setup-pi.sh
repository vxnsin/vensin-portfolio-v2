#!/bin/bash
# Setup for the portfolio on a Raspberry Pi / any Debian-like box.
#
# What it does
#   - Node 22+ (installs Node 24 from NodeSource if missing)
#   - clones or pulls the repo into an app folder, builds it, runs it as a systemd service
#   - env file in /etc/<service>.env, sqlite + uploads + backups in a data folder
#   - Caddy site block for the domain (automatic HTTPS) via /etc/caddy/sites/<service>.caddy,
#     imported from the main Caddyfile without touching other sites (e.g. aniwatch)
#   - optional cron job that keeps the A-records at Vercel DNS on the current public IP
#
# Interactive: the script asks for every setting and proposes a default. Press Enter to accept.
# Non-interactive: pass values as env vars and/or `--yes` to take all defaults, e.g.
#   DOMAIN=example.org PORT=3000 bash setup-pi.sh --yes
# Re-running is safe: it pulls, rebuilds and restarts instead of reinstalling.
#
# Settings (env var → question → default):
#   REPO            github repo to clone                     vxnsin/vensin-portfolio-v2
#   GITHUB_TOKEN    token for a private repo                 (asked when cloning)
#   DOMAIN          public domain                            vensin.dev
#   WWW_REDIRECT    redirect www.<domain> to <domain>        yes
#   APP_DIR         app folder                               $HOME/portfolio
#   PORT            port                                     3000
#   SERVICE         systemd service / file names             vensin
#   DATA_DIR        sqlite, uploads, backups                 /var/lib/<service>
#   SETUP_DDNS      keep DNS at Vercel updated (yes/no)      yes
set -euo pipefail

YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) YES=1 ;;
    -h|--help) sed -n '2,28p' "$0"; exit 0 ;;
  esac
done
[ -t 0 ] || [ -r /dev/tty ] || YES=1

if [ "$EUID" -eq 0 ]; then
  echo "Bitte als normaler Benutzer ausfuehren, nicht als root (das Script nutzt sudo)."; exit 1
fi

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
# ask VAR "Frage" "default"  – keeps a value that came in as env var, otherwise asks (or takes the default with --yes)
ask() {
  local var="$1" prompt="$2" def="$3" ans=""
  if [ -n "${!var:-}" ]; then return; fi
  if [ "$YES" -eq 1 ]; then printf -v "$var" '%s' "$def"; return; fi
  read -r -p "$prompt [${def:-leer}]: " ans < /dev/tty || ans=""
  printf -v "$var" '%s' "${ans:-$def}"
}
ask_secret() {
  local var="$1" prompt="$2" ans=""
  if [ -n "${!var:-}" ] || [ "$YES" -eq 1 ]; then return; fi
  read -r -s -p "$prompt (Eingabe bleibt unsichtbar, Enter = ueberspringen): " ans < /dev/tty || ans=""
  echo
  printf -v "$var" '%s' "$ans"
}
yesno() { case "${1,,}" in y|yes|j|ja|1|true) return 0 ;; *) return 1 ;; esac; }

# ---------------------------------------------------------------- settings
say "Einstellungen (Enter = Vorschlag uebernehmen)"
ask REPO         "GitHub-Repo (owner/name)" "vxnsin/vensin-portfolio-v2"
ask DOMAIN       "Oeffentliche Domain" "vensin.dev"
ask WWW_REDIRECT "www.$DOMAIN auf $DOMAIN umleiten? (ja/nein)" "ja"
ask APP_DIR      "App-Ordner" "$HOME/portfolio"
ask PORT         "Port" "3000"
ask SERVICE      "Dienstname (systemd, Dateinamen)" "vensin"
ask DATA_DIR     "Datenordner (sqlite, uploads, backups)" "/var/lib/$SERVICE"
ask SETUP_DDNS   "DNS bei Vercel automatisch auf die Heim-IP setzen? (ja/nein)" "ja"
ENV_FILE="/etc/$SERVICE.env"
USER_NAME="$(id -un)"

cat <<SUMMARY

  Repo:        $REPO
  Domain:      $DOMAIN  (www-Redirect: $WWW_REDIRECT)
  App-Ordner:  $APP_DIR
  Port:        $PORT
  Dienst:      $SERVICE   (Env: $ENV_FILE, Daten: $DATA_DIR)
  Vercel-DDNS: $SETUP_DDNS
SUMMARY
if [ "$YES" -eq 0 ]; then
  read -r -p "So einrichten? (J/n): " ok < /dev/tty || ok="j"
  case "${ok,,}" in n|no|nein) echo "Abgebrochen."; exit 1 ;; esac
fi

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
  ask_secret GITHUB_TOKEN "GitHub-Token (nur fuer private Repos)"
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
  if yesno "$SETUP_DDNS"; then
    ask_secret VERCEL_TOKEN "Vercel API Token fuer DNS (Account Settings -> Tokens)"
    ask VERCEL_TEAM_ID "Vercel Team ID (nur bei Team-Domain, sonst leer)" ""
  fi
  {
    echo "NODE_ENV=production"
    echo "PORT=$PORT"
    echo "DATA_DIR=$DATA_DIR"
    echo "UPLOAD_DIR=$DATA_DIR/uploads"
    echo "# Vercel API token (Account Settings -> Tokens) for the dynamic-DNS cron job"
    echo "VERCEL_TOKEN=${VERCEL_TOKEN:-}"
    echo "# only if the domain belongs to a Vercel team: its id (team_...), Team Settings -> General"
    echo "VERCEL_TEAM_ID=${VERCEL_TEAM_ID:-}"
    echo
    cat "$APP_DIR/.env.example"
  } | sudo tee "$ENV_FILE" >/dev/null
  sudo chown "$USER_NAME:$USER_NAME" "$ENV_FILE"
  sudo chmod 600 "$ENV_FILE"
  ENV_CREATED=1
else
  ENV_CREATED=0
  if grep -q '^PORT=' "$ENV_FILE"; then sudo sed -i "s/^PORT=.*/PORT=$PORT/" "$ENV_FILE"; else echo "PORT=$PORT" | sudo tee -a "$ENV_FILE" >/dev/null; fi
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
sudo tee "/etc/systemd/system/$SERVICE.service" >/dev/null <<UNIT
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
# one file per site in /etc/caddy/sites, the main Caddyfile only imports them – other sites stay untouched
say "Caddy: Site-Block fuer $DOMAIN"
sudo mkdir -p /etc/caddy/sites
{
  cat <<CADDY
$DOMAIN {
	reverse_proxy localhost:$PORT
	encode gzip zstd
}
CADDY
  if yesno "$WWW_REDIRECT"; then
    cat <<CADDY

www.$DOMAIN {
	redir https://$DOMAIN{uri} permanent
}
CADDY
  fi
} | sudo tee "/etc/caddy/sites/$SERVICE.caddy" >/dev/null
if [ ! -f /etc/caddy/Caddyfile ]; then
  echo "import sites/*.caddy" | sudo tee /etc/caddy/Caddyfile >/dev/null
elif ! grep -q 'import sites/\*\.caddy' /etc/caddy/Caddyfile; then
  # older setups wrote the site straight into the Caddyfile: keep a copy, switch to the import layout
  sudo cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S)"
  echo "import sites/*.caddy" | sudo tee /etc/caddy/Caddyfile >/dev/null
fi
sudo caddy validate --config /etc/caddy/Caddyfile >/dev/null
sudo systemctl enable caddy >/dev/null
sudo systemctl reload caddy || sudo systemctl restart caddy

# ---------------------------------------------------------------- dynamic dns (optional)
if yesno "$SETUP_DDNS"; then
  say "Dynamic-DNS-Script + Cron"
  DDNS_BIN="/usr/local/bin/$SERVICE-ddns.sh"
  sudo tee "$DDNS_BIN" >/dev/null <<'DDNS'
#!/bin/bash
# Keeps the A-records for @ (and www) of __DOMAIN__ at Vercel DNS pointed at the current public IP.
set -e
source "__ENV_FILE__"
[ -n "${VERCEL_TOKEN:-}" ] || { echo "VERCEL_TOKEN fehlt in __ENV_FILE__"; exit 0; }
DOMAIN="${DDNS_DOMAIN:-__DOMAIN__}"
NAMES="__NAMES__"
IP=$(curl -4 -fs https://ifconfig.me) || exit 0
API="https://api.vercel.com"
H="Authorization: Bearer $VERCEL_TOKEN"
# domains owned by a Vercel team need ?teamId=... on every call
Q=""; [ -n "${VERCEL_TEAM_ID:-}" ] && Q="teamId=$VERCEL_TEAM_ID"
RECORDS=$(curl -fs -H "$H" "$API/v4/domains/$DOMAIN/records?limit=100${Q:+&$Q}") || { echo "$(date) listing records failed (token scope / team id?)"; exit 1; }
for NAME in $NAMES; do
  [ "$NAME" = "@" ] && NAME=""
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
  NAMES="@"; yesno "$WWW_REDIRECT" && NAMES="@ www"
  sudo sed -i "s#__DOMAIN__#$DOMAIN#g; s#__ENV_FILE__#$ENV_FILE#g; s#__NAMES__#$NAMES#g" "$DDNS_BIN"
  sudo chmod +x "$DDNS_BIN"
  sudo touch "/var/log/$SERVICE-ddns.log" && sudo chown "$USER_NAME" "/var/log/$SERVICE-ddns.log"
  CRON_LINE="*/5 * * * * $DDNS_BIN >> /var/log/$SERVICE-ddns.log 2>&1"
  ( crontab -l 2>/dev/null | grep -v "$DDNS_BIN" || true; echo "$CRON_LINE" ) | crontab -
fi

# ---------------------------------------------------------------- summary
PUBLIC_IP="$(curl -4 -fs https://ifconfig.me || echo '?')"
LAN_IP="$(hostname -I | awk '{print $1}')"
say "Fertig"
cat <<SUMMARY

  Site:        http://$LAN_IP:$PORT  (LAN)   ->  https://$DOMAIN (sobald DNS + Router stehen)
  App-Dienst:  sudo systemctl status $SERVICE     Logs: journalctl -u $SERVICE -f
  Caddy:       /etc/caddy/sites/$SERVICE.caddy     Logs: journalctl -u caddy -f
  Env:         $ENV_FILE  (danach: sudo systemctl restart $SERVICE)
  Daten:       $DATA_DIR/vensin.sqlite   Uploads: $DATA_DIR/uploads
SUMMARY
if yesno "$SETUP_DDNS"; then
  echo "  DDNS:        /usr/local/bin/$SERVICE-ddns.sh, alle 5 min, Log /var/log/$SERVICE-ddns.log"
fi
cat <<TODO

Noch zu tun:
  1. $ENV_FILE ausfuellen (ADMIN_PASSWORD, Discord, Backup, VERCEL_TOKEN ...), dann: sudo systemctl restart $SERVICE
  2. Backup einspielen: sudo systemctl stop $SERVICE; Datei nach $DATA_DIR/vensin.sqlite; sudo systemctl start $SERVICE
  3. Router: diesem Rechner ($LAN_IP) eine feste LAN-IP geben, TCP 80 und 443 weiterleiten
  4. DNS: A-Records @ (und www) auf $PUBLIC_IP
     (mit VERCEL_TOKEN einmal /usr/local/bin/$SERVICE-ddns.sh ausfuehren, das legt sie an)
  5. Von aussen testen (Handy ohne WLAN): https://$DOMAIN
TODO
if [ "$ENV_CREATED" -eq 1 ]; then
  echo
  echo "  Hinweis: $ENV_FILE wurde neu angelegt und ist noch weitgehend leer."
fi
