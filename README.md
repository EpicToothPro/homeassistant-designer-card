# Designer Card (Home Assistant Custom Card)

A visual **Design UI** for Lovelace that lets you style and compose cards via a simple editor UI,
while still saving plain YAML underneath. Ships with a few **pre-designed templates** to get you started.

- Card type: `custom:designer-card`
- Includes a **GUI editor** (no YAML required) but works great with YAML.
- Pre-designed templates in `/card-templates`.

## Features
- Title, icon, and entity selection.
- Background color/gradient, text color, padding, border radius.
- Optional header/footer text.
- Compact/normal/large density.
- Live preview while editing.
- Emits standard `tap_action`, `hold_action` options.
- Lightweight (no build step required).

> This is a minimal starter to prove the concept. You can extend it with drag & drop, grids, and reusable templates.

## Installation

### Option A — HACS (Custom Repository)
1. In HACS → `Integrations` → **three dots** → `Custom repositories`.
2. Add this repo URL and set category to **Lovelace**.
3. Install **Designer Card**.
4. In *Settings → Dashboards → Resources*, ensure a resource was added automatically. If not, add:
   - **URL**: `/hacsfiles/designer-card/designer-card.js`
   - **Type**: `JavaScript Module`

### Option B — Manual
1. Copy the `designer-card.js` file into `<config>/www/designer-card/` (create the folder if needed).
2. Go to *Settings → Dashboards → Resources* and add:
   - **URL**: `/local/designer-card/designer-card.js`
   - **Type**: `JavaScript Module`

## Usage
Add a **Manual card** or via UI and select **Designer Card**.

```yaml
type: custom:designer-card
title: Living Room
entity: light.living_room
style:
  background: linear-gradient(90deg, #ff9800, #ffc107)
  color: "#111"
  padding: 16
  radius: 20
icon: mdi:lightbulb-on
density: normal
tap_action:
  action: toggle
```

### Using Templates
Copy any file from `/card-templates` into your dashboard and tweak values.

```yaml
# Example
!include /config/www/designer-card/card-templates/light.yaml
```

Or just open a template file, copy its YAML and paste into a manual card.

## File Structure
```
designer-card/
├── designer-card.js          # The custom card (no build step needed)
├── hacs.json                 # HACS metadata
├── LICENSE
├── README.md
└── card-templates/
    ├── light.yaml
    ├── media.yaml
    ├── sensor.yaml
    └── scene.yaml
```

## Credits
- Inspired by Mushroom, Button Card, and Card Mod.
- Licensed under MIT.
```)
