# Claude Code commands

Built-in slash commands available in every Claude Code session. Some commands depend on your plan, platform, or environment and may not appear for all users.

## Session management

- `/clear`: clear conversation history and free up context
- `/compact [instructions]`: compress conversation history with optional focus instructions
- `/resume [session]`: resume a conversation by ID, name, or open the session picker
- `/branch [name]`: create a branch of the current conversation
- `/rename [name]`: rename the current session
- `/rewind`: rewind the conversation to a previous point
- `/exit`: exit the CLI

## Code and files

- `/add-dir <path>`: add a working directory for file access in the current session
- `/diff`: open an interactive diff viewer for uncommitted changes
- `/copy [N]`: copy the last assistant response to clipboard, or the Nth-latest
- `/export [filename]`: export the current conversation as plain text
- `/security-review`: analyze pending changes on the current branch for security issues

## Planning and tasks

- `/plan [description]`: enter plan mode
- `/tasks`: list and manage background tasks
- `/btw <question>`: ask a quick side question without adding to conversation history

## Configuration

- `/config`: open the settings interface
- `/model [model]`: select or change the active model
- `/effort [low|medium|high|max|auto]`: set the model effort level
- `/fast [on|off]`: toggle fast mode
- `/theme`: change the color theme
- `/color [color|default]`: set the prompt bar color for the current session
- `/keybindings`: open or create the keybindings configuration file
- `/statusline`: configure the status line
- `/terminal-setup`: configure terminal keybindings for Shift+Enter and other shortcuts

## Project setup

- `/init`: initialize the project with a `CLAUDE.md` file
- `/memory`: edit `CLAUDE.md` memory files or toggle auto-memory
- `/permissions`: manage allow, ask, and deny rules for tool permissions
- `/hooks`: view hook configurations for tool events

## Integrations

- `/mcp`: manage MCP server connections and OAuth authentication
- `/ide`: manage IDE integrations and show connection status
- `/plugin`: manage Claude Code plugins
- `/reload-plugins`: reload all active plugins to apply pending changes
- `/agents`: manage agent configurations
- `/remote-control`: make the current session available for remote control from claude.ai
- `/schedule [description]`: create, update, list, or run scheduled tasks

## Information

- `/help`: show available commands
- `/context`: visualize current context usage
- `/cost`: show token usage for the session
- `/stats`: show daily usage, session history, and model preferences
- `/status`: show version, model, account, and connectivity
- `/usage`: show plan usage limits and rate limit status
- `/skills`: list available skills
- `/debug`: enable debug logging for the session
- `/doctor`: diagnose the Claude Code installation and settings
- `/release-notes`: view the changelog
- `/feedback [report]`: submit feedback about Claude Code

## Account

- `/login`: sign in to your Anthropic account
- `/logout`: sign out from your Anthropic account
- `/upgrade`: open the upgrade page to switch to a higher plan tier
- `/privacy-settings`: view and update privacy settings
- `/extra-usage`: configure extra usage when rate limits are hit
- `/passes`: share a free week of Claude Code with friends

## Platform and admin

- `/setup-bedrock`: configure Amazon Bedrock authentication, region, and model pins
- `/install-github-app`: set up the Claude GitHub Actions app for a repository
- `/install-slack-app`: install the Claude Slack app
- `/chrome`: configure Claude in Chrome settings
- `/desktop`: continue the current session in the Claude Code desktop app
- `/mobile`: show a QR code to download the Claude mobile app
- `/stickers`: order Claude Code stickers
- `/sandbox`: toggle sandbox mode
- `/remote-env`: configure the default remote environment for web sessions
- `/voice`: toggle push-to-talk voice dictation

## Notes

MCP servers can expose prompts that appear as commands using the format `/mcp__<server>__<prompt>`. Skills bundled with Claude Code (like `/simplify`, `/loop`, and `/schedule`) also appear alongside built-in commands.
