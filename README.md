# Dialed.gg Color Helper

A Chrome extension that displays HSB (Hue, Saturation, Brightness) color values for colors on [dialed.gg](https://dialed.gg), helping you learn to recreate colors.

## Features

- **Real-time color detection**: Automatically identifies the dominant color on the dialed.gg page
- **HSB display**: Shows Hue (0-360°), Saturation (0-100%), and Brightness (0-100%) values
- **Hex color code**: Displays the hex equivalent of the detected color
- **Visual indicators**: Shows gradient sliders for each HSB component with position indicators
- **Color family hints**: Provides helpful tips about the color family and characteristics
- **Toggle overlay**: Hide/show the overlay with a single click
- **Responsive design**: Fixed overlay in the bottom-right corner with monospace font for precise reading

## Installation

1. Clone this repository or download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension will now be active on dialed.gg pages

## How It Works

The extension uses several techniques to accurately identify and display colors:

### Color Detection Algorithm

1. **DOM Scanning**: Scans all `<div>` and `<canvas>` elements on the page
2. **Size Filtering**: Focuses on elements larger than ~100×100 pixels (10,000 pixels²)
3. **Color Validation**: Uses the `isVividColor()` function to filter out:
   - Pure black backgrounds (page background)
   - Grayscale colors (low saturation range)
   - Very dark colors (max RGB < 20)
   - Near-white colors with low saturation

### Polling Strategy

- **Polling Interval**: Scans every 120ms for color changes
- **Mutation Observer**: Also watches for DOM mutations to catch when the game initializes
- **Deduplication**: Only updates the overlay if the detected color changes (hex value differs)

### Color Format Conversion

Converts RGB values to HSB using the standard algorithm:
- Normalizes RGB values (0-255 → 0-1)
- Calculates max, min, and delta values
- Computes Hue, Saturation, and Brightness components
- Rounds to readable integer values

## Files

- **manifest.json**: Chrome extension manifest with permissions and content script configuration
- **contents.js**: Main extension logic including color detection, conversion, and overlay rendering

## Technical Details

### Manifest (Manifest V3)
- Runs on URLs matching `*://dialed.gg/*`
- Executes at `document_idle` to avoid interfering with page initialization
- Includes icon references for the extension

### Content Script (contents.js)
- **Helper Functions**:
  - `rgbToHsb()`: Converts RGB to HSB color space
  - `parseBgColor()`: Extracts RGB values from computed styles
  - `isVividColor()`: Validates color vibrancy
  - `toHex()`: Converts RGB to hexadecimal

- **Overlay**: 
  - Fixed positioning overlay with monospace font
  - Displays color swatch, hex value, and HSB sliders
  - Includes color family classification tips
  - Toggle button to collapse/expand display

## Color Family Tips

The extension provides quick classification hints:
- **Hue-based**: Red, Yellow/Orange, Green, Teal/Cyan, Blue, Purple/Pink families
- **Saturation-based**: Low saturation (nearly grey) vs. very vivid colors
- **Brightness-based**: Dark vs. bright classification

## Version

1.0

## License

Unlicensed - Educational extension for dialed.gg color learning
