# Configuration Schema

This document describes the initial structure of `config/config.yaml` used by **Profunda Immersio**.

## boardSizes
Array of predefined board dimensions available to the player. Each entry contains:

- `name` – identifier shown in the UI
- `dimensions` – `[width, depth, height]` measured in cells

## depthColors
List of colors used for each depth level of the game board. The list can contain up to 16 entries. Colors should be provided in HEX format.

## blocks.shapes
Collection of block shape definitions. Each shape has:

- `name` – short identifier
- `pattern` – symbolic text representation where `X` marks a filled cell. Patterns may span multiple lines.

## scoring
Parameters that control score calculation.

- `lineClearBase` – points for clearing a single layer
- `accelerationFactor` – multiplier for score when the game speeds up

## difficultyLevels
Defines initial timer values for different difficulty settings. Additional fields may be added later for score multipliers or acceleration.

## controls.rotationSystem
List of available rotation systems such as `SRS` or `ARS`.

## controls.joystickMapping
Mapping between joystick axes and actions. For example:

```yaml
left:
  x: rotateY
  y: rotateX
right:
  x: moveX
  y: moveZ
```

The game will read these values to interpret controller input.
