# Design System Specification
**Theme**: Rivian-Inspired Technical Premium
**Color Space**: Oklch

## Core Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold)
- **Usage**: Clean, sans-serif, technical feel.

## Color Palette (Oklch)
- **Background**: White (Light) / Deep Forest Slate (Dark)
- **Primary**: Compass Yellow (`oklch(0.81 0.17 82.8)`)
- **Foreground**: Sharp Black / High-Contrast White
- **Muted**: Soft technical grays.

## UI Principles (The "Wow" Factor)
1.  **Glassmorphism**: Use `backdrop-blur-md` and semi-transparent backgrounds (`bg-background/80`) for modals and sidebars.
2.  **Depth**: Use `shadow-lg` and `shadow-2xl` for floating elements (cards, modals).
3.  **Motion**:
    -   Hover effects: `hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`.
    -   Page Transitions: Smooth fade-in (`animate-in fade-in`).
4.  **Borders**: Subtle borders (`border-white/10` in dark mode) to define edges without heavy lines.

## Component Standards
### Buttons
- **Primary**: `bg-primary text-primary-foreground shadow-md hover:shadow-lg rounded-lg px-4 py-2 font-medium transition-all active:scale-95`.
- **Ghost**: `hover:bg-accent hover:text-accent-foreground`.

### Cards
- **Container**: `bg-card text-card-foreground border border-border/50 shadow-sm rounded-xl p-6`.

## Planned Improvements (Phase 6)
- [ ] Add `glass` utility class to `index.html` styles for consistent reuse.
- [ ] Apply "Mesh Gradient" background animation to Auth pages.
- [ ] Refactor `Sidebar` to use "Floating Island" design (detached from edge).
