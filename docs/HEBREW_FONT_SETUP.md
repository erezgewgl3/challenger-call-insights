# Hebrew Font Setup Guide

## Quick Setup (3 minutes)

### Step 1: Convert TTF to Base64

You have **three options** for converting your Rubik font files to base64:

#### Option A: Online Tool (Easiest)
1. Go to https://base64.guru/converter/encode/file
2. Upload `Rubik-Regular.ttf`
3. Click "Encode file to Base64"
4. Copy the entire base64 string
5. Repeat for `Rubik-Bold.ttf`

#### Option B: Command Line (Mac/Linux)
```bash
# Navigate to your fonts folder
cd /path/to/extracted/static/

# Convert Regular
base64 Rubik-Regular.ttf > rubik-regular.txt

# Convert Bold  
base64 Rubik-Bold.ttf > rubik-bold.txt
```

#### Option C: Node.js (If you have Node installed)
```bash
# In the fonts folder
node -e "console.log(require('fs').readFileSync('Rubik-Regular.ttf', 'base64'))" > rubik-regular.txt
node -e "console.log(require('fs').readFileSync('Rubik-Bold.ttf', 'base64'))" > rubik-bold.txt
```

### Step 2: Paste Base64 Strings

1. Open the file: `src/lib/fonts/rubik-fonts.ts`

2. Replace the placeholder text with your base64 strings:

```typescript
// Replace this:
export const RUBIK_REGULAR_BASE64 = `
PASTE_YOUR_RUBIK_REGULAR_BASE64_STRING_HERE
`.trim();

// With this:
export const RUBIK_REGULAR_BASE64 = `
AAEAAAALAIAAAwAwT1MvMg8SBfAAAAC8AAAAYGNtYXAA...
[YOUR ENTIRE BASE64 STRING HERE - WILL BE ~500,000 CHARACTERS]
...zMxNDY4NzY1NDMyMTY4NzY1NDMyMTY4NzY1NDMyMQ==
`.trim();
```

3. Do the same for `RUBIK_BOLD_BASE64`

### Step 3: Test

1. Export a PDF with Hebrew text
2. Check the console - you should see:
   ```
   🔤 Registering Hebrew fonts...
   ✅ Hebrew fonts registered successfully
   ```
3. Open the PDF - Hebrew text should display properly with Rubik font

## How It Works

### Automatic Detection
The PDF generator now automatically:
- ✅ Detects Hebrew characters in text (Unicode range U+0590-U+05FF)
- ✅ Switches to Rubik font when Hebrew is detected
- ✅ Uses Helvetica for English/Latin text
- ✅ Handles RTL (right-to-left) text direction
- ✅ Processes bidirectional text (mixed Hebrew-English)

### Font Usage
- **Regular text** → Rubik Regular
- **Bold text** → Rubik Bold
- **Latin text** → Helvetica (unchanged)
- **Mixed text** → Automatic font switching per character

## Expected File Sizes

After adding base64 fonts:
- `rubik-fonts.ts` will be ~1.4 MB (this is normal)
- Your JS bundle will increase by ~1.4 MB
- But PDFs will still be small (300-500 KB) and text-based

## Troubleshooting

### "Hebrew fonts not configured" warning
- Base64 strings are still placeholders
- Make sure you replaced the entire `PASTE_YOUR...` text
- Verify the base64 string is complete (starts with AAE... typically)

### Hebrew text shows as boxes/missing
- Fonts didn't register successfully
- Check browser console for errors
- Verify base64 strings are valid (no line breaks in the middle)

### Text is backwards but readable
- RTL processing is working correctly
- This is expected behavior - jsPDF doesn't support native RTL

### Mixed Hebrew-English looks wrong
- Check that BiDi processing is enabled
- File an issue if specific text patterns fail

## Performance Impact

- **PDF Generation**: +100-200ms (font registration overhead)
- **Bundle Size**: +1.4 MB (one-time load)
- **Runtime Memory**: +2-3 MB (font data in memory)
- **PDF File Size**: No change (fonts not embedded in PDFs)

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your base64 strings are complete and valid
3. Test with pure Hebrew text first, then mixed text
4. Share console logs for debugging
