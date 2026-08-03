---
name: setup-plugins
description: Why plugin installs read a curated catalog, install user-scoped, and never touch toolkit workflow skills
---

# Setup plugins requirement

## Gap

Without this skill, a session asked to install plugins invents marketplace sources and install strings from names it half remembers, and a plugin name that does not exist fails in a way that reads like a network problem. The catalog is the difference between an install and a guess.

Scope is the failure that shows up later. A domain plugin installed into one project is missing from the next one, so the machine looks provisioned until the user opens another repository. The mirror mistake is treating toolkit workflow skills as plugins to install, when they load live through a plugin directory and a copied version goes stale the moment it lands.

Two failures come from running the batch carelessly. A reinstall over a plugin already present costs time and can replace a working version. And a batch that aborts on the first failure leaves a partial install with no record of which rows ran, so the next attempt starts from an unknown state.

## Must

- Read the curated catalog through the skill's own directory, so the path resolves from any project
- Detect what is already installed and skip those rows
- Install user-scoped, since a domain plugin belongs to the machine rather than to one project
- Run each install independently so one failure does not abort the batch
- Preview the chosen rows, the scope, and the exact commands before executing
- Report the failures with their CLI errors, the reload requirement, and the settings-level remedy for an over-triggering plugin

## Must not

- Install a plugin, marketplace, or command string that is not in the catalog
- Install toolkit workflow skills, which load live rather than being copied
- Reinstall a plugin already present
- Pause for a confirmation beyond the tool permission dialog

## Guards

- The `claude` CLI absent from PATH stops before any install, since every step shells out to it
- A catalog row that installs outside the plugin CLI runs its own installer verbatim rather than being forced through the marketplace path

## Out of scope

- Curating the catalog, which is an edit to the bundled reference rather than a run of this skill
- Uninstalling, since an over-triggering plugin is tuned through settings rather than removed
- Installing anything into a project, which every setup skill but this one does
- First-time project scaffolding: `setup-init`
