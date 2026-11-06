#!/usr/bin/env bash
# SessionStart (startup): грязная основная рабочая копия — это, скорее всего, работа другой
# сессии. Новая сессия уходит в свой worktree, чтобы не читать чужие полуготовые файлы
# и не уносить их в свой коммит. Что напечатано в stdout, попадает в контекст сессии.
set -euo pipefail

# Уже в worktree — у него свой индекс, делить нечего.
[ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] || exit 0

status=$(git status --porcelain --untracked-files=normal)
[ -n "$status" ] || exit 0

cat <<MSG
Основная рабочая копия грязная: в ней незакоммиченная работа, скорее всего другой сессии.
Первым действием, до чтения кода и любых правок, перейди в свой worktree — EnterWorktree,
затем \`make install\` в нём. Файлы ниже — чужие: не правь, не коммить, не опирайся на них
как на код main.

$(printf '%s\n' "$status" | head -20)
MSG
