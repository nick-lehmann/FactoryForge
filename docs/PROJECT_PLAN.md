# FactoryForge Project Plan

This document captures the project plan, intentions, and answers to key questions about the FactoryForge development.

## Project Timeline

This is a recreational hobby project without a specific timeline for completion. Implementation of features like machine types and recipes will progress at a casual pace based on available time and interest.

## Questions & Answers

### 1. Current Status & Timeline

**Q: What's your timeline for implementing the various machine types and recipes?**

A: "I do not have any specific timeline for this. It is recreational hobby project."

### 2. Data Sources

**Q: Will you be manually implementing the game data (machines, recipes, resources), or do you plan to import it from an external source/API?**

A: "In the beginning, I will implement a few machines, resources and recipes by hand. Later, I will try to import this information from the official Satisfactory wiki."

### 3. Documentation Structure

**Q: The `Machine.md` file exists but is empty. Do you plan to document each machine type with its properties?**

A: "Almost identical to the answer to question 2. In the beginning, I want to start with a hand-picked set of machines, resources and recipes. Later, when the foundation is done, I will try to import this information from the Satisfactory wiki."

### 4. Planned Features

**Q: Are you considering additional features beyond the factory planner, such as production calculation, power consumption estimation, optimization suggestions, or map integration?**

A: "Yes, out of your four recommendations, I plan to add the following three:
- Production calculation (items per minute)
- Power consumption estimation
- Optimization suggestions"

### 5. User Experience

**Q: How do you envision users interacting with the app? Will they be able to save/load factory designs, or share them with others?**

A: "Yes, users will be able to create new factories and save them, load already created designs and tinker with them.

Sharing with others is not planned currently. While I might deploy this later, this project will only run on my local computer for quite some time."

### 6. Database Integration

**Q: What database features do you plan to implement for persistence?**

A: "I will start with SQLite. Later, I might want to experience with graph-based databases." 