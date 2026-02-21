---
description: Tailwind CSS Styling Rules
---

# Tailwind CSS Styling Rules

1.  **Avoid Standard Size/Spacing Classes:** In this project, standard Tailwind size/spacing classes (like `w-14`, `w-11`, `max-w-7xl`, etc.) sometimes do not apply correctly, possibly due to configuration issues or the way CSS is generated/purged.
2.  **Use Arbitrary Values:** When specifying dimensions (width, height, max-width, margin, padding), always prefer using arbitrary values with brackets to ensure the styling is applied (e.g., `w-[50px]`, `h-[24px]`, `w-[100%]`, `max-w-[1280px]`).
3.  **Examples:**
    *   **Incorrect:** `className="w-14 h-7"`
    *   **Correct:** `className="w-[56px] h-[28px]"`
    *   **Incorrect:** `className="w-11 h-6"`
    *   **Correct:** `className="w-[44px] h-[24px]"`
