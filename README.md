# @oth/tasks

CLI + MCP server that connects a GitHub repo to **[OTHCanva](https://github.com/OverTimeHosting/OTHCanva)**, OverTimeHosting's internal task tracker, and exposes task tools to AI agents over MCP.

Run it once in any repo your AI assistants work in, and the agent can create tasks, log bugs, update statuses, and add comments — all attributed back to itself.

## Install

```sh
# global (recommended for dev)
npm install -g @oth/tasks
# or run on demand
npx @oth/tasks init
```

## Quick start

```sh
cd ~/code/my-repo
oth init
# → opens browser, you sign in to OTHCanva, pick or create a project, approve
# → writes .othcanva.json in the repo and a per-user token to ~/.othcanva/
# → patches .mcp.json so Claude Code/Desktop loads the MCP server
```

Then in the same repo:

```sh
claude
# → the `oth-tasks` MCP server appears with 12 tools
```

## Commands

| Command | What it does |
|---|---|
| `oth init` | Connect this repo. Browser-flow auth, writes configs, patches `.mcp.json`. |
| `oth login` | Refresh the token for an already-connected repo. |
| `oth status` | Show current project + token age + last-used. |
| `oth mcp` | Run the bundled MCP server over stdio (this is what `.mcp.json` invokes). |
| `oth project create <name>` | Create a new project and switch this repo to it. |
| `oth project use <id>` | Point this repo at an existing project. |

Override the API URL with `--api-base <url>` or `OTH_API_BASE=…`.

## MCP tools

Once connected, the agent has access to these stdio-served tools (zod-validated inputs, agent attribution flagged server-side):

`oth_create_task` · `oth_list_tasks` · `oth_get_task` · `oth_update_task` · `oth_move_status` · `oth_add_comment` · `oth_report_bug` · `oth_log_change` · `oth_list_field_sets` · `oth_apply_field_set` · `oth_create_field_set` · `oth_add_field_to_set`

## Config layout

```
<repo>/.othcanva.json           # { projectId, apiBase } — safe to commit
~/.othcanva/credentials.json    # { tokens: { <projectId>: { value, createdAt } } } — never commit
<repo>/.mcp.json                # gets an "oth-tasks" entry added
```

## License

MIT © OverTimeHosting
