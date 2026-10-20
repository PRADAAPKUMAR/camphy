# Animated theme toggler

The desktop navigation and mobile Appearance menu share a local adaptation of
[Magic UI's AnimatedThemeToggler](https://magicui.design/docs/components/animated-theme-toggler).
A 400 ms circular reveal expands from the clicked button using the browser's View
Transitions API. No dependencies or registry installers were added.

`src/components/ThemeToggle.tsx` connects the controlled component to the existing
`next-themes` provider. It keeps `physicshq:theme` persistence, early first-paint
selection, the root's `light`/`dark` classes and all theme consumers synchronized.
The theme update does not remount pages, so in-progress work stays available.

Reduced motion, forced colors and browsers without View Transitions/Web Animations
switch immediately. Rapid clicks are guarded across both theme controls, and
skipped transitions or component unmounts clean up the animation. View-transition
styles are active only during a theme reveal, preserving existing tile navigation.

Source retrieved from the official repository because the docs host was blocked:
https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-theme-toggler.tsx

The adaptation retains the default circular reveal and integrates this project's
button styling, accessibility labels, reduced-motion support and theme provider.
Upstream copyright and permission notice: [Magic UI MIT license](vendor/magicui-license.md).
