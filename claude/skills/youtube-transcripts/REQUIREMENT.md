---
name: youtube-transcripts
description: Why the transcript fetch stays in the CLI, and why fetching stops short of reading
---

# Youtube transcripts requirement

## Gap

Without this skill, a pasted video link turns into captions printed in chat, which persist nowhere and cannot be cited by a later session. The file is the point. A transcript saved with its metadata is context the repository holds, and a transcript in a message is context that ends with the turn.

A session that fetches on its own gets the shape wrong. Raw captions carry timing cues and duplicated lines, and a file written without frontmatter has no title, no source URL, and no way to tell which video it came from. Reimplementing the cleanup also duplicates logic the CLI already owns, so the two drift and the drift shows up as inconsistent files rather than as an error.

Two smaller failures follow the fetch. A video with no captions produces a file that looks empty rather than one reported as having none, so the user reads it as a failed fetch. And a session that summarizes what it fetched answers a question nobody asked, spending context on a reading the user may not want yet.

## Must

- Run the CLI, which owns the fetch, the caption cleanup, and the frontmatter
- Surface the written path as a full relative path so the terminal makes it clickable
- Report a video with no captions as a fact about the video, since the file still exists and carries its metadata
- Name the missing external binary and stop, leaving the install to the user

## Must not

- Reimplement the fetch or the cleanup
- Summarize or annotate the transcript unasked, which is a separate request against the file
- Install the external binary the command shells out to

## Guards

- No URL stops, since there is nothing to fetch
- A link that is not a YouTube URL stops rather than attempting a generic fetch the command cannot do

## Out of scope

- Downloading the video or its audio
- Summarizing a transcript already on disk, which is a read of that file
- Choosing where transcripts live, which the command defaults and a flag overrides
