# Solver-Planner Integration

The solver has been successfully integrated with the visual flow planner. Users can now automatically generate production chains for any item and visualize them in the flow diagram with proper hierarchical tree layout.

## How to Use

### 1. Open the Solver

- Press `Cmd+K` (or `Ctrl+K`) to open the command palette
- Select "🧮 Production Solver" from the top of the list

### 2. Select Target Item

- Search for any buildable item in the game
- Choose from items that can be produced by machines (excludes raw materials and workshop items)
- Items are sorted alphabetically and show descriptions + sink points

### 3. Set Production Rate

- Enter the desired production rate in items per minute
- Default is 10 items/min, but you can specify any amount from 1 to 1000

### 4. Generate Production Chain

- Click "🧮 Solve Production" to run the solver
- The solver will automatically:
  - Find the optimal production chain
  - Calculate building requirements
  - Create flow nodes and connections
  - Position everything in a proper tree layout using Dagre

## Visual Features

### Tree Layout with Dagre

- **Hierarchical Structure**: Uses Dagre library for professional tree layout
- **Top-to-Bottom Flow**: Production flows from finished products (top) to raw materials (bottom)
- **Smart Spacing**: Nodes are automatically spaced to prevent overlaps
- **Clean Edges**: Connections follow optimal paths between nodes

### Solver-Generated Content

- **Blue Border**: All solver-generated nodes have a blue border and glow effect
- **Blue Edges**: Connections between solver-generated nodes are highlighted in blue
- **Handle Positioning**: Nodes are properly oriented with top/bottom handles for vertical flow

### Node Types

- **Production Nodes**: Show the building, recipe, and required quantity
- **Source Nodes**: Show raw material extraction points with required amounts
- **Mixed Content**: You can combine solver-generated and manually placed nodes

## Technical Details

### Layout Engine

- **Dagre Integration**: Uses @dagrejs/dagre for hierarchical graph layout
- **Configuration**:
  - Top-to-bottom orientation (`rankdir: 'TB'`)
  - 50px node separation
  - 100px rank separation
  - 20px margins
- **Node Sizing**: 172x120px nodes optimized for readability

### Data Flow

1. User selects item and quantity in `SolverCommandPalette`
2. `solve()` function generates a `RecipeNode` tree
3. `convertSolverResultToFlow()` transforms tree into SvelteFlow nodes/edges
4. Dagre calculates optimal hierarchical layout during conversion
5. `markSolverGenerated()` adds visual indicators
6. New content is merged with existing graph

### Integration Points

- **Command Palette**: Solver option added to building selector
- **Store Integration**: Uses `satisfactoryDataStore` for game data
- **Flow Components**: Reuses existing `ProductionNode` and `SourceNode`
- **Persistence**: Solver-generated content is saved/restored with graph state

### Node Data Extensions

Solver-generated nodes include additional metadata:

```typescript
{
  solverGenerated: boolean;     // Marks content as auto-generated
  buildingCount?: number;       // For production nodes
  requiredAmount?: number;      // For source nodes
  targetPosition?: Position;    // Top for vertical flow
  sourcePosition?: Position;    // Bottom for vertical flow
}
```

## Advantages Over Manual Layout

### Professional Appearance

- **No Overlaps**: Dagre ensures nodes never overlap
- **Consistent Spacing**: Uniform distances between related nodes
- **Proper Hierarchy**: Clear visual representation of production dependencies
- **Optimal Routing**: Edges follow the shortest, cleanest paths

### Scalability

- **Large Trees**: Handles complex production chains gracefully
- **Performance**: Efficient layout calculation even for many nodes
- **Maintainability**: Layout updates automatically when tree structure changes

## Limitations & Future Improvements

### Current Limitations

- Always chooses first available recipe (no optimization)
- Fixed top-to-bottom orientation (could support left-to-right)
- No power consumption visualization
- No resource node capacity consideration

### Possible Enhancements

- **Recipe Optimization**: Choose most efficient recipes
- **Layout Options**: Support horizontal or radial layouts
- **Power Analysis**: Show total power requirements
- **Cost Analysis**: Calculate building and material costs
- **Resource Planning**: Consider node extraction rates
- **Multi-Target**: Solve for multiple items simultaneously
- **Conflict Resolution**: Handle recipe conflicts intelligently
- **Layout Customization**: Allow users to adjust spacing and orientation

## Error Handling

- **No Recipe Found**: Shows error if item cannot be produced
- **Circular Dependencies**: Detected and prevented
- **Missing Buildings**: Graceful fallback if building data missing
- **Data Loading**: Waits for satisfactory data to load before solving

## User Experience

### Workflow Integration

1. Start with manual factory planning
2. Use solver for complex sub-assemblies
3. Combine auto-generated and manual content
4. Iterate and refine as needed

### Visual Feedback

- Loading states during solving
- Clear error messages for failures
- Blue highlights for generated content
- Professional tree layout with proper spacing

The integration provides a powerful workflow where users can mix manual factory design with automated production chain generation. The Dagre-powered tree layout ensures that even complex production chains are displayed clearly and professionally, making factory planning much more accessible and visually appealing.
