# Anki image setup

Use `yokosawa-handrange.png` as the shared image file name.

## Option A: Import CSV with image HTML

Import `anki-handrange-with-image.csv`.

Field mapping:

- Field 1: Front
- Field 2: Back
- Allow HTML in fields

Then add `yokosawa-handrange.png` to Anki media.

## Option B: Keep CSV clean and add image in card template

Import `anki-handrange.csv`, then edit the card back template:

```html
{{Back}}

<br><br>
<img src="yokosawa-handrange.png" style="max-width: 100%; height: auto;">
```

After syncing AnkiWeb, the same image appears on AnkiMobile and AnkiDroid.
