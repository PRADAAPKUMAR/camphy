# Tilted tiles

The shared `TiltedCard` controller in `src/components/TiltedCard.jsx` applies the
React Bits hover treatment to existing `.grade-tile` and `.glass-card-hover`
elements. These cover grade choices, dashboards, paper/topic/resource lists and
other clickable glass tiles, including content mounted by lazy routes and filters.

The controller uses JavaScript and plain CSS. It adds no dependencies and does not
execute a registry installer. Existing contents, responsive dimensions, links,
buttons and navigation behavior are retained. The photo, tooltip and back-face
content in the library demo are not added to navigation tiles.

`src/App.tsx` configures 15-degree rotation, 1.1 hover scale, 0.5 glare and 0.5
shadow. Decorative glass icons move at a depth of 30; new artwork can opt into
`TiltedCardLayer`. Setting `data-tilt="off"` on a tile or ancestor disables it.

Animation uses one shared requestAnimationFrame loop and stops when settled.
Pointer-down and keyboard activation reset the effect before the existing page
transition captures the tile. Touch scrolling, keyboard behavior, and link
modifiers are handled by their existing controls. Reduced motion, forced colors,
focus/reading views and non-hover pointers disable the treatment. Route changes,
scrolling, resize and unmount clean up animation state.

## Reference and attribution

- Requested registry: https://reactbits.dev/r/TiltedCard-JS-CSS.json
- Retrieved from the official repository because the site was blocked here:
  https://raw.githubusercontent.com/DavidHDev/react-bits/main/public/r/TiltedCard-JS-CSS.json
- The registry's `dependencies` and `registryDependencies` lists are both empty.
- Pointer/physics/glare behavior adapted for this website; this is a scoped
  adaptation of the registry component, not its standalone photo/flip API.
- Upstream copyright and license: [React Bits license](vendor/reactbits-license.md).
