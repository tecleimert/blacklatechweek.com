# blacklatechweek.com

The live Black L.A. Tech Week site. Static — no build step, no dependencies.

## Structure

```
index.html              the whole site: home, About tab, BLAIR's page
assets/                 photography, org + partner logos, team headshots (webp)
netlify.toml            headers, redirects, functions config
robots.txt · sitemap.xml
netlify/functions/
  speak.mts             ElevenLabs text-to-speech for BLAIR
dropin/                 internal: the previous site with BLAIR attached (noindex)
```

`index.html` is the source of truth. It carries its own CSS and JS inline —
one file, so there is nothing to compile and nothing to install.

## The site

One document, three views, switched by the nav and the URL hash:

| hash | view |
|---|---|
| *(none)* | home — hero, what this is, the twelve orgs, 2025 impact, the week, guest book |
| `#about` | the board and the partners |
| `#blair` | BLAIR's own page — orb, voice, chat |

Deep links into any view work; a hash belonging to another view switches to it.

## BLAIR

Scripted intent matching over what the site publishes — no live model, and she
says "I don't know" rather than inventing. Her knowledge is the `KB` array near
the top of the script; each entry is trigger words, an HTML answer, and the
follow-up chips. Adding a topic means adding one object.

**Voice** resolves in order: a pre-recorded line → `/api/speak` (this site's own
ElevenLabs key) → a fallback endpoint → the browser's synthesizer. Today the
fallback carries her. Setting `ELEVENLABS_API_KEY` in the Netlify environment
moves her onto this site's own key with no code change; `ELEVENLABS_VOICE_ID`
pins the chosen voice.

Words highlight as she speaks them, timed from the audio's own clock.

## The week

The sixteen event tiles are inline in `index.html`, generated from the team's
calendar sheet. Each links to its Partiful. To change the schedule, edit the
tiles in the `.days-14` grid.

## Guest book

Posts to Netlify Forms as `guestbook`, with a honeypot field for spam. Names and
what people are building appear on the public wall; emails go only to the
organizers. Submissions are in the Netlify dashboard under Forms.

## Analytics

Google Analytics 4, measurement ID `G-KQH57G9EXF` (property *Black L.A. Tech
Week*, under the TEC Leimert account). The tag is in the `<head>` of
`index.html`.

Because the whole site is one document, `gtag('config', …)` runs with
`send_page_view: false` and the view router sends a `page_view` itself on every
tab change — so **The Week**, **About** and **Ask BLAIR** appear as `/`,
`/about` and `/blair` in reports instead of collapsing into one page. A 2-second
timer in the head sends a default `page_view` if the router never fires, so a
script error can't cost you the hit.

Signing the guest book fires `generate_lead` (`method: guest_book`). Outbound
clicks to Partiful, scrolls and file downloads come free from GA's enhanced
measurement.

## Deploying

Drag this folder into Netlify, or connect this repo to the site and let pushes
deploy it. The live site is the Netlify project holding `blacklatechweek.com`.

## Redirects

The previous site's indexed URLs are preserved in `netlify.toml`:
`/events/*` and `/blog` → the matching place on this site, so search results
and shared links don't 404.
