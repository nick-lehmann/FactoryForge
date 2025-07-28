# FactoryForge Cursor Rules

## Code Style Rules

### Function Structure

Whenever you declare a function with a name, use the `function` keyword. Avoid using const declarations with arrow functions.

### Svelte Component Structure

1. Script tag with imports first
2. Component props and state variables
3. Component functions (using early return pattern)
4. Component markup
5. Component styles

### SvelteFlow Specific

1. Define node types at the top level
2. Create custom node components for specialized behaviors
3. Define connection rules that follow domain logic (outputs → inputs)
4. Use descriptive labels for nodes and connections 

### Typescript

1. Every code must be typesafe.
2. Explicit `any`s are forbidden
3. Data from untrusted sources (network, filesystem, user input) is to be typed as `unknown` and validated. 


### Early Return Pattern

Always use early returns (guard clauses) instead of nesting code inside conditionals. This makes the code more readable by reducing indentation levels and clarifying the function's flow.

**Example:**
```typescript
// ✅ DO THIS
function processData(data) {
  // Guard clause - exit early if condition not met
  if (!data) {
    return;
  }
  
  // Main logic at the same indentation level
  processValidData(data);
}

// ❌ AVOID THIS
function processData(data) {
  if (data) {
    processValidData(data);
  }
}
```

### Loops

Whenever possible, use `for...of` loops instead of `.forEach` loops. While the two options are identical, the first is a lot more readable.  

When the for loop contains only one statement, do not add parentheses.