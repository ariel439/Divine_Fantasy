# Art Style and Image Generation Guide

This document provides a comprehensive guide for generating all visual assets for "Divine Fantasy," ensuring a consistent and immersive art style that reflects the game's gritty, low-fantasy world.

## 1. Core Philosophy & Tools

All art assets, including character portraits and location backgrounds, should adhere to a cohesive aesthetic.

*   **Primary Tool:** An AI image generator capable of producing high-quality, detailed images, such as **DALL-E 3** (via ChatGPT Plus or Microsoft Copilot).
*   **Core Aesthetic:** The game's style is **semi-realistic digital painting**. It should feel grounded, gritty, and atmospheric. Avoid overly stylized, cartoonish, or high-fantasy visuals. The mood is generally somber and dramatic.

---

## 2. Character Portraits

### 2.1. Baseline Prompt for Characters

Every character portrait prompt **must** begin with this foundational block. It establishes the core mood, lighting, and texture.

> "A semi-realistic, digital painting of a character portrait in a gritty, dark fantasy style. The lighting is dramatic and moody, reminiscent of chiaroscuro, with a single light source casting deep shadows. The color palette is desaturated and earthy. The portrait is framed from the head and shoulders. The background is simple and textured, subtly hinting at the character's environment with color and material without being distracting."

### 2.2. Creating a Character Prompt

To create a prompt for a specific character, append their unique description to the baseline prompt.

**Example for Captain Elias:**

> [Baseline Prompt] + "The character is an old, salty sea captain in his late 50s. His face is deeply tanned and weather-beaten... He wears a heavy, dark oilskin coat... His expression is a mix of gruffness and a hint of a storyteller's charm. The background is a dark, weathered wood texture with a cool, misty tint, suggesting the bulkhead of a ship's cabin."

---

## 3. Location Backgrounds

### 3.1. Core Principles for Locations

*   **Aspect Ratio:** All location images **must** be generated at a **3:2 aspect ratio** to fit the new locations UI layout. Existing 1:1 images remain acceptable for legacy screens, but new assets should follow 3:2.
*   **Perspective:** The viewpoint should be from a street-level or slightly elevated perspective, as if the player is standing there.
*   **Aesthetic:** Dark, gritty, and realistic. The mood should be somber and atmospheric. Avoid overly vibrant colors.

### 3.2. Baseline Prompt for Locations

Every location prompt should start with this block to ensure consistency.

> "A semi-realistic, digital painting of a location in a gritty, dark fantasy world. The perspective is from the street-level of a person standing there. The lighting is overcast and moody, casting soft shadows. The color palette is desaturated and earthy. The style is grounded and realistic, with a focus on texture and atmosphere."

### 3.3. City-Specific Guidelines: Driftwatch

Driftwatch is a poor, gritty coastal city. The architecture should reflect this.

*   **The Slums:**
    *   **Materials:** Predominantly weathered, rotting wood. Ramshackle construction.
    *   **Atmosphere:** Crowded, dirty, and oppressive. Narrow alleyways, makeshift repairs, and a general sense of decay.
    *   **Details:** Puddles of murky water, scattered refuse, patched-up roofs.

*   **Main Street:**
    *   **Materials:** A mix of rough-hewn wood and basic, functional stonework (cobblestone streets, stone foundations).
    *   **Atmosphere:** A step up from the slums but still modest and worn.
    *   **Buildings:** Simple shops and the orphanage. Structures are more stable than in the slums but lack fine decoration.

*   **The Noble Area:**
    *   **Materials:** Primarily rough, local quarry stone. Not polished marble. Some timber-framing.
    *   **Atmosphere:** Cleaner and more orderly, but still understated. Functional rather than ornate.

### 3.4. Creating a Location Prompt

Combine the baseline prompt with specific details from the guidelines.

**Example for Blacksmith's Forge (Interior):**

> [Location Baseline Prompt] + "The interior of a blacksmith's forge. The room is dark and soot-stained. The bright, hot glow of the forge is the primary light source, casting deep, dramatic shadows. Tools are well-used and scattered around workbenches. The air looks thick with smoke and heat."

---

## 4. Item Icons

This section defines the style and prompt structure for item icons, aligned with the overall art direction.

### 4.1. Core Prompt Formula

Use the following formula to construct consistent item icon prompts:

**Formula:** `[Subject] + [Description] + [Style] + [Framing]`

- **Subject:** A clear and simple declaration of the item (e.g., "A single wooden arrow").
- **Description:** Adjectives and details about condition, material, and key features (e.g., "with a stone tip and feather fletching, slightly uneven and handmade").
- **Style:** Painterly dark medieval fantasy; fantasy RPG inventory icon style.
- **Framing:** Isolated on a transparent background.

### 4.2. Best-Practice Examples

- **Wooden Arrow:**
  > "A single wooden arrow with a stone tip and feather fletching, slightly uneven and handmade, depicted as a fantasy RPG inventory icon, painterly style, isolated on a transparent background."

- **Crude Knife:**
  > "A crude, hand-forged knife with a chipped blade and a simple wooden handle, looking rugged and utilitarian, in a dark medieval fantasy RPG inventory icon style, isolated on a transparent background."

- **Cooked Flounder:**
  > "A cooked flounder fish, golden-brown and slightly crispy, presented as an inventory icon, with steam rising and subtle grill marks, in a painterly dark medieval fantasy style, isolated on a transparent background."

### 4.3. Prompts for New Quest Items

Prompts for Roberta's "Planks for the Past" quest items:

- **Old Axe:**
  > "A rusty and worn old woodcutting axe with a sturdy, dark-wood handle, its steel head pitted and aged but still sharp, in a painterly dark medieval fantasy style, presented as an RPG inventory icon, isolated on a transparent background."

- **Sturdy Wood:**
  > "A stack of three rough, circular cuts of sturdy wood logs, showing prominent grain and bark on the edges, presented as an RPG inventory icon for a crafting material, in a painterly dark medieval fantasy style, isolated on a transparent background."

- **Wooden Planks:**
  > "A small, neat stack of freshly cut wooden planks, showing clean grain and a light sawdust coating, presented as an RPG inventory icon for a crafting material, in a painterly dark medieval fantasy style, isolated on a transparent background."

---

## 5. Location Prompts (Driftwatch)

Use the Location Baseline Prompt with city-specific details.

### 5.1. Driftwatch Hub

> [Location Baseline Prompt] + "Driftwatch’s central hub square, a worn coastal city center with rough timber storefronts and basic stone foundations. Weathered wooden stalls, patched signage, and salt-stained planks. Overcast, cool light; damp cobbles with puddles reflecting lanterns. Sparse townsfolk silhouettes, muted colors, gritty textures. Aspect ratio 3:2."

### 5.2. Driftwatch Docks

> [Location Baseline Prompt] + "A gritty, working-class harbor with weathered piers, thick mooring ropes, crates and barrels, and small fishing boats with patched sails. Salt spray, gulls, tar-stained wood, and rusted iron fittings. Cool, desaturated palette; misty horizon and damp surfaces. Lanterns glow faintly in overcast light. Aspect ratio 3:2."
