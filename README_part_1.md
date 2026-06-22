# DHT: WSL and cluster onboarding

This guide explains **how** to connect your Windows/WSL environment to NVIDIA DHT (Digital Human Technology) infrastructure for `dir_cosmos_gen`, and **why** each step exists. It is a friendlier companion to the internal “DHT WSL/Cluster Onboarding” document.

---

## What you will be able to do

- SSH into AWS cluster **login nodes**, **data copier (dc)** nodes, and **VS Code** nodes without typing full hostnames every time.
- Use **large shared storage** under `/project/cosmos` instead of filling your small home directory.
- Run **Slurm** jobs (CPU or GPU) from scripts that match how the team works.
- Optionally **mount** cluster storage into WSL for moving files back and forth.

---

## Part A — Prerequisites (accounts and access)

### A.1 WSL: Ubuntu 24.04 and username

**Do this first:** Install WSL with **Ubuntu 24.04** (not 22.04), and create a Linux username that **matches your NVIDIA Unix username**.

**Why:** Paths, Slurm submit checks, and shared instructions assume the same name locally and on the cluster. A mismatch causes subtle permission, mount, and `rsync` path bugs that are painful to debug.

### A.2 WSL setup guide: Docker and NGC

Follow your corporate WSL setup guide so **Docker** works in WSL and **NGC** is configured.

**Why:** Later steps build and run containers; NGC is used for NVIDIA registry access. For NGC login, use organization **nvidian** with **no team** when that is what the guide specifies.

### A.3 NVIDIA Unix account (bash shell)

Request or confirm a **NVIDIA Unix account** and set the default shell to **bash** (via ITSS).

**Why:** Cluster automation, dotfiles, and team scripts assume bash.

### A.4 Access groups and PPP

- Join the **cosmos cluster** DL group (e.g. `access-dir-cosmos-gen`) via **`#dht-cosmos-onboarding`** on Slack.
- Complete **dir_cosmos_gen PPP** onboarding (same Slack; Confluence has PPP details).

**Why:** Without these, you cannot submit jobs, access shared storage, or use team resources.

### A.5 LastPass

Join **LastPassUser** via dlrequest, wait for activation email (check junk), activate, install browser extension, log in with NVIDIA credentials.

**Why:** Shared secrets (e.g. API keys) are distributed through LastPass rather than email or chat.

### A.6 Lepton API key

Request access on **`#dht-cosmos-onboarding`**. After approval, copy **`COSMOS_API_KEY`** from LastPass (Vault → right-click → Copy Password).

**Why:** Some workflows authenticate to internal services with this key; you will export it on the cluster.

---

## Part B — SSH from WSL to the cluster

### B.1 Why a dedicated key

Use a **separate** SSH key for the AWS CS cluster (not your GitLab key). That limits blast radius if a key is ever compromised and keeps `~/.ssh/config` unambiguous.

Generate:

```bash
mkdir -p ~/.ssh
cd ~/.ssh
ssh-keygen -t ed25519 -C "aws-iad-cs-login.nvidia.com"
# Save as e.g. ~/.ssh/id_ed25519_aws-iad-cs-login (not the default id_ed25519)
```

### B.2 `~/.ssh/config` entries

**Why:** Short host aliases (`ssh aws-iad-cs-002`) and the correct key per host avoid mistakes under time pressure.

Add blocks similar to (replace `<NVIDIA_USERNAME>` with your Unix username):

```sshconfig
Host gitlab-master.nvidia.com
    HostName gitlab-master.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    Port 12051
    User git
    IdentityFile ~/.ssh/id_ed25519_git-master
    IdentitiesOnly yes

Host aws-iad-cs-002
    HostName aws-iad-cs-002-login-01.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-login-01
    HostName aws-iad-cs-002-login-01.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-login-02
    HostName aws-iad-cs-002-login-02.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-login-03
    HostName aws-iad-cs-002-login-03.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-dc-01
    HostName aws-iad-cs-002-dc-01.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-dc-02
    HostName aws-iad-cs-002-dc-02.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-dc-03
    HostName aws-iad-cs-002-dc-03.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes

Host aws-iad-cs-002-vscode-01
    HostName aws-iad-cs-002-vscode-01.nvidia.com
    PreferredAuthentications publickey
    AddKeysToAgent yes
    User <NVIDIA_USERNAME>
    IdentityFile ~/.ssh/id_ed25519_aws-iad-cs-login
    IdentitiesOnly yes
```

**If you already use a different key for GitLab** (e.g. `id_rsa`), point `IdentityFile` for `gitlab-master.nvidia.com` to that key instead of `id_ed25519_git-master`.

### B.3 Install the public key on the login node

**Why:** Password login is not how day-to-day work should happen; `ssh-copy-id` registers your public key once (you may type your password this one time).

```bash
ssh-copy-id -f -i ~/.ssh/id_ed25519_aws-iad-cs-login \
  <NVIDIA_USERNAME>@aws-iad-cs-002-login-01.nvidia.com
```

### B.4 Windows Terminal profiles (optional but convenient)

**Why:** One click opens WSL and SSH together.

Examples:

- Login: `wsl -d Ubuntu-24.04 -- ssh aws-iad-cs-002`
- Data copier: `wsl -d Ubuntu-24.04 -- ssh <NVIDIA_USERNAME>@aws-iad-cs-002-dc-01`
- VS Code node: `wsl -d Ubuntu-24.04 -- ssh <NVIDIA_USERNAME>@aws-iad-cs-002-vscode-01`

Use `wsl --list --verbose` to confirm your distro name.

### B.5 Docker “no GPU” noise in WSL

If Docker complains about GPU in WSL:

```bash
sudo modprobe vgem
```

**Why:** Some setups need this module so NVIDIA’s stack stops erroring during bring-up.

---

## Part C — On the cluster: storage, environment, tools

### C.1 Cosmos user folder symlink

Ask **`#aws-iad-cs-002-support`** to create a symlink so `/project/cosmos/$USER` points at your real directory under lustre, e.g.  
`/lustre/fsw/portfolios/dir/projects/dir_cosmos_gen/users/$USER`.

**Why:** `/project/cosmos` is the team’s working namespace; your data actually lives on scalable lustre. The symlink gives you a short, consistent path.

### C.2 Remote `~/.bashrc` (tokens and cache locations)

Edit **`~/.bashrc` on the login node** (under `/home/<USER>`), not only on WSL.

**Why:**

- Tokens let you pull from GitLab, Hugging Face, and internal APIs non-interactively.
- Default caches (HF, pip, uv, poetry, vLLM, etc.) would fill your **small home quota**. Pointing them under `/project/cosmos/$USER` keeps jobs from failing with “disk quota exceeded”.

Fill in real values before pasting:

```bash
export GITLAB_TOKEN=<from GitLab>
export HF_TOKEN=<from Hugging Face>
export COSMOS_API_KEY=<from LastPass>

export PATH=$PATH:$HOME/.local/bin

export I4_HOME=/project/cosmos/$USER
export IMAGINAIRE_ROOT=$I4_HOME/projects/imaginaire4
export IMAGINAIRE_CACHE_DIR=$I4_HOME/imaginaire4-cache
export IMAGINAIRE_OUTPUT_ROOT=$I4_HOME/imaginaire4-output
export LAUNCHER_LOG_ROOT=$I4_HOME/launcher_logs
export HF_HOME=$I4_HOME/hf-cache

export UV_CACHE_DIR=$I4_HOME/.cache
export PIP_CACHE_DIR=$I4_HOME/.cache
export XDG_CACHE_HOME=$I4_HOME/.cache
export POETRY_CACHE_DIR=$I4_HOME/.cache
export VLLM_CACHE_DIR=$I4_HOME/.cache
```

Then `source ~/.bashrc`.

### C.3 Optional `~/.bash_aliases`

**Why:** Readline bindings and aliases speed up interactive work on slow links. Safe to skip if you prefer a minimal shell.

### C.4 User-level binaries (`~/.local/bin`)

On cluster nodes you often **do not have sudo**.

**Why:** You still need `uv`, `rclone`, `s5cmd`, etc. The onboarding path copies known-good binaries from a team-maintained backup:

```bash
mkdir -p /home/$USER/.local/bin
cp -rf /lustre/fsw/portfolios/dir/users/liling/bin_bk/* /home/$USER/.local/bin
```

Current list typically includes: `virtualenv`, `uv`, `uvx`, `s5cmd`, `rclone`, `pigz`.

**Note:** `ffmpeg` may not work when copied blindly; install via **Miniconda** under **large storage** if needed:

```bash
cd ~
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
# or: curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh
source ~/.bashrc
conda activate base
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
conda install -y -c conda-forge ffmpeg
ffmpeg -version
```

**Why install conda on lustre/project path:** Home quota. **Why conda note for training:** Some training stacks conflict with conda activation—disable conda init in `.bashrc` when switching workflows.

### C.5 Enroot `.sqsh` cache (symlink)

`.sqsh` images are Enroot’s container format.

**Why link instead of copy:** `/project` can be tight; linking reuses a shared cache.

After your `/project/cosmos/$USER` symlink exists:

```bash
mkdir -p /project/cosmos/$USER/cache/
cd /project/cosmos/$USER/cache
ln -s /project/cosmos/mramezanali/cache/enroot-cache .
```

Adjust if your team points you to a different shared cache.

### C.6 `~/.config/dir/config.yaml`

**Why:** Imaginaire / DIR tooling reads S3 profiles, Postgres profiles (benchmarks), and Lepton workspace token from this file during inference and some benchmarks.

Create the file:

```bash
mkdir -p ~/.config/dir
touch ~/.config/dir/config.yaml
```

Paste the structure from the official PDF (aws `s3_profiles`, `postgres` profiles, `lepton.workspace_token`) and fill keys from **Core Storage Portal** / **LastPass** after access is approved. Skip fields you do not yet have; return when you run benchmark jobs that need them.

---

## Part D — GitLab SSH (if not already done)

**Why:** Clone internal repos over SSH without passwords.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_git
cat ~/.ssh/id_ed25519_git.pub
```

Add the public key at GitLab → User Settings → SSH Keys. Test:

```bash
ssh -T git@gitlab-master.nvidia.com
```

GitLab listens on **port 12051**; your `Host gitlab-master.nvidia.com` block must include `Port 12051`.

---

## Part E — WSL: mount cluster storage and spawn Slurm shells

### E.1 `mount_remote.sh` (SSHFS)

**Why:** Exposes `/project` (or similar) under WSL so you can use local tools on large datasets.

From internal repo `hoi-cosmos`, copy scripts to `~/scripts`:

```bash
mkdir -p ~/scripts
cd ~/scripts
# git clone ssh://git@gitlab-master.nvidia.com:12051/lightspeedrtx/digital-human-tech/hoi-cosmos.git
cp hoi-cosmos/source/bash_scripts/mount_remote.sh ~/scripts
cp hoi-cosmos/source/bash_scripts/spawn_remote.sh ~/scripts
chmod +x ~/scripts/mount_remote.sh ~/scripts/spawn_remote.sh
```

Install sshfs in WSL:

```bash
sudo apt update
sudo apt install -y sshfs
```

One-time key setup and mount:

```bash
~/scripts/mount_remote.sh --install-key cosmos
~/scripts/mount_remote.sh --mount cosmos
ls /mnt/project
```

### E.2 `spawn_remote.sh` (interactive Slurm)

**Why:** Gets you a shell **on a compute node** with resources you request, instead of overloading the login node.

On the **remote login node**, create layout directories once:

```bash
mkdir -p /project/cosmos/<NV_USERNAME>/projects/imaginaire4 \
  /project/cosmos/<NV_USERNAME>/imaginaire4-cache \
  /project/cosmos/<NV_USERNAME>/imaginaire4-output \
  /project/cosmos/<NV_USERNAME>/launcher_logs \
  /project/cosmos/<NV_USERNAME>/hf-cache \
  /project/cosmos/<NV_USERNAME>/.cache
```

From **local WSL**, examples:

```bash
# CPU job, ~24h
~/scripts/spawn_remote.sh aws-iad-cs-002 --job-type bash --gpus-per-node 0 \
  --time 23:59:59 --account dir_cosmos_gen --partition cpu-big

# 1 node, 8 GPUs, 8h, interactive partition
~/scripts/spawn_remote.sh aws-iad-cs-002 --job-type bash --gpus-per-node 8 \
  --time 08:00:00 --account dir_cosmos_gen --partition interactive --nodes 1
```

---

## Part F — After onboarding

### F.1 Back up WSL

**Why:** WSL lives on disk; imaging or exporting to non-`C:` storage avoids losing days of setup.

### F.2 Benchmark caveat (onboarded after Jan 2026)

**Why:** If `/project/cosmos/$USER` is only a symlink, some **Yotta** benchmark video generation/scoring paths misbehave.

Mitigations from the PDF:

1. **`job_properties.py`**: Under cluster `aws-iad-cs-002-dir`, set `latest_sqsh_file_path=Path("/project/cosmos/latest_yotta_sqsh.sqsh")` (see internal doc for exact line context).
2. **`make_yotta_golden_images.py`**: `_SLURM_CLUSTERS = ["iad", "cw-pdx", "iad-dir"]`.
3. **`~/.config/dir/config.yaml`**: Ensure required profiles (including **team-dir** where applicable) are filled.
4. Workflow `.sh` files: set cluster to **`aws-iad-cs-002-dir`**, e.g. `${cluster:=aws-iad-cs-002-dir}`.

Skip this entire section if you are not running those benchmarks yet.

---

## Quick checklist

| Step | Purpose |
|------|---------|
| Ubuntu 24.04 + matching username | Same identity local ↔ cluster |
| Groups / PPP / LastPass / API key | Access and secrets |
| Dedicated SSH key + `config` | Safe, convenient logins |
| `ssh-copy-id` | Key-based auth |
| `/project/cosmos` symlink | Large storage + team paths |
| Remote `.bashrc` caches | Avoid home quota failures |
| `~/.local/bin` | Tools without sudo |
| `config.yaml` | S3 / DB / Lepton for DIR workflows |
| `mount_remote` / `spawn_remote` | Data access + Slurm interactive |

---

*Derived from the internal “DHT WSL/Cluster Onboarding Guide.” Hostnames, Slack channels, and GitLab paths are internal NVIDIA resources.*
