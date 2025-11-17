// AI-UI Semantic Layer Demo
// Demonstrates how semantic manifests map to DOM fields and enable constraint validation

// Embedded manifest (normally loaded from spec/ai-ui.example.json)
const manifest = {
  "$schema": "./action.schema.json",
  "site": "demo.ai-ui",
  "version": "0.1.0",
  "goals": [
    {
      "id": "find_cheap_flight",
      "description": "Return the lowest-cost itinerary within the specified constraints."
    }
  ],
  "stateModels": {
    "booking": {
      "description": "Represents a flight booking intent or confirmed reservation.",
      "fields": [
        {
          "name": "id",
          "type": "string",
          "description": "Client-generated unique identifier for this booking."
        },
        {
          "name": "status",
          "type": "string",
          "description": "Current lifecycle status of the booking."
        }
      ],
      "statuses": ["draft", "quoted", "confirmed", "cancelled"]
    }
  },
  "actions": [
    {
      "id": "search_flights",
      "title": "Search Flights",
      "description": "Query available flights for a city pair within specified date and budget constraints.",
      "inputs": [
        {
          "name": "origin",
          "type": "text",
          "required": true,
          "constraints": {
            "pattern": "^[A-Z]{3}$",
            "description": "IATA airport code (3 uppercase letters)."
          }
        },
        {
          "name": "destination",
          "type": "text",
          "required": true,
          "constraints": {
            "pattern": "^[A-Z]{3}$",
            "description": "IATA airport code (3 uppercase letters)."
          }
        },
        {
          "name": "date_range",
          "type": "date-range",
          "required": true,
          "constraints": {
            "format": "YYYY-MM-DD/YYYY-MM-DD",
            "description": "Date range in format: start_date/end_date"
          }
        },
        {
          "name": "max_budget",
          "type": "currency",
          "required": false,
          "constraints": {
            "minimum": 100,
            "currency": "USD",
            "description": "Maximum budget in USD (minimum $100)."
          }
        }
      ],
      "outputs": [
        {
          "name": "results",
          "description": "Array of itinerary summaries sorted by price (ascending)."
        }
      ],
      "ui_hint": {
        "formSelector": "#flight-search",
        "fieldSelectors": {
          "origin": "#origin",
          "destination": "#destination",
          "date_range": "#date-range",
          "max_budget": "#max-budget"
        }
      },
      "executionPolicy": {
        "dry_run_default": true
      }
    }
  ]
};

const thoughtsEl = document.getElementById('agent-thoughts');
const traceEl = document.getElementById('trace-viewer');
const button = document.getElementById('simulate-agent');

// Validation functions
function validateIATA(value) {
  return /^[A-Z]{3}$/.test(value);
}

function validateDateRange(value) {
  const parts = value.split('/');
  if (parts.length !== 2) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(parts[0]) && dateRegex.test(parts[1]);
}

function validateBudget(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 100;
}

// Add agent thought with animation
function addThought(message, type = 'default') {
  const thought = document.createElement('div');
  thought.className = `agent-thought ${type}`;
  thought.textContent = message;
  thoughtsEl.appendChild(thought);
  thoughtsEl.scrollTop = thoughtsEl.scrollHeight;
  return thought;
}

// Clear highlights
function clearHighlights() {
  document.querySelectorAll('.highlighted').forEach(el => {
    el.classList.remove('highlighted');
  });
  document.querySelectorAll('.validation-message').forEach(el => {
    el.textContent = '';
    el.className = 'validation-message';
  });
  document.querySelectorAll('input').forEach(el => {
    el.classList.remove('invalid');
  });
}

// Highlight and validate field
function highlightField(selector, slotName, value, constraints) {
  const field = document.querySelector(selector);
  const validationEl = document.getElementById(`${slotName.replace('_', '-')}-validation`);
  
  if (!field) return { valid: false, message: 'Field not found' };
  
  field.classList.add('highlighted');
  
  let valid = true;
  let message = '';
  
  if (constraints.pattern) {
    const regex = new RegExp(constraints.pattern);
    valid = regex.test(value);
    if (!valid) {
      message = `Invalid format: ${constraints.description || 'does not match pattern'}`;
      field.classList.add('invalid');
    } else {
      message = 'Valid';
      validationEl.classList.add('valid');
    }
  } else if (constraints.format) {
    if (slotName === 'date_range') {
      valid = validateDateRange(value);
      if (!valid) {
        message = 'Invalid date range format (use YYYY-MM-DD/YYYY-MM-DD)';
        field.classList.add('invalid');
      } else {
        message = 'Valid date range';
        validationEl.classList.add('valid');
      }
    }
  } else if (constraints.minimum !== undefined) {
    valid = validateBudget(value);
    if (!valid) {
      message = `Budget must be at least $${constraints.minimum}`;
      field.classList.add('invalid');
    } else {
      message = 'Valid budget';
      validationEl.classList.add('valid');
    }
  }
  
  if (validationEl) {
    validationEl.textContent = message;
  }
  
  return { valid, message };
}

// Build trace object
function buildTrace(action, goal, inputs, validationResults, steps) {
  return {
    traceId: `trace-${Date.now()}`,
    goal: goal.description,
    goalId: manifest.goals[0].id,
    actionId: action.id,
    inputs: inputs,
    validationResults: validationResults,
    steps: steps,
    resultSummary: validationResults.every(r => r.valid) 
      ? `Goal "${goal.description}" accomplished via ${action.id} (dry-run mode).`
      : 'Validation failed. Cannot proceed to execution.',
    provenance: [
      { source: 'manifest', detail: 'spec/ai-ui.example.json' },
      { source: 'dom', detail: action.ui_hint.formSelector }
    ]
  };
}

// Simulate agent execution with a goal
async function simulateAgent() {
  button.disabled = true;
  thoughtsEl.innerHTML = '';
  traceEl.textContent = '// Building trace...';
  clearHighlights();
  
  // Define the agent's goal
  const goal = {
    description: 'Find a flight from SFO to JFK under $400',
    origin: 'SFO',
    destination: 'JFK',
    dateRange: '2025-01-10/2025-01-15',
    maxBudget: '400'
  };
  
  const steps = [];
  const validationResults = [];
  
  // Step 1: Agent receives goal
  await new Promise(resolve => setTimeout(resolve, 500));
  addThought(`Goal: ${goal.description}`, 'step');
  addThought('Reading semantic manifest (not scraping DOM)...', 'default');
  
  // Step 2: Agent finds matching action from semantic layer
  await new Promise(resolve => setTimeout(resolve, 600));
  const action = manifest.actions.find(a => a.id === 'search_flights');
  if (!action) {
    addThought('Error: No matching action found for goal', 'error');
    button.disabled = false;
    return;
  }
  
  addThought(`\nFound semantic action: "${action.title}" (${action.id})`, 'success');
  addThought(`   Working with semantic concepts, not DOM structure`, 'default');
  addThought(`   Matches goal: ${manifest.goals[0].description}`, 'default');
  
  // Step 3: Agent maps goal parameters to action inputs
  await new Promise(resolve => setTimeout(resolve, 500));
  addThought('\nMapping goal parameters to action inputs:', 'step');
  const inputs = {
    origin: goal.origin,
    destination: goal.destination,
    date_range: goal.dateRange,
    max_budget: goal.maxBudget
  };
  
  action.inputs.forEach(input => {
    const value = inputs[input.name];
    if (value) {
      addThought(`   ${input.name}: "${value}" (from goal)`, 'default');
    } else if (input.required) {
      addThought(`   ${input.name}: missing (required)`, 'error');
    }
  });
  
  // Step 4: Agent uses ui_hint to bind semantic slots to DOM (optional binding)
  await new Promise(resolve => setTimeout(resolve, 500));
  addThought('\nBinding semantic slots to DOM via ui_hint (optional)...', 'step');
  addThought('   Note: Semantic layer is independent of DOM structure', 'default');
  if (action.ui_hint && action.ui_hint.fieldSelectors) {
    Object.entries(action.ui_hint.fieldSelectors).forEach(([slotName, selector]) => {
      addThought(`   ${slotName} → ${selector}`, 'default');
    });
  }
  
  // Step 5: Agent fills form with goal values (only after semantic validation)
  await new Promise(resolve => setTimeout(resolve, 500));
  addThought('\nFilling DOM fields (UI can change; semantic action stays stable)...', 'step');
  Object.entries(inputs).forEach(([slotName, value]) => {
    const selector = action.ui_hint?.fieldSelectors?.[slotName];
    if (selector) {
      const field = document.querySelector(selector);
      if (field) {
        field.value = value;
        addThought(`   Set ${selector} = "${value}"`, 'default');
      }
    }
  });
  
  // Step 6: Validate constraints
  await new Promise(resolve => setTimeout(resolve, 500));
  addThought('\nValidating constraints...', 'step');
  
  for (const input of action.inputs) {
    const value = inputs[input.name];
    const selector = action.ui_hint?.fieldSelectors?.[input.name];
    
    if (input.required && !value) {
      addThought(`   ${input.name}: Required field is empty`, 'error');
      validationResults.push({ slot: input.name, valid: false, reason: 'Required field empty' });
      continue;
    }
    
    if (value && input.constraints) {
      const result = highlightField(selector, input.name, value, input.constraints);
      validationResults.push({ 
        slot: input.name, 
        valid: result.valid, 
        reason: result.valid ? 'Passed' : result.message 
      });
      
      if (result.valid) {
        addThought(`   ${input.name}: ${result.message}`, 'success');
      } else {
        addThought(`   ${input.name}: ${result.message}`, 'error');
      }
    } else if (value) {
      validationResults.push({ slot: input.name, valid: true, reason: 'No constraints' });
      addThought(`   ${input.name}: Valid (no constraints)`, 'success');
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Step 7: Determine execution mode
  await new Promise(resolve => setTimeout(resolve, 500));
  const allValid = validationResults.every(r => r.valid);
  
  if (allValid) {
    addThought('\nAll validations passed', 'success');
    addThought(`   Execution mode: ${action.executionPolicy?.dry_run_default ? 'DRY-RUN' : 'EXECUTE'}`, 'step');
    addThought('   Ready to submit form to accomplish goal', 'default');
    
    steps.push({
      step: 1,
      time: new Date().toISOString(),
      note: `Received goal: ${goal.description}`
    });
    steps.push({
      step: 2,
      time: new Date().toISOString(),
      note: `Selected action: ${action.id} (matches goal: ${manifest.goals[0].id})`
    });
    steps.push({
      step: 3,
      time: new Date().toISOString(),
      note: 'Mapped goal parameters to action inputs'
    });
    steps.push({
      step: 4,
      time: new Date().toISOString(),
      note: 'Filled form fields with goal values'
    });
    steps.push({
      step: 5,
      time: new Date().toISOString(),
      note: 'Validated all input constraints'
    });
    steps.push({
      step: 6,
      time: new Date().toISOString(),
      note: `Executed in ${action.executionPolicy?.dry_run_default ? 'dry-run' : 'execute'} mode`
    });
  } else {
    addThought('\nValidation failed. Cannot proceed.', 'error');
    addThought('   Invalid fields must be corrected before execution.', 'default');
  }
  
  // Step 8: Generate trace
  await new Promise(resolve => setTimeout(resolve, 500));
  addThought('\nGenerating execution trace...', 'step');
  
  const trace = buildTrace(action, goal, inputs, validationResults, steps);
  traceEl.textContent = JSON.stringify(trace, null, 2);
  
  addThought('Trace complete. Goal accomplished via semantic action.', 'success');
  
  button.disabled = false;
}

// Event listener
button.addEventListener('click', simulateAgent);

// Real-time validation on input
const action = manifest.actions[0];
if (action && action.ui_hint) {
  Object.entries(action.ui_hint.fieldSelectors).forEach(([slotName, selector]) => {
    const field = document.querySelector(selector);
    const inputDef = action.inputs.find(i => i.name === slotName);
    
    if (field && inputDef && inputDef.constraints) {
      field.addEventListener('blur', () => {
        const value = field.value;
        if (value) {
          highlightField(selector, slotName, value, inputDef.constraints);
        }
      });
    }
  });
}
