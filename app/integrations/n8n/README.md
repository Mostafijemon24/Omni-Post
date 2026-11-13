# n8n workflows for OmniPost

Import each file in n8n: **Workflows → Import from file**.

1. In OmniPost, open **Integrations → REST API → Generate key**, name it `n8n`, and copy the key (shown once).
2. In n8n, create a credential of type **Header Auth** named `OmniPost API`:
   - Name: `Authorization`
   - Value: `Bearer opk_…` (your key)
3. Open each imported workflow, select that credential on the HTTP Request nodes, and activate it.

| File | What it does |
| --- | --- |
| `omnipost-ai-drafts-daily.json` | Every morning, asks OmniPost to write posts for four platforms and saves them as drafts for you to review. Uses a free OpenRouter model (`…:free`) by default. |
| `omnipost-publish-due-posts.json` | Every 5 minutes, fetches scheduled posts whose time has come, hands each to a publishing node you add (Facebook, LinkedIn, X…), then marks it published in OmniPost. |

Replace the placeholder node in the publish workflow with n8n's node for your network. If publishing fails,
send `PATCH /api/v1/posts/{id}` with `{"status":"failed","last_error":"…"}` so it shows up in OmniPost.

## About ChatGPT free accounts

n8n can't use a free ChatGPT (chatgpt.com) account: its OpenAI node needs an OpenAI **API** key, which is
billed separately from ChatGPT plans. For no-cost AI, these workflows call OmniPost's `/api/v1/generate`,
which uses OpenRouter; models whose id ends in `:free` are free with rate limits.

The full API is described at `https://post.avonixai.com/api/v1/openapi.json`.
