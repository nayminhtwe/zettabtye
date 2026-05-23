# Gill Sans fonts

Gill Sans is a **licensed** font. You must have a valid license to ship it in your app.

## Required files (Metro / Android)

These `.ttf` files must exist in this folder:

| File | Used for |
|------|----------|
| `GillSans-Regular.ttf` | Weight 400 |
| `GillSans-SemiBold.ttf` | Weight 600 |
| `GillSans-Bold.ttf` | Weight 700 |

`.ttc` collections are **not** supported by Metro bundler — use `.ttf` only.

## Setup (macOS)

From the project root:

```bash
npm run fonts:setup
```

Requires Python 3 and `fonttools` (`pip3 install fonttools`). The script extracts the three `.ttf` files from the system `GillSans.ttc`.

## Usage in code

```javascript
import { gillSans } from "../constants/fonts";

const styles = StyleSheet.create({
  title: {
    ...gillSans("600"),
    fontSize: 32,
  },
});
```
