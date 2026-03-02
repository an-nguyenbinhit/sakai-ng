---
description: Rules for using PrimeNG v21 with Tailwind CSS v4 in this project
---

# PrimeNG v21 & TailwindCSS Guidelines

This project uses PrimeNG v21 with Tailwind CSS v4 under the PrimeUI architecture. Keep the following rules in mind:

1. **Unstyled Mode / Aura Preset**:
   - The project avoids traditional PrimeNG structural CSS files and heavily relies on Tailwind CSS via PrimeUI plugin.
   - You can use Tailwind classes everywhere. Use PrimeNG components for logic and base structure, but you can style them mostly using standard utility classes.
   - Avoid overriding PrimeNG deeply nested classes manually. Use the provided PassThrough (`[pt]`) properties or the Tailwind configuration for presets.

2. **PrimeNG Component Imports**:
   - Import explicitly from the component path (e.g., `import { ButtonModule } from 'primeng/button';`).
   - Add them to the `imports:` array of the standalone component.
   
3. **Icons / PrimeIcons**:
   - This project uses `primeicons`. To include an icon use the `pi pi-<icon-name>` classes.
   - Example: `<i class="pi pi-check text-green-500"></i>`

4. **Dark Mode Integration**:
   - Dark mode uses standard `.app-dark` class applied to the HTML root.
   - Use Tailwind's dark modifier (e.g. `dark:bg-surface-900`) if custom styles are needed, aligning with PrimeUI's surface colors.
