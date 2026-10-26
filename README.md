# HTML Invasion

**Live demo:** <https://skipperkongen.github.io/htmlinvasion/> · <https://skipperkongen.dk/demos/htmlinvasion/>

An ASCII art attack helicopter that flies over a web page, radios in each target, and shoots the
page's elements away one at a time, to the tune of Ride of the Valkyries.

```
     ________________________________
  /                ||
 x             _--/--\___
/ \\-----_____|        \_\_
   `-----ARMY______________)== <--
                __/__\___
```

Made by Pimin Konstantin Kefaloukos and Rasmus Frederiksen. Originally written in 2011, brought back to
life in 2026.

## Try the demo

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
```

Then open <http://localhost:8000/> and press **Launch Attack Helicopter**. Turn the sound on. Press
**Abort mission** to stop, and reload the page to undo the damage.

## Use it on any website with the bookmarklet

The bookmarklet adds a **Launch Attack Helicopter** button to whatever page you're on.

1. Host the files from this repository at a public https URL (for example with GitHub Pages).
2. Open `index.html` from that URL. The **Files hosted at** box fills in that URL automatically, and you
   can edit it if the files are somewhere else.
3. Show your bookmarks bar (`Ctrl`+`Shift`+`B`, or `Cmd`+`Shift`+`B` on a Mac) and drag the green
   **Attack Helicopter** button onto it. If you can't drag (for example on a phone), copy the code from
   the box below the button, and paste it as the URL of a new bookmark.
4. On any website, click the bookmark, then click the **Launch Attack Helicopter** button that appears in
   the bottom right corner.

The bookmarklet loads `attackhelicopter.js` and the sound files from the hosted URL, and jQuery from
`code.jquery.com`. It hands the page's own `$` and `jQuery` back afterwards, so the site keeps working.
Everything happens in your browser tab only.

Some sites, such as GitHub and most banks, have a Content Security Policy that blocks scripts from other
domains. The bookmarklet shows an alert when that happens.

## Add it to your own page

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="attackhelicopter.js"></script>
<button onclick="invasion.toggle()">Launch</button>
```

Keep the mp3 files in the same folder as `attackhelicopter.js`. The script finds them from its own URL.

Start the helicopter from a click or key press. Browsers block sound that starts without one.

| Function | What it does |
| --- | --- |
| `invasion.launch()` | Start the attack. Does nothing if a helicopter is already flying. |
| `invasion.abort()` | Stop the attack, silence the sounds and remove the helicopter. |
| `invasion.toggle()` | Launch or abort. Returns `true` if the helicopter is now flying. |
| `invasion.isRunning()` | Whether a helicopter is flying. |
| `invasion.addLaunchButton()` | Add a floating Launch/Abort button in the bottom right corner. |

### Protect elements

Add the class `invasion-ignore` to an element, and the helicopter leaves it and everything inside it
alone. The demo page uses this for the top bar and the bookmarklet instructions.

## How it picks targets

The helicopter only shoots visible elements that contain no other visible elements, so a page is
destroyed from the inside out. A container becomes a target once everything inside it is gone. When
nothing is left, it flies to the top left corner and declares the mission accomplished.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Demo page, bookmarklet and instructions |
| `attackhelicopter.js` | The helicopter (requires jQuery) |
| `gun.mp3`, `radio.mp3` | Sound effects |
| `wagner_comp.mp3` | Soundtrack: Ride of the Valkyries by Richard Wagner |
