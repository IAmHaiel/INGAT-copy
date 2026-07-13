# Tailwind Styling Conventions for INGAT

This guide defines the layout and color decisions for INGAT, designed to create a warm, trustworthy, and premium aesthetic.

## 1. Color Palette
We extend Tailwind's default configuration with a customized set of semantic and Material Design colors:
- **Primary (`#005145`)**: Deep green representing stability and guardianship.
- **Primary Container (`#0f6b5c`)**: Vibrant mid-green for buttons and action cards.
- **Secondary (`#835400`) / Secondary Container (`#feb64e`)**: Warm ambers representing growth, family care, and wealth.
- **Background (`#FAF7F2`)**: Warm off-white to contrast the green/amber themes.
- **Surface (`#f7faf7`) / Surface Container (`#ebefec`)**: Very light warm gray-greens.
- **Error (`#ba1a1a`)**: Clear red for warnings.

## 2. Typography
Use **Manrope** Google font. Set up specific sizes and line heights in config:
- `headline-lg`: 32px (large landing headlines)
- `headline-md`: 20px (dashboard headings)
- `body-md`: 16px (standard reading text)
- `label-md`: 14px (interactive buttons and input labels)

## 3. Glassmorphism & Bento Layouts
- **Glassmorphism**: Use `backdrop-filter: blur(12px)` and subtle borders (`border-white/30`) to elevate dashboard and landing components.
- **Bento Grid**: Arrange dashboard statistics, allocation history, and action panels into clean grid slots of varying dimensions.
