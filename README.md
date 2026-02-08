# FactoryForge

A company app that helps you in your playthrough of Satisfactory, a factory building game by Coffee Stain Studios.

## Features

### Node-based Factory planner

FactoryForge provides a node-based editor to plan your factories.

- Nodes are machines
  - Each node represents a buildable machine in game
  - Handles on the left side represent inputs
  - Handles on the right side represent outputs
  - The maximum number of inputs & outputs depend on the type of machine
  - The usable number of inputs & outputs depend on the recipe that is configured for the machine
  - Requires power
    - Base value depends on machine type
    - Changed by clock speed
  - Examples: Smelter, Constructor, Assembler, Manufactorer, Refinery, Foundry
- Resources
  - Found on the map and extracted using an appropriate machine
  - Miners for ores (iron, copper, coal, caterium, bauxite)
  - Oil extractors for crude oil
  - Water extractors for water
- Recipes
  - Specify the basic rules of crafting
  - Define the number, type and amount of input resources
  - Define the number, type and amoutn of output resources
  - Apply to only a single machine
